// ===================================================================
//  Supabase-client
// ===================================================================
//  De URL en ANON key komen uit environment variables (Vite leest
//  variabelen die met VITE_ beginnen). Lokaal: .env — op Vercel:
//  Project Settings > Environment Variables.
//
//  ▸ PLAK HIER NIETS HARD IN DE CODE. Vul .env / Vercel-variabelen in.
//    Zie .env.example en de README.
// ===================================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vriendelijke waarschuwing in de console als de sleutels ontbreken.
export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Generation C Quiz] VITE_SUPABASE_URL en/of VITE_SUPABASE_ANON_KEY ontbreken. ' +
      'Vul ze in via .env (lokaal) of de Vercel environment variables.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    realtime: { params: { eventsPerSecond: 10 } },
  }
)
