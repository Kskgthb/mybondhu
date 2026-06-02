// Admin emails — only these users can access the Admin Panel
export const ADMIN_EMAILS: string[] = [
  'tusharkumar01190@gmail.com',
  'kumarnishant01190@gmail.com',
  'kumarsumitsumitkumar187@gmail.com',
];

export const isAdminEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
};
