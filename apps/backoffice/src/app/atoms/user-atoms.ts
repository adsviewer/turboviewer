import { atom } from 'jotai';
import { type MeQuery } from '@/graphql/generated/schema-server';

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
    isRoot: false,
    parentId: null,
    integrations: [],
  },
  organizations: [],
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
