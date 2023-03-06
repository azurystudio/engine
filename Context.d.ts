export interface Context {
  env: Environment
  waitUntil: (promise: Promise<unknown>) => void
}
