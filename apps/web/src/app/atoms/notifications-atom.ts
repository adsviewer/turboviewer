import { atom } from 'jotai';
import { type Notification } from '@/graphql/generated/schema-server';

export const notificationsDataAtom = atom<Notification[]>([]);
