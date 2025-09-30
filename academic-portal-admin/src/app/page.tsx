import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to login as entry point
  redirect('/login');
}
