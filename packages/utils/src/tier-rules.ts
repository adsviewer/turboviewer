export enum Tier {
  LAUNCH = 'Launch',
  BUILD = 'Build',
  GROW = 'Grow',
  SCALE = 'Scale',
}

export const maxUsersPerTier: Record<Tier, number> = {
  [Tier.LAUNCH]: 1,
  [Tier.BUILD]: 4,
  [Tier.GROW]: 10,
  [Tier.SCALE]: 100,
};

export function canAddUser(tier: Tier, currentUserCount: number): boolean {
  return currentUserCount < maxUsersPerTier[tier];
}
