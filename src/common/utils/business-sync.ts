/** Detect projects whose attendance is synced from Paradise-Desk-Business. */
export function isBusinessSyncedProject(project?: {
  businessId?: string | null;
  description?: string | null;
  syncSource?: string | null;
} | null): boolean {
  if (!project) return false;
  if (project.syncSource === 'business') return true;
  if (project.businessId) return true;
  return Boolean(project.description?.includes('Synced from Business'));
}
