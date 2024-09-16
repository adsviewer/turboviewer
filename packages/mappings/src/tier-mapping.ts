import { type Tier } from '@repo/database';

export const tierConstraints: Record<Tier, { maxUsers: number; maxIntegrations: number }> = {
  Launch: { maxUsers: 1, maxIntegrations: 1 },
  Build: { maxUsers: 4, maxIntegrations: Infinity },
  Grow: { maxUsers: 10, maxIntegrations: Infinity },
  Scale: { maxUsers: 100, maxIntegrations: Infinity },
};

export function canAddUser(tier: Tier, userOrganizationCount: number): boolean {
  return userOrganizationCount < tierConstraints[tier].maxUsers;
}
