import { type Tier } from '@repo/database';

export const tierConstraints: Record<Tier, { maxUsers: number; maxIntegrations: number; maxRecency: number }> = {
  Launch: { maxUsers: 1, maxIntegrations: 1, maxRecency: 7 },
  Build: { maxUsers: 4, maxIntegrations: Infinity, maxRecency: 90 },
  Grow: { maxUsers: 10, maxIntegrations: Infinity, maxRecency: 365 },
  Scale: { maxUsers: 100, maxIntegrations: Infinity, maxRecency: Infinity },
};

export function canAddUser(tier: Tier, userOrganizationCount: number): boolean {
  return userOrganizationCount < tierConstraints[tier].maxUsers;
}
