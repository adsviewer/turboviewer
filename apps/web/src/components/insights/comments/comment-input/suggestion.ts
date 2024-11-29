/* eslint-disable -- fragile, do not touch */
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import MentionList from './mention-list';
import { getDefaultStore } from 'jotai';
import { organizationAtom } from '@/app/atoms/organization-atoms';
import { logger } from '@repo/logger';
import { userDetailsAtom } from '@/app/atoms/user-atoms';

const store = getDefaultStore();

export default {
  items: ({ query }) => {
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
    logger.info(usersData);

    return usersData.filter((item) => item.label.toLowerCase().startsWith(query.toLowerCase())).slice(0, 5);
  },

  render: () => {
    let component;
    let popup;

    return {
      onStart: (props) => {
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

      onUpdate(props) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup[0].hide();

          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
