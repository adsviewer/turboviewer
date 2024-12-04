import { atom } from 'jotai';
import { type Organization, type GetOrganizationQuery } from '@/graphql/generated/schema-server';

export const organizationAtom = atom<GetOrganizationQuery | Organization | null>(null);
