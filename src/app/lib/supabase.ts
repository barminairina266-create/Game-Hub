import { createClient } from '@supabase/supabase-js';

// Вставь сюда свои данные из вкладки Settings -> API в Supabase
const SUPABASE_URL = 'https://wauuqvkevxeiqnqwvmmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdXVxdmtldnhlaXFucXd2bW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MzM0NzcsImV4cCI6MjA5NDUwOTQ3N30.H2IW3pJ6_ekCmd6f2aIqREVzP6rlbjn5rfxYIBpzTys';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);