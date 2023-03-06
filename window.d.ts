/// <reference types='./ext/realm.d.ts' />

import type { ParsedConfiguration } from './Configuration.d.ts'

declare global {
  interface Window {
    __d: {
      database?: globalThis.Realm.Services.MongoDBDatabase
      env: darkflare.Environment
    } & ParsedConfiguration
  }
}

export {}
