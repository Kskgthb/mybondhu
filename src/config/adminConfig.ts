// Admin emails — only these users can access the Admin Panel and use Task Solve mode while frozen
export const ADMIN_EMAILS: string[] = [
  'tusharkumar01190@gmail.com',
  'kumarnishant01190@gmail.com',
  'kumarsumitsumitkumar187@gmail.com',
];

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};

// Global freeze flag: Task Solve mode is temporarily frozen for regular users.
// Strictly: ONLY admins can access Task Solve mode, accept tasks, and solve tasks!
export const IS_TASK_SOLVE_FROZEN = true;

/**
 * Check if a user can access Task Solve (Bondhu) mode and solve tasks.
 * While IS_TASK_SOLVE_FROZEN is active, strictly only admins can solve tasks.
 */
export const canSolveTasks = (email: string | null | undefined, role?: string | null): boolean => {
  if (isAdminEmail(email) || role === 'admin') {
    return true;
  }
  return !IS_TASK_SOLVE_FROZEN;
};
