import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, verifySession } from './session';

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

// For server pages/layouts: bounce to /login if no valid session.
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect('/login');
}
