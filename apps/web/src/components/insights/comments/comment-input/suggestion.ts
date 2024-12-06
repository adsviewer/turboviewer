/* eslint-disable -- fragile, do not touch */
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance, Props } from 'tippy.js';
import MentionList from './mention-list';
import { getDefaultStore } from 'jotai';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

const store = getDefaultStore();

export default {
  items: ({ query }: { query: string }) => {
    const organization = store.get(organizationAtom);
    const userDetails = store.get(userDetailsAtom);

    // Make sure the current user is not included
    const usersData = organization?.organization.userOrganizations
      .filter((userOrganization) => userOrganization.userId !== userDetails.id)
      .map((userOrganization) => {
        return {
          id: userOrganization.userId,
          label: `${userOrganization.user.firstName} ${userOrganization.user.lastName}`,
        };
      });

    if (!usersData) return [];
    return usersData.filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: Instance<Props>[];

    return {
      onStart: (props: Record<string, any>) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: Record<string, any>) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: Record<string, any>) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }

        return (component.ref as { onKeyDown: (props: Record<string, any>) => boolean })?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
