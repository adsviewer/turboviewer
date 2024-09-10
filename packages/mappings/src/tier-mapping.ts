import { type Tier } from '@repo/database';

export const maxUsersPerTier: Record<Tier, { maxUsers: number; maxIntegrations?: number }> = {
  Launch: { maxUsers: 1, maxIntegrations: 1 },
  Build: { maxUsers: 4 },
  Grow: { maxUsers: 10 },
  Scale: { maxUsers: 100 },
};

export function canAddUser(tier: Tier, userOrganizationCount: number): boolean {
  return userOrganizationCount < maxUsersPerTier[tier].maxUsers;
}
