import { config as dotenv } from 'dotenv'
dotenv()

const required = (key: string): string => {
  const val = process.env[key]
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || required('SUPABASE_ANON_KEY'),
  port: parseInt(process.env.PORT || '3000', 10),
}
