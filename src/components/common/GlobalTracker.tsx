import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/db/supabase';

export default function GlobalTracker() {
  const [searchParams, setSearchParams] = useSearchParams();

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

  return null; // This is an invisible utility component
}
