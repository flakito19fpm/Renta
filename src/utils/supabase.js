import { createClient } from '@supabase/supabase-js';  

const supabaseUrl = 'https://rhpbawwmegxavqmykdcr.supabase.co';  
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJocGJhd3dtZWd4YXZxbXlrZGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNTQ2MjIsImV4cCI6MjA3NjczMDYyMn0.QI-_3chMYxlM3AQOGOtbU8VNyV9ygKJgY8hpo9_4gFg';  

export const supabase = createClient(supabaseUrl, supabaseAnonKey);