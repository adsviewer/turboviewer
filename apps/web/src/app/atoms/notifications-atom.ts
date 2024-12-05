import { atom } from 'jotai';
import { type NotificationsQuery, type Notification } from '@/graphql/generated/schema-server';

export interface NotificationsData {
  notifications: Notification[];
  pageInfo: NotificationsQuery['notifications']['pageInfo'];
  totalUnreadNotifications: NotificationsQuery['notifications']['totalCount'];
}

export const notificationsDataAtom = atom<NotificationsData | null>(null);
