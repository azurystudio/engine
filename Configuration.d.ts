export interface Configuration {
  name?: string
  base?: string
  cors?: string
  cache?: string
}

export interface ParsedConfiguration {
  name: string
  base?: string
  cors?: string
  cache: number
}
