declare namespace Darkflare {
  export const jwt: typeof import('./ext/jwt.ts').default
  export const oauth2: typeof import('./ext/oauth2.ts').default
  export const otp: typeof import('./ext/otp.ts').default

  export const Schema: typeof import('./ext/Schema.ts').Schema
  export class ObjectId extends (await import('./ext/ObjectId.ts')).ObjectId {}

  export const parseUserAgent:
    typeof import('./ext/parseUserAgent.ts').parseUserAgent
  export const sendMail: typeof import('./ext/sendMail.ts').sendMail
  export const encrypt: typeof import('./ext/encrypt.ts').encrypt
  export const decrypt: typeof import('./ext/decrypt.ts').decrypt
}

declare type Configuration = import('./Configuration.d.ts').Configuration

declare const Delete: typeof import('./route.ts').route
declare const Get: typeof import('./route.ts').route
declare const Head: typeof import('./route.ts').route
declare const Patch: typeof import('./route.ts').route
declare const Post: typeof import('./route.ts').route
declare const Put: typeof import('./route.ts').route

declare const Cron: typeof import('./Cron.ts').Cron
declare const Mail: typeof import('./Mail.ts').Mail

declare const v: typeof import('./v.ts').v
