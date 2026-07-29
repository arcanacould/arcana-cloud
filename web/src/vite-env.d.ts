/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.css' {
  const content: Record<string, string>
  export default content
}

declare module 'react-dom/client' {
  import { ReactNode } from 'react'
  interface Root { render(children: ReactNode): void; unmount(): void }
  export function createRoot(container: Element | DocumentFragment): Root
}
