import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Setup web-push VAPID config
    webpush.setVapidDetails(
      "mailto:support@bondhuapp.com",
      Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
      Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Webhook payload received:", payload);

    const table = payload.table;
    const type = payload.type;
    const record = payload.record;

    if (!record) {
      return new Response("No record found", { headers: corsHeaders, status: 400 });
    }

    let targetUserIds: string[] = [];
    let pushTitle = "BondhuApp";
    let pushBody = "";
    let pushUrl = "/";
    let pushTag = "bondhu-notify";

    // ── TASK STATUS UPDATES ──────────────────────────────────────────
    if (table === "tasks" && type === "UPDATE") {
      const oldRecord = payload.old_record;
      if (!oldRecord || oldRecord.status === record.status) {
        return new Response("No status change", { headers: corsHeaders });
      }

      targetUserIds.push(record.poster_id);
      pushUrl = `/task/${record.id}`;

      if (record.status === "accepted") {
        pushTitle = "🎉 Task Accepted!";
        pushBody = `A Bondhu has accepted "${record.title}"`;
        pushTag = "task-accepted";
      } else if (record.status === "in_progress") {
        pushTitle = "⚡ Task Started!";
        pushBody = `Bondhu is working on "${record.title}"`;
        pushTag = "task-started";
      } else if (record.status === "completed") {
        pushTitle = "✅ Task Done!";
        pushBody = `"${record.title}" is completed. Please verify.`;
        pushTag = "task-completed";
      } else {
        return new Response("Status ignored", { headers: corsHeaders });
      }
    }
    
    // ── NEW TASK POSTED (LOCATION BASED) ──────────────────────────
    else if (table === "tasks" && type === "INSERT" && record.status === "pending") {
      if (!record.location_lat || !record.location_lng) {
        return new Response("Task has no location", { headers: corsHeaders });
      }

      // Query database for all bondhus within 3km using our custom RPC function
      const { data: nearbyUsers, error } = await supabaseClient.rpc("get_users_within_radius", {
        target_lat: record.location_lat,
        target_lng: record.location_lng,
        radius_km: 3,
        target_role: "bondhu"
      });

      if (error) {
        console.error("RPC Error:", error);
        return new Response("RPC Error", { headers: corsHeaders, status: 500 });
      }

      if (!nearbyUsers || nearbyUsers.length === 0) {
        return new Response("No nearby users", { headers: corsHeaders });
      }

      targetUserIds = nearbyUsers.map((u: any) => u.user_id);
      pushTitle = "📢 New Task Near You!";
      pushBody = `"${record.title}" — ₹${record.amount}`;
      pushUrl = `/task/${record.id}`;
      pushTag = `new-task-${record.id}`;
    }
    
    // ── UNHANDLED TABLE ──────────────────────────────────────────
    else {
      return new Response("Unhandled webhook event", { headers: corsHeaders });
    }

    // ── FIRE WEB PUSH NOTIFICATIONS ──────────────────────────────
    if (targetUserIds.length === 0) {
      return new Response("No target users", { headers: corsHeaders });
    }

    // Fetch push subscriptions for all targeted users
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", targetUserIds);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response("No push subscriptions found", { headers: corsHeaders });
    }

    const pushPayload = JSON.stringify({
      title: pushTitle,
      body: pushBody,
      url: pushUrl,
      tag: pushTag
    });

    let successCount = 0;

    // Send notifications in parallel
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          };
          await webpush.sendNotification(pushConfig, pushPayload);
          successCount++;
        } catch (error: any) {
          console.error(`Error sending push to ${sub.endpoint}:`, error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or unsubscribed, delete it from DB
            await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );

    return new Response(JSON.stringify({ success: true, sent: successCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
