import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://siunjhiiaduktoqjxalv.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdW5qaGlpYWR1a3RvcWp4YWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MzY3MTUsImV4cCI6MjA2MTMxMjcxNX0._AgD02DDc6E5gY0Hy4NPUZtRL_JVDiSiYcU2mwaWBoE'

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('Running database migration...')

// Read the migration SQL
const migrationSQL = readFileSync('supabase/migrations/20250805000001_add_event_message_fields.sql', 'utf8')

try {
  // Execute the migration using raw SQL
  const { data, error } = await supabase.rpc('exec', { sql: migrationSQL })
  
  if (error) {
    console.error('Migration error:', error)
  } else {
    console.log('✅ Migration completed successfully!')
    console.log('Event-related columns have been added to the messages table.')
  }
} catch (err) {
  console.error('Error running migration:', err)
  
  // Alternative approach: try applying each statement individually
  console.log('Trying alternative approach...')
  
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'))
  
  for (const statement of statements) {
    if (statement) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec', { sql: statement })
        if (error) {
          console.warn(`Statement failed: ${error.message}`)
        }
      } catch (statementError) {
        console.warn(`Statement error: ${statementError.message}`)
      }
    }
  }
}