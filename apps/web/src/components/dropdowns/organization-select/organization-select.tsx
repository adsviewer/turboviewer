'use client';

import { type ComboboxData, Select } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useAtomValue } from 'jotai';
import _ from 'lodash';
import { logger } from '@repo/logger';
import { initialUserDetails, userDetailsAtom } from '@/app/atoms/user-atoms';
import { switchOrganization } from '@/app/(authenticated)/organization/actions';
import { changeJWT } from '@/app/(unauthenticated)/actions';

export default function OrganizationSelect(): React.ReactNode {
  const userDetails = useAtomValue(userDetailsAtom);
  const [organizations, setOrganizations] = useState<ComboboxData>([]);

  useEffect(() => {
    // If user has at least one organization (most common case)
    if (!_.isEqual(userDetails, initialUserDetails) && userDetails.organizations.length) {
      const organizationsData = userDetails.organizations.map((organization) => {
        return {
          label: organization.organization.name,
          value: organization.organization.id,
        };
      });
      setOrganizations(organizationsData);
    }
  }, [userDetails, userDetails.organizations]);

  const handleOrganizationSelect = (organizationId: string | null): void => {
    if (organizationId) {
      void switchOrganization({ organizationId })
        .then((res) => {
          if (res.success) {
            void changeJWT(res.data.switchOrganization.token, res.data.switchOrganization.refreshToken).then(() => {
              window.location.reload();
            });
          }
        })
        .catch((err: unknown) => {
          logger.error(err);
        });
    }
  };

  return (
    <Select
      placeholder="Select organization"
      data={organizations}
      value={userDetails.currentOrganization?.id}
      onChange={handleOrganizationSelect}
      withCheckIcon
      comboboxProps={{ shadow: 'sm', transitionProps: { transition: 'fade-down', duration: 200 } }}
    />
  );
}