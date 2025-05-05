
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { email, name, token } = body;

    if (!email || !token) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the origin from the request
    const url = new URL(req.url);
    const origin = url.origin;
    
    // In a real implementation, you would send an email here
    // For now, we'll just log the details
    console.log({
      to: email,
      subject: "Confirm your subscription to Lo",
      body: `Hello ${name || "there"},\n\nPlease confirm your subscription by clicking the link below:\n\n${origin}/functions/v1/confirm-subscription?token=${token}\n\nThank you,\nThe Lo Team`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Confirmation email would be sent (simulated for development)",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending confirmation:", error);
    
    return new Response(
      JSON.stringify({
        error: "Failed to send confirmation email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
