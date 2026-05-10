/**
 * Supabase Edge Function: re-engage
 * 
 * Schedule: Run daily at 9:00 AM UTC via Supabase Scheduled Functions
 * (Dashboard → Edge Functions → Schedules → Add: "0 9 * * *")
 *
 * Logic:
 *  1. Find Bondhus who haven't been active for 3+ days
 *  2. Find an open task in their top-interest category within their radius
 *  3. Send a personalized re-engagement push notification
 *  4. Log it in notification_logs with trigger_type = 're-engagement'
 *  5. Respect daily limits and quiet hours (reuses smart target RPC)
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

const APP_URL = Deno.env.get("APP_URL") || "https://bondhuapp.com";
const ICON_URL = `${APP_URL}/logo.png`;
const BADGE_URL = `${APP_URL}/logo.png`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Re-engagement messages — personalized per user's top category
const buildReEngageMessage = (
  username: string,
  category: string,
  taskTitle: string,
  amount: number,
  distStr: string
): { title: string; body: string } => {
  const firstName = username?.split(" ")[0] || "Bondhu";
  const catLabel = category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const variants = [
    {
      title: `👋 Miss You, ${firstName}!`,
      body: `A "${taskTitle}" ${catLabel} task paying ₹${amount} is waiting just ${distStr} away. Come back and earn today!`,
    },
    {
      title: `💰 Easy Money Near You, ${firstName}`,
      body: `There's a ₹${amount} ${catLabel} task ${distStr} from you. You've handled these before — grab it now! 🚀`,
    },
    {
      title: `🔔 New Opportunity Alert`,
      body: `${firstName}, it's been a while! A ₹${amount} ${catLabel} task is available ${distStr} away. Tap to see details.`,
    },
  ];

  return variants[Math.floor(Math.random() * variants.length)];
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    webpush.setVapidDetails(
      "mailto:support@bondhuapp.com",
      Deno.env.get("VAPID_PUBLIC_KEY") ?? "",
      Deno.env.get("VAPID_PRIVATE_KEY") ?? ""
    );

    const inactiveDaysThreshold = 3; // Days of inactivity before re-engage
    const inactiveDate = new Date(Date.now() - inactiveDaysThreshold * 24 * 60 * 60 * 1000).toISOString();

    console.log(`[ReEngage] Finding Bondhus inactive since: ${inactiveDate}`);

    // ── 1. Find inactive Bondhus with push subscriptions ─────────────────
    const { data: inactiveUsers, error: inactiveError } = await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        last_location_lat,
        last_location_lng,
        location_lat,
        location_lng,
        user_preferences!left (
          preferred_radius_km,
          max_notifications_per_day,
          quiet_hours_start,
          quiet_hours_end,
          category_weights
        )
      `)
      .eq("role", "bondhu")
      .lt("last_seen_at", inactiveDate)  // inactive for 3+ days
      .not("last_location_lat", "is", null);

    if (inactiveError) {
      console.error("[ReEngage] Error fetching inactive users:", inactiveError);
      return new Response(JSON.stringify({ error: inactiveError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (!inactiveUsers || inactiveUsers.length === 0) {
      console.log("[ReEngage] No inactive users found — all Bondhus are active! 🎉");
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "no_inactive_users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[ReEngage] Found ${inactiveUsers.length} inactive Bondhus to re-engage`);

    // ── 2. Fetch their push subscriptions ─────────────────────────────────
    const userIds = inactiveUsers.map((u: any) => u.id);
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("push_subscriptions")
      .select("*")
      .in("user_id", userIds);

    if (subError || !subscriptions || subscriptions.length === 0) {
      console.log("[ReEngage] No push subscriptions found for inactive users");
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "no_subscriptions" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentCount = 0;

    // ── 3. Process each user ──────────────────────────────────────────────
    await Promise.all(
      inactiveUsers.map(async (bondhu: any) => {
        const prefs = bondhu.user_preferences?.[0] || {};
        const lat = bondhu.last_location_lat || bondhu.location_lat;
        const lng = bondhu.last_location_lng || bondhu.location_lng;
        if (!lat || !lng) return;

        // Find their top interest category
        const weights: Record<string, number> = prefs.category_weights || {};
        const topCategory = Object.entries(weights).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
        const radiusKm = prefs.preferred_radius_km || 10;

        // ── 3a. Find a matching open task near them ──────────────────────
        let taskQuery = supabaseClient
          .from("tasks")
          .select("id, title, amount, category, location_lat, location_lng")
          .eq("status", "pending")
          .not("location_lat", "is", null)
          .limit(10);

        if (topCategory) taskQuery = taskQuery.eq("category", topCategory);

        const { data: nearbyTasks } = await taskQuery;

        if (!nearbyTasks || nearbyTasks.length === 0) return;

        // Find closest task using Haversine calculation
        let bestTask: any = null;
        let bestDist = Infinity;

        for (const task of nearbyTasks) {
          if (!task.location_lat || !task.location_lng) continue;
          const dLat = ((task.location_lat - lat) * Math.PI) / 180;
          const dLng = ((task.location_lng - lng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((task.location_lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const dist = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (dist < radiusKm && dist < bestDist) {
            bestDist = dist;
            bestTask = task;
          }
        }

        if (!bestTask) return;

        // Check today's notification limit
        const todayStart = new Date();
        todayStart.setUTCHours(0, 0, 0, 0);
        const { count: todayCount } = await supabaseClient
          .from("notification_logs")
          .select("id", { count: "exact", head: true })
          .eq("user_id", bondhu.id)
          .gte("sent_at", todayStart.toISOString());

        const maxAllowed = prefs.max_notifications_per_day ?? 3;
        if ((todayCount ?? 0) >= maxAllowed) return;

        // ── 3b. Build personalized message ────────────────────────────────
        const distStr = bestDist < 1 ? `${Math.round(bestDist * 1000)}m` : `${bestDist.toFixed(1)}km`;
        const { title, body } = buildReEngageMessage(
          bondhu.username,
          bestTask.category,
          bestTask.title,
          bestTask.amount,
          distStr
        );

        const logId = crypto.randomUUID();
        const pushUrl = `${APP_URL}/task/${bestTask.id}`;
        const tag = `re-engage-${bondhu.id}-${Date.now()}`;

        const pushPayload = JSON.stringify({
          title,
          body,
          url: pushUrl,
          tag,
          icon: ICON_URL,
          badge: BADGE_URL,
          timestamp: Date.now(),
          renotify: true,
          requireInteraction: false,
          data: {
            url: pushUrl,
            task_id: bestTask.id,
            log_id: logId,
            category: bestTask.category,
            trigger_type: "re-engagement",
            variant: "personalized",
          },
        });

        // ── 3c. Send push to all user's subscriptions ────────────────────
        const userSubs = subscriptions.filter((s: any) => s.user_id === bondhu.id);

        for (const sub of userSubs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh_key, auth: sub.auth_key } },
              pushPayload
            );
            sentCount++;

            // Log in notification_logs
            await supabaseClient.from("notification_logs").insert({
              id: logId,
              user_id: bondhu.id,
              task_id: bestTask.id,
              trigger_type: "re-engagement",
              variant: "personalized",
              clicked: false,
            });
          } catch (err: any) {
            console.error(`[ReEngage] Failed to send to ${bondhu.id}:`, err.message);
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabaseClient.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }
      })
    );

    console.log(`[ReEngage] ✅ Sent ${sentCount} re-engagement notifications`);
    return new Response(JSON.stringify({ success: true, sent: sentCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[ReEngage] Unhandled error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
