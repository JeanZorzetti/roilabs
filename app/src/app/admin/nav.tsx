'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: [string, string][] = [
  ['/admin', 'Painel'],
  ['/admin/candidaturas', 'Candidaturas'],
  ['/admin/cadeiras', 'Cadeiras'],
  ['/admin/leads', 'Leads Goiânia'],
  ['/admin/pedidos', 'Pedidos'],
  ['/admin/centros-de-custo', 'Centros de custo'],
  ['/admin/cupons', 'Cupons'],
  ['/admin/financeiro', 'Financeiro'],
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="topbar__nav">
      {LINKS.map(([href, label]) => (
        <Link key={href} href={href} className={path === href ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
