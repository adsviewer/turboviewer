import { atom } from 'jotai';
import { Tier, type MeQuery } from '@/graphql/generated/schema-server';

export const DEFAULT_INSIGHTS_PER_ROW = 3;

export const initialUserDetails: MeQuery['me'] = {
  __typename: 'User',
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  photoUrl: '',
  allRoles: [],
  preferences: null,
  currentOrganization: {
    __typename: 'Organization',
    id: '',
    name: '',
    tier: Tier.Launch,
    isRoot: false,
    parentId: null,
    integrations: [],
    userOrganizations: [],
  },
  organizations: [],
  comments: [],
  taggedInComment: [],
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
