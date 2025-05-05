
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Missing confirmation token",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Find subscriber with this token
    const { data: subscriber, error: findError } = await supabaseClient
      .from("subscribers")
      .select("*")
      .eq("confirmation_token", token)
      .single();

    if (findError || !subscriber) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired confirmation token",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update subscriber as confirmed
    const { error: updateError } = await supabaseClient
      .from("subscribers")
      .update({ confirmed: true })
      .eq("id", subscriber.id);

    if (updateError) {
      throw updateError;
    }

    // Redirect to success page
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        "Location": `${url.origin}/subscription-confirmed`,
      },
    });
  } catch (error) {
    console.error("Error confirming subscription:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to confirm subscription",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper to create a Supabase client with the Deno runtime
const createClient = (supabaseUrl: string, supabaseKey: string) => {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: string) => ({
          single: () => fetch(`${supabaseUrl}/rest/v1/${table}?select=${columns}&${column}=eq.${value}&limit=1`, {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          }).then(res => res.json())
            .then(data => ({ data: data[0] || null, error: null }))
            .catch(error => ({ data: null, error })),
        }),
      }),
      update: (data: Record<string, unknown>) => ({
        eq: (column: string, value: string) => fetch(`${supabaseUrl}/rest/v1/${table}?${column}=eq.${value}`, {
          method: "PATCH",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify(data),
        }).then(res => {
          if (!res.ok) return { error: new Error(`Failed to update: ${res.statusText}`) };
          return { error: null };
        }).catch(error => ({ error })),
      }),
    }),
  };
};
