// Gate 03 como teste: quatro perguntas, uma de cada vez, com "Sim" e "Ainda não".
// As respostas ficam só na página (não entram no formulário). Sem JS, o cartão mantém a lista
// estática dos quatro pontos; este script troca para o teste.
// As perguntas são os quatro itens do "É pra você se" da versão anterior da seção.
const PERGUNTAS: [pergunta: string, emAberto: string][] = [
  ['Você tem catálogo próprio e amplo no seu nicho?', 'catálogo próprio e amplo'],
  ['Você aguenta estoque e despacho rápido, pronta-entrega de verdade?', 'estoque e despacho rápido'],
  ['Seu produto é forte, a presença online é fraca, e você quer escalar?', 'vontade de escalar a venda online'],
  ['Você topa exclusividade de cadeira atrelada a SLA?', 'exclusividade atrelada a SLA'],
];

export function iniciarTeste(el: HTMLElement) {
  const q = <T extends HTMLElement>(s: string) => el.querySelector<T>(s)!;
  const passo = q('[data-passo]');
  const pergunta = q('[data-pergunta]');
  const fluxo = q('[data-fluxo]');
  const ok = q('[data-ok]');
  const talvez = q('[data-talvez]');
  const aberto = q('[data-aberto]');
  const barras = [...el.querySelectorAll<HTMLElement>('.bi-teste__barras i')];
  const sim = q<HTMLButtonElement>('[data-r="sim"]');
  let respostas: boolean[] = [];

  function mostrar(focar = false) {
    const i = respostas.length;
    const fim = i === PERGUNTAS.length;
    const passou = fim && respostas.every(Boolean);
    barras.forEach((b, k) => { b.className = k >= i ? '' : respostas[k] ? 'sim' : 'nao'; });
    fluxo.hidden = fim;
    ok.hidden = !passou;
    talvez.hidden = !fim || passou;
    passo.textContent = fim ? 'Resultado' : `Pergunta ${i + 1} de ${PERGUNTAS.length}`;
    if (fim) {
      aberto.textContent = PERGUNTAS.filter((_, k) => !respostas[k]).map(([, a]) => a).join(', ') + '.';
      // leitor de tela e teclado vão direto para o resultado
      if (focar) q(passou ? '[data-ok] [tabindex]' : '[data-talvez] [tabindex]').focus();
    } else {
      pergunta.textContent = PERGUNTAS[i][0];
    }
  }

  el.querySelectorAll<HTMLButtonElement>('[data-r]').forEach((b) =>
    b.addEventListener('click', () => {
      respostas.push(b.dataset.r === 'sim');
      mostrar(true);
    }),
  );
  el.querySelectorAll<HTMLButtonElement>('[data-refazer]').forEach((b) =>
    b.addEventListener('click', () => {
      respostas = [];
      mostrar();
      sim.focus();
    }),
  );

  q('[data-estatico]').hidden = true;
  q('[data-vivo]').hidden = false;
  mostrar();
}
