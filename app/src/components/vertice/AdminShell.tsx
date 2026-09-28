import type { ReactNode } from "react";

/**
 * Corpo das telas da Vértice em /admin. A barra de navegação não mora aqui:
 * ela é do `app/admin/layout.tsx`, compartilhada com Candidaturas e com a
 * Precificação da ROI Labs, que não usam esta casca.
 */

type Props = {
  title: string;
  /** Uma linha dizendo o que a tela resolve. */
  lead?: string;
  /** Ação primária da tela — precisa caber acima da dobra. */
  action?: ReactNode;
  children: ReactNode;
};

export function AdminShell({ title, lead, action, children }: Props) {
  return (
    <div className="vtx min-h-screen bg-background">
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">{title}</h1>
            {lead ? <p className="mt-2 text-sm text-muted-foreground">{lead}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

/** Erro de carregamento — nunca disfarçado de "sem dados". */
export function DbErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-red-900">
        <span aria-hidden="true">⚠</span> Não conseguimos falar com o banco
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-red-900/90">
        Clientes, onboarding, propostas, contratos e entregas ficam no banco da ROI Labs (schema{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">vertice</code>). Se a mensagem abaixo
        falar de tabela que não existe, rode{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">scripts/migrate-vertice.ts</code>; se
        falar de conexão, confira a{" "}
        <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">DATABASE_URL</code> na EasyPanel. O
        catálogo de entregáveis e a tabela de preços continuam funcionando — eles não dependem do banco.
      </p>
      <p className="mt-3 font-mono text-xs text-red-900/70">{message}</p>
    </div>
  );
}
