import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/db/supabase';

export default function GlobalTracker() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  // ── 1. Log notifications ──
  useEffect(() => {
    const logId = searchParams.get('click_log_id');
    
    if (logId) {
      console.log('📊 Tracking notification click for log ID:', logId);
      
      // Update notification log as clicked
      supabase
        .from('notification_logs')
        .update({ clicked: true })
        .eq('id', logId)
        .then(({ error }) => {
          if (error) console.error('❌ Failed to log click:', error);
          else console.log('✅ Click logged successfully');
        });

      // Remove the parameter from the URL to avoid double-logging on refresh
      searchParams.delete('click_log_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // ── 2. Track Site Visitors (Real Analytics) ──
  useEffect(() => {
    const trackVisit = async () => {
      const sessionKey = 'mb_session_id';
      // Only track once per browser session
      if (sessionStorage.getItem(sessionKey)) return;

      let country = 'Unknown';
      let city = 'Unknown';

      try {
        // Fetch basic geo-location from public free API
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const geo = await res.json();
          if (geo.country_name) country = geo.country_name;
          if (geo.city) city = geo.city;
        }
      } catch (err) {
        console.warn('Geo API failed:', err);
      }

      try {
        const { data, error } = await supabase.from('site_visitors').insert({
          user_agent: navigator.userAgent,
          referrer: document.referrer || null,
          page_path: window.location.pathname,
          country,
          city,
          is_signed_in: !!user,
          user_id: user?.id || null,
        }).select('id').single();

        if (error) {
          console.error('Failed to log visitor:', error);
        } else if (data) {
          sessionStorage.setItem(sessionKey, data.id);
        }
      } catch (err) {
        console.error('Visitor tracking error:', err);
      }
    };

    trackVisit();
  }, [user]); // We re-run if auth state changes, but sessionKey prevents duplicates

  return null; // This is an invisible utility component
}
