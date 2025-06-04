import { createClient, Session, User } from '@supabase/supabase-js';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// You can get these from your Supabase project settings > API
const supabaseUrl = 'https://yybjqwvcynaokjipeaeh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Ympxd3ZjeW5hb2tqaXBlYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTMxOTYsImV4cCI6MjA2Mzc2OTE5Nn0.FPnqjqdEEiJ-6NJ1qyi0ug7OwabVu6mZzFyqthOi0ig';

if (supabaseUrl !== 'https://yybjqwvcynaokjipeaeh.supabase.co' || supabaseAnonKey !== 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Ympxd3ZjeW5hb2tqaXBlYWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxOTMxOTYsImV4cCI6MjA2Mzc2OTE5Nn0.FPnqjqdEEiJ-6NJ1qyi0ug7OwabVu6mZzFyqthOi0ig') {
  const warningMessage = "Supabase URL or Anon Key is not configured in supabaseClient.ts. " +
                         "Please replace 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY' " +
                         "with your actual Supabase project credentials. Authentication will not work.";
  console.warn(warningMessage);
  // Optionally, you could throw an error or display this in the UI during development
  // alert(warningMessage); 
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // It's recommended to store the session in localStorage to persist across browser sessions.
    persistSession: true,
    // Automatically refreshes the token when an API request is made with an expired token.
    autoRefreshToken: true,
    // Detects when a session is changed in another tab/window.
    detectSessionInUrl: true, 
  },
});

// Re-export Supabase session and user types for convenience if needed elsewhere
export type { Session, User };
