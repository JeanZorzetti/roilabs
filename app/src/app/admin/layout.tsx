import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { AdminNav } from './admin-nav';
import './vertice.css';

const FOCO_NA_BARRA =
  ' focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(); // guards every page nested here

  return (
    <>
      <div className="vtx">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow-elevated"
        >
          Pular para o conteúdo
        </a>

        <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-dark text-white shadow-soft">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <Link
              href="/admin"
              className={'flex shrink-0 items-center gap-3 rounded-md' + FOCO_NA_BARRA}
            >
              <span className="text-lg font-bold tracking-tight text-white">ROI Labs</span>
              <span className="border-l border-white/25 pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">
                Admin
              </span>
            </Link>

            <AdminNav />

            <form action="/api/auth/logout" method="POST" className="shrink-0">
              <button
                type="submit"
                className={
                  'rounded-md px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white' + FOCO_NA_BARRA
                }
              >
                Sair
              </button>
            </form>
          </div>
        </header>
      </div>

      <div id="conteudo">{children}</div>
    </>
  );
}
