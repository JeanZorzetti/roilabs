import { redirect } from 'next/navigation';
import { isAuthed } from '@/lib/auth';

export const metadata = { title: 'Entrar — ROI Labs' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAuthed()) redirect('/admin');
  const { e } = await searchParams;

  return (
    <main className="login">
      <form className="login__card" action="/api/auth/login" method="POST">
        <span className="brand-mark">R</span>
        <h1>ROI Labs · Admin</h1>
        <p className="muted">Acesso interno.</p>
        {e && <p className="err">Senha incorreta.</p>}
        <label htmlFor="pw">Senha</label>
        <input id="pw" name="password" type="password" required autoFocus autoComplete="current-password" />
        <button className="btn" type="submit">Entrar</button>
      </form>
    </main>
  );
}
