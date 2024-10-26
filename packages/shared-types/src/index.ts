import type { Integration, MilestoneEnum, OrganizationRoleEnum, RoleEnum, UserStatus } from '@repo/database';
import { type JwtPayload } from 'jsonwebtoken';

export interface AJwtPayload extends JwtPayload {
  userId: string;
  roles?: (RoleEnum | OrganizationRoleEnum)[];
  organizationId?: string | null;
  type?: 'refresh';
  userStatus: UserStatus;
  milestones: MilestoneEnum[];
}

export type NewIntegrationEvent = Pick<Integration, 'id' | 'type'>;
