// A vitrine anda só quando a pessoa pede: setas, arrasto (dedo ou trackpad) ou foco do teclado.
// Pedido da dona em 28/09/2026: nada de faixa andando sozinha com a rolagem da página.
export function iniciarVitrine(el: HTMLElement) {
  const janela = el.querySelector<HTMLElement>('.bi-vitrine__janela');
  const setas = el.querySelectorAll<HTMLButtonElement>('.bi-vitrine__seta');
  if (!janela || !setas.length) return;

  const reduzido = matchMedia('(prefers-reduced-motion: reduce)');

  // um passo = um cartão + o espaço entre eles
  const passo = () => {
    const item = janela.querySelector<HTMLElement>('.bi-vitrine__item');
    const trilho = janela.firstElementChild as HTMLElement | null;
    const gap = trilho ? parseFloat(getComputedStyle(trilho).columnGap) || 0 : 0;
    return item ? item.getBoundingClientRect().width + gap : janela.clientWidth * 0.8;
  };

  const atualizar = () => {
    const fim = janela.scrollWidth - janela.clientWidth - 2;
    setas.forEach((b) => {
      b.disabled = Number(b.dataset.dir) < 0 ? janela.scrollLeft <= 2 : janela.scrollLeft >= fim;
    });
  };

  setas.forEach((b) =>
    b.addEventListener('click', () => {
      janela.scrollBy({ left: Number(b.dataset.dir) * passo(), behavior: reduzido.matches ? 'auto' : 'smooth' });
    }),
  );

  let raf = 0;
  janela.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; atualizar(); }); }, { passive: true });
  new ResizeObserver(atualizar).observe(janela);
  atualizar();
}
