import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Setting up daily cron job for event fetching...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create a cron job to run the fetch-events function daily at 6 AM PST
    const { error } = await supabase.rpc('sql', {
      query: `
        SELECT cron.schedule(
          'daily-event-fetch',
          '0 6 * * *', -- Daily at 6 AM
          $$
          SELECT
            net.http_post(
                url:='https://siunjhiiaduktoqjxalv.supabase.co/functions/v1/fetch-events',
                headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}"}'::jsonb,
                body:='{"scheduled": true}'::jsonb
            ) as request_id;
          $$
        );
      `
    })

    if (error) {
      throw new Error(`Failed to create cron job: ${error.message}`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Daily event fetch cron job created successfully. Events will be fetched daily at 6 AM PST.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error setting up cron job:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})