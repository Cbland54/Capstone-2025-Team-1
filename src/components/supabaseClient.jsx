// src/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mbiccyyifphapqvakwwe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1iaWNjeXlpZnBoYXBxdmFrd3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzUxMTksImV4cCI6MjA3NDkxMTExOX0.vK4tCgYlSI-3b6ZTQgl06c9APuhCSTPnpYQ6XUMRpVE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
