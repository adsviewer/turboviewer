import { type Tier } from '@repo/database';

export const tierConstraints: Record<
  Tier,
  { maxUsers: number; maxIntegrations: number; maxRecency: number; order: number }
> = {
  Launch: { maxUsers: 1, maxIntegrations: 1, maxRecency: 7, order: 1 },
  Build: { maxUsers: 4, maxIntegrations: Infinity, maxRecency: 90, order: 2 },
  Grow: { maxUsers: 10, maxIntegrations: Infinity, maxRecency: 365, order: 3 },
  Scale: { maxUsers: 100, maxIntegrations: Infinity, maxRecency: 365, order: 4 },
};

export const canAddUser = (tier: Tier, userOrganizationCount: number): boolean =>
  userOrganizationCount < tierConstraints[tier].maxUsers;
