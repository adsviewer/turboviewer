import { type MilestoneEnum, prisma } from '@repo/database';
import { type UserWithRoles, userWithRoles } from './user-roles';

export const removeUserMilestone = async (userId: string, milestone: MilestoneEnum): Promise<UserWithRoles> => {
  const { milestones } = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { milestones: true },
  });
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- This will go away once milestones have more values
  const updatedMilestones = milestones.filter((m) => m !== milestone);
  return await prisma.user.update({
    ...userWithRoles,
    where: { id: userId },
    data: {
      milestones: updatedMilestones,
    },
  });
};
