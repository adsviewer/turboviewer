import { type JSX } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import Cards from '@/app/(logged-in)/settings/integrations/cards';
import { IntegrationStatus, IntegrationType } from '@/graphql/generated/schema-server';

export async function CardsCall(): Promise<JSX.Element> {
  const { settingsChannels } = await urqlClientSdk().settingsChannels();
  return <Cards integrations={settingsChannels} />;
}

export function CardsNoCall(): JSX.Element {
  const integrations = Object.values(IntegrationType).map((type) => ({ type, status: IntegrationStatus.ComingSoon }));
  return <Cards integrations={integrations} />;
}
