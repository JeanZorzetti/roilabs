"use client";

import { useState } from "react";

/**
 * As páginas públicas (proposta, termo, contrato) moram no site da Vértice, não
 * neste app: o cliente recebe um link com a marca da Vértice, e as escritas
 * dele (aceite, confirmação) rodam lá. Os dois lados leem o mesmo banco.
 */
export const VERTICE_SITE = "https://verticemarketing.roilabs.com.br";

/**
 * Link público de um documento — proposta (`/p/`), termo de entrega (`/e/`) ou
 * contrato (`/c/`).
 */
export function DocLink({ prefix, slug }: { prefix: "/p/" | "/e/" | "/c/"; slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${VERTICE_SITE}${prefix}${slug}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bloqueado (contexto não seguro, permissão negada): o link
      // continua visível ao lado para copiar à mão.
      setCopied(false);
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener"
        className="font-mono text-xs text-navy underline underline-offset-2 hover:text-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {prefix}
        {slug}
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded border border-border px-2 py-0.5 text-xs font-semibold text-navy hover:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {copied ? "Copiado!" : "Copiar link"}
      </button>
    </span>
  );
}
