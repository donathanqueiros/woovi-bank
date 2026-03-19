import { Session } from "../modules/sessions/SessionModel";

export async function cleanExpiredSessions() {
  const result = await Session.deleteMany({ expiresAt: { $lte: new Date() } });
  console.log(`[jobs] cleanExpiredSessions: removed ${result.deletedCount} expired session(s)`);
}
