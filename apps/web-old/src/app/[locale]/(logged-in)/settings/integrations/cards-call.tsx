import { type JSX } from 'react';
import { urqlClientSdk } from '@/lib/urql/urql-client';
import { IntegrationStatus, IntegrationType } from '@/graphql/generated/schema-server';
import Cards from '@/app/[locale]/(logged-in)/settings/integrations/cards';

export async function CardsCall(): Promise<JSX.Element> {
  const { settingsChannels } = await urqlClientSdk().settingsChannels();
  return <Cards integrations={settingsChannels} />;
}

export function CardsNoCall(): JSX.Element {
  const integrations = Object.values(IntegrationType).map((type) => ({ type, status: IntegrationStatus.ComingSoon }));
  // @ts-expect-error -- don't care about the type here
  return <Cards integrations={integrations} />;
}
