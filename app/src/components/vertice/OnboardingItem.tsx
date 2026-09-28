"use client";

import { useEffect, useRef } from "react";
import { toggleOnboardingItem, saveItemNote } from "@/lib/vertice/actions";
import type { ChecklistItem } from "@/lib/vertice/onboarding";

/**
 * Um item do checklist.
 *
 * Checkbox nativo dentro de um <form> com server action: o estado é anunciado
 * pelo leitor de tela de graça e a marcação funciona no teclado sem ARIA.
 * Com JS, o `onChange` faz requestSubmit() e a página não navega — o foco fica
 * no próprio checkbox. Sem JS, o botão "Salvar" (sr-only, mas focável) envia.
 */

type Props = {
  clientId: number;
  serviceId: string;
  item: ChecklistItem;
  done: boolean;
  doneAt: string | null;
  note: string | null;
};

const OWNER_LABEL = { vertice: "Vértice", cliente: "Cliente" } as const;

export function OnboardingItem({ clientId, serviceId, item, done, doneAt, note }: Props) {
  const noteRef = useRef<HTMLFormElement>(null);
  const boxRef = useRef<HTMLInputElement>(null);
  const inputId = `${serviceId}-${item.id}`;

  // O que o servidor gravou é a verdade. Roda depois de cada render, então
  // pega tanto o reset do form quanto uma gravação que falhou (a marca volta).
  useEffect(() => {
    if (boxRef.current && boxRef.current.checked !== done) {
      boxRef.current.checked = done;
    }
  });

  return (
    <li
      className={
        item.blocking
          ? "rounded-lg border border-border border-l-4 border-l-gold bg-white p-3 shadow-soft"
          : "rounded-lg border border-border bg-white p-3"
      }
    >
      <div className="flex items-start gap-3">
        <form action={toggleOnboardingItem} className="flex items-center pt-0.5">
          <input type="hidden" name="clientId" value={clientId} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="itemId" value={item.id} />
          <input type="hidden" name="owner" value={item.owner} />
          <input type="hidden" name="done" value={done ? "0" : "1"} />
          {/* Não-controlado de propósito. React reseta o <form> depois da server
              action; com `checked` controlado o checkbox voltava para desmarcado
              enquanto o resto da linha já dizia "feito". `defaultChecked` dá o
              valor do servidor e o efeito abaixo reconcilia o DOM depois do
              reset — sem remontar o input, que jogaria o foco no body. */}
          <input
            ref={boxRef}
            id={inputId}
            type="checkbox"
            defaultChecked={done}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className="h-5 w-5 cursor-pointer accent-[hsl(var(--navy))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          />
          <button type="submit" className="sr-only">
            {done ? "Desmarcar item" : "Marcar item como feito"}
          </button>
        </form>

        <div className="min-w-0 flex-1">
          <label
            htmlFor={inputId}
            className={
              done
                ? "cursor-pointer text-sm text-muted-foreground line-through decoration-navy/40"
                : "cursor-pointer text-sm font-medium text-foreground"
            }
          >
            {item.label}
          </label>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span
              className={
                item.owner === "cliente"
                  ? "rounded-full bg-navy/10 px-2 py-0.5 font-semibold text-navy"
                  : "rounded-full bg-card px-2 py-0.5 font-semibold text-navy/70"
              }
            >
              {OWNER_LABEL[item.owner]}
            </span>
            {item.blocking ? (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 font-semibold text-gold-dark">
                ⏱ Trava o prazo
              </span>
            ) : null}
            {doneAt ? (
              <span className="text-muted-foreground">
                Feito em {new Date(doneAt).toLocaleDateString("pt-BR")}
              </span>
            ) : null}
          </div>

          {item.detail ? (
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
          ) : null}

          <form ref={noteRef} action={saveItemNote} className="mt-2">
            <input type="hidden" name="clientId" value={clientId} />
            <input type="hidden" name="serviceId" value={serviceId} />
            <input type="hidden" name="itemId" value={item.id} />
            <label htmlFor={`${inputId}-note`} className="sr-only">
              Observação sobre &ldquo;{item.label}&rdquo; (opcional)
            </label>
            <input
              id={`${inputId}-note`}
              name="note"
              type="text"
              defaultValue={note ?? ""}
              placeholder="ex.: cobrado no dia 12, sem resposta"
              maxLength={500}
              onBlur={(event) => {
                if (event.currentTarget.defaultValue !== event.currentTarget.value) {
                  noteRef.current?.requestSubmit();
                }
              }}
              className="w-full rounded border border-border bg-card px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold"
            />
            <button type="submit" className="sr-only">
              Salvar observação
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}
