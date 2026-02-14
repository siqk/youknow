// Supabase configuration
const SUPABASE_URL = "https://opixidygpndbfuisjkrk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_N6RdTgjgUHQbdtvPX9uPqA_VTraUegI";

// Initialize Supabase client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Global constants
const RICH_USER_EMAIL = "ikiikikikijujijij@gmail.com";

// Make supabaseClient globally available
window.supabaseClient = supabaseClient;
window.RICH_USER_EMAIL = RICH_USER_EMAIL;