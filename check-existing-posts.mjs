import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fvtlbmvqxrcrvxqoxdfe.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dGxibXZxeHJjcnZ4cW94ZGZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4MjE3MjYsImV4cCI6MjAzODM5NzcyNn0.xKdOGDLXiQA-oMKF4e9Uxb8ECdYeOfG-PAbYxqJdIZA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkPosts() {
  console.log('🔍 Checking for existing user posts...')
  
  try {
    // Check all messages (including expired ones)
    const { data: allMessages, error: allError } = await supabase
      .from('messages')
      .select('id, content, lat, lng, location, user_id, created_at, expires_at, message_type, is_public')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (allError) {
      console.error('❌ Error fetching messages:', allError)
      return
    }
    
    console.log(`📊 Total messages in database: ${allMessages.length}`)
    
    // Filter user posts (non-events)
    const userPosts = allMessages.filter(msg => !msg.message_type || msg.message_type !== 'event')
    const eventPosts = allMessages.filter(msg => msg.message_type === 'event')
    
    console.log(`👤 User posts: ${userPosts.length}`)
    console.log(`🎫 Event posts: ${eventPosts.length}`)
    
    if (userPosts.length > 0) {
      console.log('\n🗽 Your NY Test Posts:')
      userPosts.forEach((post, index) => {
        const isExpired = new Date(post.expires_at) < new Date()
        const createdAt = new Date(post.created_at).toLocaleString()
        const location = post.location || `${post.lat}, ${post.lng}`
        
        console.log(`${index + 1}. ${post.content}`)
        console.log(`   📍 Location: ${location}`)
        console.log(`   ⏰ Created: ${createdAt}`)
        console.log(`   ${isExpired ? '❌ EXPIRED' : '✅ Active'}`)
        console.log(`   🔒 ${post.is_public ? 'Public' : 'Private'}`)
        console.log('')
      })
    } else {
      console.log('❌ No user posts found!')
    }
    
    // Check current active posts (what the app would show)
    const { data: activeMessages, error: activeError } = await supabase
      .from('messages')
      .select('id, content, lat, lng, location, message_type')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    
    if (!activeError) {
      const activeUserPosts = activeMessages.filter(msg => !msg.message_type || msg.message_type !== 'event')
      console.log(`🟢 Currently active user posts: ${activeUserPosts.length}`)
      
      if (activeUserPosts.length === 0) {
        console.log('⚠️  All your test posts have expired!')
        console.log('💡 Posts expire after 24 hours by default')
      }
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message)
  }
}

checkPosts()