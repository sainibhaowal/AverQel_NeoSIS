#!/usr/bin/env node

import { Context } from '@averqel/cordis'
import { pathToFileURL } from 'node:url'
import Loader from '@averqel/cordis-plugin-loader'

const ctx = new Context()
ctx.baseUrl = pathToFileURL(process.cwd()).href + '/'

await ctx.plugin(Loader)
await ctx.loader.create({
  name: '@averqel/cordis-plugin-include',
  config: {
    path: './cordis.yml',
  },
})
