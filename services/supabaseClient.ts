import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuiogjsdtieenxzcbftc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1aW9nanNkdGllZW54emNiZnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjU5MzQsImV4cCI6MjA4OTMwMTkzNH0.vfPJSR97K2ey1cWPvbWf4r8mCeZlEzgMqmNNe3vwCcs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
