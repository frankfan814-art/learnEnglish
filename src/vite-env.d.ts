/// <reference types="vite/client" />

declare module '*.csv?raw' {
  const content: string
  export default content
}

declare module '*.csv' {
  const content: string[][]
  export default content
}

declare module '*.json?raw' {
  const content: string
  export default content
}

declare module '*.json' {
  const content: any
  export default content
}
