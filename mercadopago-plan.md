# Mercado Pago Integration Plan

## Overview

Complete the Mercado Pago Checkout API (Orders) integration started in the unstaged changes.
The goal is a secure, end-to-end payment flow: the frontend collects card data via the MP Card Payment Brick,
sends it (plus cart items) to the backend, the backend calls MP's Orders API, and on success creates the
`pedido` + `detalle_pedido` rows in the DB and deducts stock.

**Approach chosen:** Payment-first — DB rows are only created after MP confirms payment.

**Tech stack involved:**
- Backend: Bun + Hono, PostgreSQL (raw `pg` client), Zod validation — `back/`
- Frontend: Astro + React, Zustand cart store — `front/`

## Concurrency & Idempotency Strategy

A UNIQUE constraint on `pago.idempotency_key` alone is **not sufficient**. It prevents two rows from
being committed but cannot stop two concurrent requests from both reaching the MP API during the
2–5 second external call window (the "double-click race condition").

**Solution: PostgreSQL advisory locks (`pg_try_advisory_xact_lock`)**

The backend acquires an exclusive, transaction-scoped advisory lock keyed on the idempotency UUID
*before* calling MP. The lock lives in Postgres (not Node memory), so it works correctly across
multiple backend replicas and process restarts.

```
BEGIN transaction
  pg_try_advisory_xact_lock( hashtext(idempotency_key) )
    → false → return 409 immediately, MP is never called
    → true  → check pago table for existing key
               → found  → COMMIT, return 200 (idempotent replay)
               → not found → call MP API
                              → approved → INSERT pedido + detalle + stock + pago → COMMIT → 201
                              → rejected → ROLLBACK → 402
```

The lock is held for the entire MP call duration. A concurrent duplicate request sees the lock is
taken and returns 409 before ever touching MP. The UNIQUE constraint remains as a last-resort
correctness safety net.

`pg_try_advisory_xact_lock` takes a `bigint`; the UUID is converted via `hashtext(uuid_text)::bigint`
which is deterministic and requires no extra dependencies.

---

## Sub-Tasks

---

### Sub-Task 1 — DB migration: add `pago` table and extend `pedido` status

**Status:** [ ] pending

**Intent**
Add a `pago` table to record every confirmed Mercado Pago payment alongside the `pedido` it produced.
Also ensures the `pedido.status` vocabulary matches the payment-first lifecycle
(`CONFIRMADO` stays valid for success; no other changes to existing rows needed).

**Expected Outcomes**
- A new migration file `back/src/db/migrations/003_add_pago_table.sql` is created and applied.
- The `pago` table exists in the DB with the following columns:
  - `id` SERIAL PRIMARY KEY
  - `pedido_id` INT NOT NULL REFERENCES pedido(id)
  - `mp_payment_id` VARCHAR(100) NOT NULL UNIQUE  — MP's returned payment ID
  - `status` VARCHAR(50) NOT NULL                 — MP payment status string (e.g. "approved")
  - `idempotency_key` UUID NOT NULL UNIQUE        — the X-Idempotency-Key sent on the request
  - `mp_amount` DECIMAL(10,2) NOT NULL            — amount MP charged
  - `payer_email` VARCHAR(150) NOT NULL
  - `created_at` TIMESTAMPTZ NOT NULL DEFAULT NOW()

**Todo List**
- [ ] Create `back/src/db/migrations/003_add_pago_table.sql` with the `CREATE TABLE pago` statement
      including FK to `pedido`, UNIQUE on `mp_payment_id` and `idempotency_key`.
- [ ] Grant `ALL PRIVILEGES` on the new table and its sequence to role `p26_app`
      (mirror the pattern from `docker/init/02-schema.sql`).
- [ ] Apply the migration against the running DB (or note it for docker re-init).

**Relevant Context**
- Existing migration pattern: `back/src/db/migrations/002_add_sesion_table.sql`
- DB role grant pattern: `docker/init/02-schema.sql` lines 58-59
- `pedido` table definition: `docker/init/02-schema.sql` lines 29-38

---

### Sub-Task 2 — Backend: install MP SDK and add environment config

**Status:** [ ] pending

**Intent**
Add the official Mercado Pago Node.js SDK to the backend and configure the secret access token
so the backend can call MP's Orders API.

**Expected Outcomes**
- `@mercadopago/sdk-js` or the server-side `mercadopago` npm package is added to `back/package.json`
  (the correct server-side package is `mercadopago` — `npm:mercadopago`).
- `MERCADOPAGO_ACCESS_TOKEN` is added to `back/.env.example` (and `.env` locally).
- The MP client can be initialized from environment config.

**Todo List**
- [ ] Run `bun add mercadopago` in `back/`.
- [ ] Add `MERCADOPAGO_ACCESS_TOKEN=your_access_token_here` to `back/.env.example`.
- [ ] Add `PUBLIC_MERCADOPAGO_KEY=your_public_key_here` to `front/.env.example` if it doesn't exist.

**Relevant Context**
- Backend runtime: Bun — run commands from `back/` directory.
- `back/index.ts` shows the existing env var pattern (`process.env.PORT`, `process.env.CORS_ORIGINS`).

---

### Sub-Task 3 — Backend: implement `/api/process_order`

**Status:** [ ] pending

**Intent**
Replace the empty stub in `back/src/api/apiRouter.ts` with the full payment-processing handler:
validate the incoming request, generate / validate the idempotency key, call MP's Orders API,
and on success run the order-creation transaction (reusing the stock-check + insert logic from
`crearPedido` in the GraphQL resolver).

**Expected Outcomes**
- `POST /api/process_order` validates the request body with Zod.
- The `X-Idempotency-Key` header (a UUID) is required; requests without it are rejected with 400.
- Idempotency is enforced: if the key already exists in `pago`, return the existing `pedido_id` with 200.
- The handler calls MP Orders API with the payment data.
- On MP approval, a PostgreSQL transaction:
  1. Creates `pedido` with status `CONFIRMADO`.
  2. Inserts `detalle_pedido` rows (prices from DB, not from client).
  3. Deducts stock (using `FOR UPDATE` locking, same as GraphQL `crearPedido`).
  4. Inserts a `pago` row.
- On MP rejection / error, returns 402 with the MP status; no DB writes.
- The handler requires an authenticated session (`getSession`) — returns 401 if not logged in.

**Expected Request Body Shape (from frontend)**
```typescript
{
  // MP payment brick output
  type: "online",
  total_amount: string,         // will be ignored; backend re-fetches prices
  processing_mode: "automatic",
  transactions: {
    payments: [{
      amount: string,
      payment_method: {
        id: string,
        type: string,
        token: string,
        installments: number
      }
    }]
  },
  payer: { email: string, identification: { type: string, number: string } },
  // cart items added by frontend
  items: [{ producto_id: number, cantidad: number }]
}
```

**Todo List**
- [ ] Add a Zod schema `processOrderSchema` in `back/src/validation/schemas.ts` that validates
      the fields above (items array min length 1, producto_id positive int, cantidad positive int,
      payer.email valid email, token non-empty string).
- [ ] In `apiRouter.ts`, read and validate `X-Idempotency-Key` header (must be a valid UUID v4 format);
      return 400 if missing or malformed.
- [ ] Authenticate via `getSession`; return 401 if no session.
- [ ] Acquire a client from the pool (`db.connect()`) and `BEGIN` the transaction immediately.
- [ ] Run `SELECT pg_try_advisory_xact_lock(hashtext($1))` with the idempotency key UUID.
      - If it returns `false`: `ROLLBACK`, release client, return 409 Conflict
        `{ error: "duplicate_request" }` — do NOT call MP.
- [ ] Inside the same transaction, query `SELECT pedido_id FROM pago WHERE idempotency_key = $1`.
      - If found: `COMMIT`, release client, return 200 `{ pedido_id }` (idempotent replay).
- [ ] Initialize the MP `MercadoPagoConfig` + `Orders` client using `MERCADOPAGO_ACCESS_TOKEN`.
- [ ] Build the MP Orders API request object and call `orders.create(...)` while the transaction
      (and therefore the advisory lock) is still open.
- [ ] Inspect the MP response status; if not `approved`: `ROLLBACK`, release client,
      return 402 `{ error: mpStatus }`.
- [ ] Still inside the same transaction: INSERT `pedido`, `detalle_pedido` (prices re-fetched from DB
      with `FOR UPDATE`), stock deduction, INSERT `pago` row.
- [ ] `COMMIT` and release client, return `{ pedido_id, mp_payment_id }` with status 201.
- [ ] Wrap the entire handler in try/catch: on any unexpected error, `ROLLBACK` and release the client
      before re-throwing or returning 500.

**Relevant Context**
- Existing transaction pattern: `back/src/graphql/resolvers.ts` lines 668-885 (`crearPedido`)
- Zod schema pattern: `back/src/validation/schemas.ts`
- Session helper: `back/src/auth/session.ts` → `getSession(c)`
- DB client: `back/src/db/database.ts` → `db.connect()` for transactions
- MP Orders API docs: https://www.mercadopago.com.mx/developers/es/docs/checkout-api-orders/overview

---

### Sub-Task 4 — Frontend: wire cart data and idempotency key into `CheckoutM.tsx`

**Status:** [ ] pending

**Intent**
Fix the hardcoded `external_reference`, hardcoded `amount`, and missing cart items in the
Mercado Pago Brick's `onSubmit` payload. Generate a per-session idempotency key (UUID v4) and
send it as the `X-Idempotency-Key` header.

**Expected Outcomes**
- `CheckoutM.tsx` reads real cart items from the Zustand cart store to compute the real total.
- Cart items (`[{ producto_id, cantidad }]`) are included in the POST body under an `items` key.
- `external_reference` is replaced with a UUID v4 generated once on component mount (stored in a ref).
- The same UUID is sent as the `X-Idempotency-Key` request header.
- `amount` passed to the Brick's `initialization` reflects the real cart total.
- `checkout.astro` passes the real cart total down to `CheckoutComponentM` (or the component
  reads it internally from the store — internal read is cleaner).
- On successful payment response, `clearCart()` is called and the user is redirected to `/orders-history`.
- On failure, an error state is shown (brick calls `reject()` already; add a visible error message).

**Todo List**
- [ ] Import `useCartStore` and `useAuthStore` in `CheckoutM.tsx`.
- [ ] Compute `total` from `items.reduce(...)` inside the component and pass it to Brick `initialization.amount`.
- [ ] On component mount, generate a UUID v4 (`crypto.randomUUID()`) and store in a `ref` so it
      doesn't change across re-renders.
- [ ] In `onSubmit`, add `items: cartItems.map(i => ({ producto_id: i.id, cantidad: i.quantity }))` to
      `submitData`.
- [ ] Remove the hardcoded `external_reference: "ext_ref_1234"` — it is not needed by our backend
      (MP's own payment ID is used as the reference). Or set it to the idempotency UUID for traceability.
- [ ] Add `"X-Idempotency-Key": idempotencyKeyRef.current` to the fetch headers.
- [ ] After `.then(() => resolve())`, call `clearCart()` and `window.location.href = '/orders-history'`.
- [ ] Add a simple error state (e.g. `useState<string | null>`) and display it below the brick
      when `reject()` is called.
- [ ] Remove the `amount` prop from `CheckoutComponentM` since the total is now derived from the store;
      update `checkout.astro` accordingly.

**Relevant Context**
- Cart store: `front/src/store/cartStore.ts`
- Auth store: `front/src/store/authStore.ts`
- `CheckoutM.tsx`: `front/src/components/CheckoutM.tsx`
- `checkout.astro`: `front/src/pages/checkout.astro`
- `crypto.randomUUID()` is available in modern browsers (no extra dependency needed).

---

### Sub-Task 5 — Environment variable wiring and final validation

**Status:** [ ] pending

**Intent**
Ensure both `.env.example` files are complete, that the frontend passes the public key correctly,
and do a final end-to-end smoke check of the whole flow in the local dev environment.

**Expected Outcomes**
- `back/.env.example` contains `MERCADOPAGO_ACCESS_TOKEN`.
- `front/.env.example` (or similar) contains `PUBLIC_MERCADOPAGO_KEY`.
- The `checkout.astro` page correctly reads `PUBLIC_MERCADOPAGO_KEY` from `import.meta.env` and passes
  it to `CheckoutComponentM` — this is already done; just verify it still compiles.
- A test payment using MP's sandbox credentials completes the full flow: brick → backend → MP API →
  DB order created → cart cleared → redirect to orders history.

**Todo List**
- [ ] Confirm `back/.env.example` and `front/.env.example` have all required keys.
- [ ] Verify that `back/index.ts` correctly mounts `apiRouter` at `/api` — already done (line 39).
- [ ] Run backend and frontend dev servers; do a sandbox test payment end-to-end.
- [ ] Verify the `pago` row is inserted and `pedido` row has status `CONFIRMADO` after a successful payment.
- [ ] Verify a duplicate submission with the same `X-Idempotency-Key` returns 200 with the existing
      `pedido_id` without creating a second order.

**Relevant Context**
- MP sandbox test cards: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/test/cards
- Backend entry point: `back/index.ts`
- Frontend checkout page: `front/src/pages/checkout.astro`
