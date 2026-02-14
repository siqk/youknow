// Wait for Supabase library to load
window.initSupabase = function() {
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

  // Make available globally
  window.supabaseClient = supabaseClient;
  window.RICH_USER_EMAIL = RICH_USER_EMAIL;
  
  console.log('Supabase initialized successfully');
  
  // Dispatch event to notify other scripts
  window.dispatchEvent(new Event('supabaseReady'));
};

// If Supabase is already loaded, initialize immediately
if (window.supabase) {
  window.initSupabase();
}