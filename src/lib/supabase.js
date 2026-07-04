import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yoxsgirtmxsfckiwykbh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveHNnaXJ0bXhzZmNraXd5a2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxMTQyMTcsImV4cCI6MjA5ODY5MDIxN30.jWAT_V1VorTcTGmu7WvPCVKRGXSDuLQGkT1FAMqvNrA'

export const supabase = createClient(supabaseUrl, supabaseKey)
