import { atom } from 'jotai';
import { type MeQuery } from '@/graphql/generated/schema-server';

const initialUserDetails: MeQuery['me'] = {
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
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
