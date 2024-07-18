import { atom } from 'jotai';
import { type MeQuery } from '@/graphql/generated/schema-server';

export const initialUserDetails: MeQuery['me'] = {
  id: '',
  firstName: '',
  lastName: '',
  email: '',
  photoUrl: '',
  allRoles: [],
  currentOrganization: {
    id: '',
    name: '',
    isRoot: false,
    parentId: null,
  },
  organizations: [],
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
