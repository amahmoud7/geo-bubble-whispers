import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://siunjhiiaduktoqjxalv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdW5qaGlpYWR1a3RvcWp4YWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MzY3MTUsImV4cCI6MjA2MTMxMjcxNX0._AgD02DDc6E5gY0Hy4NPUZtRL_JVDiSiYcU2mwaWBoE'

const supabase = createClient(supabaseUrl, supabaseKey)

try {
  console.log('Testing fetch-events-24h function...')
  const { data, error } = await supabase.functions.invoke('fetch-events-24h', {
    body: { source: 'ticketmaster' }
  })
  
  if (error) {
    console.error('Function error:', error)
  } else {
    console.log('Function response:', data)
  }
} catch (err) {
  console.error('Network error:', err)
}