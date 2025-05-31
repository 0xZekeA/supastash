export const supabaseClientErr = `
"Example: \n" +
"Supabase Client file: \n" +
"import { createClient } from '@supabase/supabase-js';\n" +
"const supabaseClient = createClient('https://your-supabase-url.supabase.co', 'your-supabase-anon-key');\n" +
"import { configureSupastash } from 'supastash';\n" +
"import { supabaseClient } from './supabaseClient';\n" +
"configureSupastash({ \n" +
"  supabaseClient: supabaseClient, \n" +
"});"
"Call configureSupastash in your app's entry point (e.g., App.tsx or _layout.tsx)" +
"Example: \n" +
"App.tsx or _layout.tsx: \n" +
"import "supashDirectory/supastash"
`;
