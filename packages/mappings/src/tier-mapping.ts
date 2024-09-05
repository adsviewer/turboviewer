import { type Tier } from '@repo/database';

export const maxUsersPerTier: Record<Tier, { maxUsers: number }> = {
  Launch: { maxUsers: 1 },
  Build: { maxUsers: 4 },
  Grow: { maxUsers: 10 },
  Scale: { maxUsers: 100 },
};

export function canAddUser(tier: Tier, currentUserCount: number): boolean {
  return currentUserCount <= maxUsersPerTier[tier].maxUsers;
}
