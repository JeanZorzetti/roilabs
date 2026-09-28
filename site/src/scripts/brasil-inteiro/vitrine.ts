// A vitrine anda para o lado enquanto a página desce (desktop, com movimento liberado).
// No celular e com "reduzir movimento" ela é uma faixa que se arrasta com o dedo; nada aqui roda.
export function iniciarVitrine(el: HTMLElement) {
  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');
  const largo = matchMedia('(min-width: 900px)');
  let raf = 0;

  const atualizar = () => {
    raf = 0;
    // o percurso inteiro cabe em ~80% de uma tela de rolagem
    const p = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.8)));
    el.style.setProperty('--bi-trilho', p.toFixed(4));
  };
  const aoRolar = () => { if (!raf) raf = requestAnimationFrame(atualizar); };

  const aplicar = () => {
    if (largo.matches && !reduzido.matches) {
      el.dataset.movel = '';
      addEventListener('scroll', aoRolar, { passive: true });
      atualizar();
    } else {
      delete el.dataset.movel;
      removeEventListener('scroll', aoRolar);
      el.style.removeProperty('--bi-trilho');
    }
  };
  largo.addEventListener('change', aplicar);
  reduzido.addEventListener('change', aplicar);
  aplicar();
}
