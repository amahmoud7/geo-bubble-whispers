// Script to extend expiration of existing test posts
// Run this in the browser console on your app

async function extendTestPosts() {
  console.log('🔄 Extending expiration of test posts...');
  
  try {
    // Import Supabase client from your app
    const { supabase } = await import('/src/integrations/supabase/client.ts');
    
    // Get all user posts (non-events) from the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: posts, error: fetchError } = await supabase
      .from('messages')
      .select('id, content, location, created_at, expires_at, message_type')
      .gte('created_at', sevenDaysAgo)
      .or('message_type.is.null,message_type.neq.event');
    
    if (fetchError) {
      console.error('❌ Error fetching posts:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${posts.length} user posts from last 7 days`);
    
    if (posts.length === 0) {
      console.log('ℹ️ No posts found to extend');
      return;
    }
    
    // Show current posts
    posts.forEach((post, index) => {
      const isExpired = new Date(post.expires_at) < new Date();
      console.log(`${index + 1}. "${post.content}" - ${isExpired ? '❌ EXPIRED' : '✅ Active'}`);
    });
    
    // Extend expiration by 7 days from now
    const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update({ expires_at: newExpiration })
      .in('id', posts.map(p => p.id))
      .select();
    
    if (updateError) {
      console.error('❌ Error updating posts:', updateError);
      return;
    }
    
    console.log(`✅ Extended expiration for ${updated.length} posts`);
    console.log(`🕐 New expiration: ${new Date(newExpiration).toLocaleString()}`);
    console.log('🔄 Refresh the page to see your posts on the map!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Auto-run the function
extendTestPosts();

// Also make it available globally for manual runs
window.extendTestPosts = extendTestPosts;

console.log('📝 Test post extension script loaded!');
console.log('💡 You can run extendTestPosts() anytime to extend post expiration');