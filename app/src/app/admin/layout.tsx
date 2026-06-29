import { requireAuth } from '@/lib/auth';
import { Nav } from './nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(); // guards every page nested here

  return (
    <>
      <header className="topbar">
        <span className="topbar__brand">
          <span className="brand-mark">R</span> ROI Labs
        </span>
        <Nav />
        <span className="topbar__spacer" />
        <form action="/api/auth/logout" method="POST">
          <button className="btn btn--ghost btn--sm" type="submit">Sair</button>
        </form>
      </header>
      {children}
    </>
  );
}
