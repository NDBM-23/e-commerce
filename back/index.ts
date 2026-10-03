import { ApolloServer } from '@apollo/server'
import { httpHandler } from '@cypriotunknown/apollo-hono'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

import { typeDefs } from './src/graphql/schema'
import { resolvers } from './src/graphql/resolvers'

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
})

await apollo.start()

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:4321', 'http://localhost:5173'],
  }),
)

app.get('/', (c) => {
  return c.text('Backend funcionando')
})

app.post(
  '/graphql',
  httpHandler(apollo),
)

app.get(
  '/graphql',
  httpHandler(apollo),
)

export default {
  port: (4000),
  fetch: app.fetch,
}
