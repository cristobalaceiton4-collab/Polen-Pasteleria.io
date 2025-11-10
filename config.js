// Configuración de Supabase
const SUPABASE_URL = 'https://cmmqkytgfevywqbgxlgu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbXFreXRnZmV2eXdxYmd4bGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MzExMDgsImV4cCI6MjA3ODMwNzEwOH0.QsTo9bzWUJhrLycXr9D_4LtiTq-aKQIiaEdxGeYrx4Y';

// Inicializar cliente de Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);