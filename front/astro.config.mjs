// @ts-check
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

//import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
    output: 'server',
    // adapter: netlify(),
    integrations: [react()],
});
