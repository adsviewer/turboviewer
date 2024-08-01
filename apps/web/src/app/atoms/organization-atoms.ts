import { atom } from 'jotai';
import { type GetOrganizationQuery } from '@/graphql/generated/schema-server';

export const organizationAtom = atom<GetOrganizationQuery | null>(null);
