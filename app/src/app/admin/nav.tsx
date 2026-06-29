'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS: [string, string][] = [
  ['/admin', 'Candidaturas'],
  ['/admin/cadeiras', 'Cadeiras'],
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
