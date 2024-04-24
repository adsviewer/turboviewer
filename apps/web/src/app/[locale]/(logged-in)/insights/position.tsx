import { Scan } from 'lucide-react';
import * as changeCase from 'change-case';

export default function Position({ position }: { position: string | null | undefined }): React.ReactElement | null {
  if (!position) return null;

  return (
    <div className="flex flex-row">
      <Scan />
      <div>{changeCase.sentenceCase(position)}</div>
    </div>
  );
}
