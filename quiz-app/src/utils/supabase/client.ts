import { createBrowserClient } from '@supabase/ssr'

// Singleton helper
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/[\r\n\s]+/g, ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.replace(/[\r\n\s]+/g, '')
  );

  return client;
}
