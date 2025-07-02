
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { corsHeaders } from "../_shared/cors.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    console.log(`Sending confirmation email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "Lo <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for subscribing to Lo!",
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Thank you for subscribing to Lo!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
              ${name ? `Hi ${name},` : 'Hi there,'}
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              We appreciate your interest in Lo! You're now subscribed to receive updates about our platform where people connect with each other.
            </p>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
              We'll be sharing exciting updates about Lo very soon, including:
            </p>
            
            <ul style="font-size: 16px; color: #555; line-height: 1.8; margin-bottom: 20px;">
              <li>App launch announcements</li>
              <li>New features and improvements</li>
              <li>Community updates</li>
              <li>Early access opportunities</li>
            </ul>
            
            <p style="font-size: 16px; color: #555; line-height: 1.6;">
              Stay tuned for more updates from the Lo team!
            </p>
          </div>
          
          <div style="text-align: center; color: #888; font-size: 14px;">
            <p>Best regards,<br><strong>The Lo Team</strong></p>
            <p style="margin-top: 20px;">
              If you didn't subscribe to Lo, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
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
