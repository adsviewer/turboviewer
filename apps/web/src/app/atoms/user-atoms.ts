import { atom } from 'jotai';
import { Tier, type MeQuery } from '@/graphql/generated/schema-server';

export const initialUserDetails: MeQuery['me'] = {
  __typename: 'User',
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  photoUrl: '',
  allRoles: [],
  currentOrganization: {
    __typename: 'Organization',
    id: '',
    name: '',
    tier: Tier.Launch,
    isRoot: false,
    parentId: null,
    integrations: [],
  },
  organizations: [],
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
