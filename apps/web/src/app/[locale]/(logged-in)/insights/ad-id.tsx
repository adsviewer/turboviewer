import { Fingerprint } from 'lucide-react';
import truncate from 'lodash/truncate';

export default function AdId({ adId }: { adId: string | null | undefined }): React.ReactElement | null {
  if (!adId) return null;

  return (
    <div className="flex flex-row">
      <Fingerprint />
      <div>{truncate(adId, { length: 10 })}</div>
    </div>
  );
}
