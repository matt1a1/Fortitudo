export type ProfileData = { profileId: string; data: Record<string, unknown>; updatedAt: Date };
export type ProfilePassword = { profileId: string; password: string };
export type AuditLog = { id: number; profileId: string; eventType: string; description: string; createdAt: Date };
