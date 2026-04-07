import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tus datos reales de Supabase
const supabaseUrl = 'https://qiflwadqldquiwgcjxtl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpZmx3YWRxbGRxdWl3Z2NqeHRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NjY4OTQsImV4cCI6MjA5MDQ0Mjg5NH0.dsVKRMrogd21ESOlhvpj9-FHbaxSA7yVW6P--1unm-M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);