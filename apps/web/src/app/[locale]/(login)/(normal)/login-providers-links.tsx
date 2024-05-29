import Link from 'next/link';
import { urqlClientSdk } from '@/lib/urql/urql-client';

interface LoginProvidersLinksProps {
  message: string;
}
export default async function LoginProvidersLinks({ message }: LoginProvidersLinksProps): Promise<React.ReactElement> {
  const { loginProviders } = await urqlClientSdk().loginProviders();
  return (
    <div>
      {loginProviders.map((provider) => (
        <Link key={provider.name} className="text-center underline" href={provider.url}>
          {message} {provider.name}
        </Link>
      ))}
    </div>
  );
}
