// Supabase client for the browser. Loaded after the Supabase CDN script and before recipe.js.
// Only the Project URL and Publishable/anon key belong here. Both are public by design.
// Any other key or credential goes in .env, never in this file.

const SUPABASE_URL = "https://bvigcxumdeaiznydsdhp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_x6rEwj1J406L94mrQxAo4g_XIGiIrf_";

const db = window.supabase.createClient("https://bvigcxumdeaiznydsdhp.supabase.co", "sb_publishable_x6rEwj1J406L94mrQxAo4g_XIGiIrf_");
