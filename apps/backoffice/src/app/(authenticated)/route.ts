import { redirect } from 'next/navigation';

export function GET(_request: Request): void {
  redirect('/emulate');
}
