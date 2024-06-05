import { redirect } from 'next/navigation';

export default function LoggedInPage(): React.ReactElement {
  redirect('/insights');
}
