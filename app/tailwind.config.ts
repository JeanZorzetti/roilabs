import type { Config } from 'tailwindcss';

// Tailwind só para as telas da Vértice que vieram do site verticemarketing (o
// resto do app é CSS puro em globals.css). Por isso o `content` lista só esses
// arquivos, e o preflight fica desligado: o reset global do Tailwind mexeria no
// tamanho dos títulos e nas listas das telas da ROI Labs. O reset equivalente,
// preso em `.vtx`, mora em src/app/admin/vertice.css.
export default {
  content: [
    './src/components/vertice/**/*.tsx',
    './src/app/admin/admin-nav.tsx',
    './src/app/admin/layout.tsx',
    './src/app/admin/page.tsx',
    './src/app/admin/{entregaveis,onboarding,precos,projecao,propostas,contratos,entregas}/**/*.tsx',
  ],
  corePlugins: { preflight: false, container: false },
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        gold: { DEFAULT: 'hsl(var(--gold))', light: 'hsl(var(--gold-light))', dark: 'hsl(var(--gold-dark))' },
        navy: { DEFAULT: 'hsl(var(--navy))', light: 'hsl(var(--navy-light))', dark: 'hsl(var(--navy-dark))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        gold: 'var(--shadow-gold)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
} satisfies Config;
