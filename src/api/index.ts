/**
 * Unified API Layer - Supabase Backend
 * All database operations go through src/db/api.ts
 */

export {
  profilesApi,
  tasksApi,
  assignmentsApi,
  notificationsApi,
  messagesApi,
  ratingsApi,
  storageApi,
  realtimeApi,
} from '@/db/api';
