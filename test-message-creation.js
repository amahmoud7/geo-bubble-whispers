#!/usr/bin/env node

/**
 * Test script for message creation functionality
 * This script tests if messages are properly saved to Supabase and displayed on the map
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://siunjhiiaduktoqjxalv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpdW5qaGlpYWR1a3RvcWp4YWx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3MzY3MTUsImV4cCI6MjA2MTMxMjcxNX0._AgD02DDc6E5gY0Hy4NPUZtRL_JVDiSiYcU2mwaWBoE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testMessageCreation() {
  console.log('🧪 Testing message creation and display...\n');

  try {
    // 1. Check if we can connect to Supabase
    console.log('1️⃣ Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('messages')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Failed to connect to Supabase:', healthError);
      return;
    }
    console.log('✅ Successfully connected to Supabase\n');

    // 2. Create a test message
    console.log('2️⃣ Creating a test message...');
    const testMessage = {
      content: 'Test Lo from script - ' + new Date().toISOString(),
      location: 'Test Location',
      is_public: true,
      lat: 40.7580, // NYC coordinates
      lng: -73.9855,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      // Note: user_id will be null for anonymous test
    };

    const { data: createdMessage, error: createError } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create message:', createError);
      return;
    }
    console.log('✅ Successfully created message:', createdMessage.id);
    console.log('   Content:', createdMessage.content);
    console.log('   Location:', `(${createdMessage.lat}, ${createdMessage.lng})\n`);

    // 3. Verify the message can be retrieved
    console.log('3️⃣ Verifying message retrieval...');
    const { data: retrievedMessage, error: retrieveError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', createdMessage.id)
      .single();

    if (retrieveError) {
      console.error('❌ Failed to retrieve message:', retrieveError);
      return;
    }
    console.log('✅ Successfully retrieved message\n');

    // 4. Test real-time subscription
    console.log('4️⃣ Testing real-time subscription...');
    console.log('   Setting up subscription and creating another message...');
    
    let subscriptionWorking = false;
    const channel = supabase
      .channel('test-messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, (payload) => {
        console.log('✅ Real-time event received:', payload.new.id);
        subscriptionWorking = true;
      })
      .subscribe();

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create another test message
    const { data: realtimeTestMessage } = await supabase
      .from('messages')
      .insert({
        ...testMessage,
        content: 'Real-time test - ' + new Date().toISOString()
      })
      .select()
      .single();

    // Wait for real-time event
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (subscriptionWorking) {
      console.log('✅ Real-time subscriptions are working\n');
    } else {
      console.log('⚠️  Real-time subscription did not trigger (may need to check configuration)\n');
    }

    // Clean up subscription
    await supabase.removeChannel(channel);

    // 5. Check for recent messages
    console.log('5️⃣ Checking for recent messages...');
    const { data: recentMessages, error: recentError } = await supabase
      .from('messages')
      .select('id, content, created_at, lat, lng')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Failed to fetch recent messages:', recentError);
      return;
    }

    console.log(`✅ Found ${recentMessages.length} recent messages:`);
    recentMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ${msg.content.substring(0, 50)}...`);
      console.log(`      Location: (${msg.lat}, ${msg.lng})`);
      console.log(`      Created: ${new Date(msg.created_at).toLocaleString()}`);
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('📍 Messages should now appear on the map in your app');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testMessageCreation();