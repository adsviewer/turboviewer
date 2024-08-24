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
};

export const userDetailsAtom = atom<MeQuery['me']>(initialUserDetails);
