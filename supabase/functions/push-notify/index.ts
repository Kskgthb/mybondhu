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
    console.log("Webhook payload received:", JSON.stringify(payload, null, 2));

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
    let targetUsersDetails: any[] = [];
    let isSmartTarget = false;
    let pushVariant = 'formal';

    // ── NOTIFICATIONS TABLE (HANDLES ALL TYPES) ──────────────────────
    if (table === "notifications" && type === "INSERT") {
      targetUserIds.push(record.user_id);
      pushTitle = record.title || "BondhuApp";
      pushBody = record.message || "";
      pushUrl = record.task_id ? `/task/${record.task_id}` : "/";
      pushTag = `${record.type}-${record.task_id || record.id}`;
    }
    
    // ── TASK STATUS UPDATES (POSTER ALERTS) ──────────────────────────
    else if (table === "tasks" && type === "UPDATE") {
      const oldRecord = payload.old_record;
      if (!oldRecord || oldRecord.status === record.status) {
        return new Response("No status change", { headers: corsHeaders });
      }

      targetUserIds.push(record.poster_id);
      pushUrl = `/task/${record.id}`;

      if (record.status === "accepted") {
        pushTitle = "🎉 Task Accepted!";
        pushBody = `A Bondhu has accepted "${record.title}"`;
        pushTag = `task-accepted-${record.id}`;
      } else if (record.status === "in_progress") {
        pushTitle = "⚡ Task Started!";
        pushBody = `Bondhu is working on "${record.title}"`;
        pushTag = `task-started-${record.id}`;
      } else if (record.status === "completed") {
        pushTitle = "✅ Task Done!";
        pushBody = `"${record.title}" is completed. Please verify.`;
        pushTag = `task-completed-${record.id}`;
      } else {
        return new Response("Status ignored", { headers: corsHeaders });
      }
    }
    
    // ── NEW TASK POSTED (SMART BONDHU PROXIMITY ALERTS) ────────────────
    else if (table === "tasks" && type === "INSERT" && record.status === "pending") {
      console.log(`[Push-Notify] New task posted: ${record.id} [${record.category}] at [${record.location_lat}, ${record.location_lng}]`);
      
      if (!record.location_lat || !record.location_lng || record.location_lat === 0) {
        console.log("[Push-Notify] Task has no valid location, skipping proximity alerts");
        return new Response("Task has no location", { headers: corsHeaders });
      }

      // Query database using the new smart notification RPC
      const { data: nearbyUsers, error } = await supabaseClient.rpc("get_smart_notification_targets", {
        p_target_lat: record.location_lat,
        p_target_lng: record.location_lng,
        p_category: record.category,
        p_limit: 10
      });

      if (error) {
        console.error("[Push-Notify] RPC Error getting smart targets:", error);
        return new Response("RPC Error", { headers: corsHeaders, status: 500 });
      }

      if (!nearbyUsers || nearbyUsers.length === 0) {
        console.log("[Push-Notify] No eligible Bondhus found via smart targets for task:", record.id);
        return new Response("No eligible nearby users", { headers: corsHeaders });
      }

      console.log(`[Push-Notify] Found ${nearbyUsers.length} smart targeted Bondhus`);
      
      isSmartTarget = true;
      targetUsersDetails = nearbyUsers;
      targetUserIds = nearbyUsers.map((u: any) => u.user_id);
      pushUrl = `/task/${record.id}`;
      pushTag = `new-task-nearby`;
    }
    
    // ── UNHANDLED TABLE ──────────────────────────────────────────
    else {
      return new Response("Unhandled webhook event", { headers: corsHeaders });
    }

    // ── FIRE WEB PUSH NOTIFICATIONS ──────────────────────────────
    if (targetUserIds.length === 0) {
      return new Response("No target users", { headers: corsHeaders });
    }

    // Fetch push subscriptions and profile data (for personalization)
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*, profile:profiles(username)")
      .in("user_id", targetUserIds);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for targeted users:", targetUserIds);
      return new Response("No push subscriptions found", { headers: corsHeaders });
    }

    let successCount = 0;

    // Send notifications in parallel
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          let finalTitle = pushTitle;
          let finalBody = pushBody;
          let variant = pushVariant;
          
          const profileData = Array.isArray(sub.profile) ? sub.profile[0] : sub.profile;
          const userName = profileData?.username ? profileData.username.split(' ')[0] : 'Bondhu';

          // Personalize smart notifications based on A/B testing variant
          if (isSmartTarget) {
            const userTargetData = targetUsersDetails.find(u => u.user_id === sub.user_id);
            variant = userTargetData?.variant || 'formal';
            
            // Format distance to 1 decimal place
            const distStr = userTargetData?.distance_km ? `${userTargetData.distance_km.toFixed(1)}km` : 'nearby';

            if (variant === 'formal') {
              finalTitle = `New Task Available (${distStr})`;
              finalBody = `Category: ${record.category}. Reward: ₹${record.amount}. Tap to view.`;
            } else if (variant === 'emoji') {
              finalTitle = `🎯 ${record.category} Task Near You!`;
              finalBody = `Hey ${userName}, earn ₹${record.amount} just ${distStr} away! 🚀`;
            } else if (variant === 'urgent') {
              finalTitle = `🔥 High Match Alert: ₹${record.amount}`;
              finalBody = `${userName}, a new ${record.category} task was just posted ${distStr} away. Grab it fast! ⚡`;
            }
          }

          const pushPayload = JSON.stringify({
            title: finalTitle,
            body: finalBody,
            url: pushUrl,
            tag: pushTag,
            timestamp: Date.now(),
            renotify: true, 
            icon: "/logo.png",
            // Pass metadata for SW click tracking
            data: {
              url: pushUrl,
              task_id: record?.id,
              trigger_type: isSmartTarget ? 'proximity' : 'lifecycle',
              variant: variant,
              log_id: crypto.randomUUID() // Client needs this to log clicks
            }
          });

          const pushConfig = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh_key,
              auth: sub.auth_key,
            },
          };
          
          await webpush.sendNotification(pushConfig, pushPayload);
          successCount++;
          
          // Log the notification for Anti-Spam and A/B Testing metrics
          if (isSmartTarget) {
            await supabaseClient.from("notification_logs").insert({
              id: JSON.parse(pushPayload).data.log_id,
              user_id: sub.user_id,
              task_id: record.id,
              trigger_type: 'proximity',
              variant: variant,
              clicked: false
            });
          }
          
        } catch (error: any) {
          console.error(`Error sending push to ${sub.endpoint}:`, error);
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription expired or unsubscribed, delete it from DB
            await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      })
    );

    console.log(`Successfully sent ${successCount} push notifications`);
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
