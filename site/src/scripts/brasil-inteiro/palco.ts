// O palco da home: os 5.571 municípios em canvas 2D. Uma onda de luz sai da origem e acende o país
// (entrada), um pulso fino volta a passar de tempos em tempos (autônomo) e o ponteiro acende as cidades
// em volta dele (ponteiro). O pôster estático fica embaixo até o primeiro quadro pintar.
import { MUNICIPIOS } from './municipios';
import { ORIGEM, projetar } from './projecao';

const RAIO_PONTEIRO = 64; // px CSS
const INTERVALO_PULSO = 9; // s entre pulsos depois da onda

export function iniciar(caixa: HTMLElement) {
  const canvas = caixa.querySelector('canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const estilo = getComputedStyle(caixa);
  const token = (n: string) => estilo.getPropertyValue(n).trim();
  const cor = {
    apagado: token('--bi-ponto'),
    aceso: token('--bi-ponto-aceso'),
    frente: token('--bi-frente'),
    ponteiro: token('--bi-ponto-ponteiro'),
  };
  const CORES = [cor.apagado, cor.aceso, cor.frente, cor.ponteiro]; // índice = estado
  const ONDA = parseFloat(token('--bi-onda')) || 5.5;
  const PULSO = parseFloat(token('--bi-pulso')) || 2.8;

  const n = MUNICIPIOS.length / 2;
  const nx = new Float32Array(n), ny = new Float32Array(n);
  for (let i = 0; i < n; i++) [nx[i], ny[i]] = projetar(MUNICIPIOS[2 * i] / 100, MUNICIPIOS[2 * i + 1] / 100);
  const [ox, oy] = projetar(ORIGEM.lon, ORIGEM.lat);

  const px = new Float32Array(n), py = new Float32Array(n), dist = new Float32Array(n);
  const estado = new Uint8Array(n); // 0 apagado · 1 aceso · 2 frente · 3 ponteiro
  let w = 0, h = 0, ponto = 1, maxD = 1, faixa = 1;

  function medir() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas!.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ponto = Math.max(1, Math.min(2.2, w * 0.0026));
    const gx = ox * w, gy = oy * h;
    maxD = 1;
    for (let i = 0; i < n; i++) {
      px[i] = Math.round(nx[i] * w * dpr) / dpr;
      py[i] = Math.round(ny[i] * h * dpr) / dpr;
      dist[i] = Math.hypot(px[i] - gx, py[i] - gy);
      if (dist[i] > maxD) maxD = dist[i];
    }
    faixa = maxD * 0.07;
  }

  let mx = -1e4, my = -1e4;
  if (matchMedia('(hover: hover)').matches) {
    caixa.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    }, { passive: true });
    caixa.addEventListener('pointerleave', () => { mx = my = -1e4; });
  }

  function pintar(t: number) {
    const p = Math.min(1, t / ONDA);
    const r = (1 - (1 - p) ** 3) * (maxD + faixa); // ease-out cúbico: rápido perto de casa, assenta longe
    let rp = -1; // raio do pulso, depois que a onda termina
    if (p >= 1) {
      const c = ((t - ONDA) % INTERVALO_PULSO) / PULSO;
      if (c < 1) rp = c * (maxD + faixa);
    }
    const r2 = RAIO_PONTEIRO * RAIO_PONTEIRO;
    for (let i = 0; i < n; i++) {
      const d = dist[i];
      let s = d < r - faixa ? 1 : d < r ? 2 : 0;
      if (s === 1 && rp >= 0 && Math.abs(d - rp) < faixa * 0.35) s = 2;
      const dx = px[i] - mx, dy = py[i] - my;
      if (dx * dx + dy * dy < r2) s = 3;
      estado[i] = s;
    }
    ctx!.clearRect(0, 0, w, h);
    const lado = ponto, meio = ponto / 2;
    for (let s = 0; s < 4; s++) {
      ctx!.fillStyle = CORES[s];
      for (let i = 0; i < n; i++) if (estado[i] === s) ctx!.fillRect(px[i] - meio, py[i] - meio, lado, lado);
    }
  }

  // loop a 30 fps (60 com o ponteiro em cima: a luz do cursor responde no mesmo quadro),
  // pausado fora da tela e com a aba oculta
  let raf = 0, ultimo = 0, visivel = true, t0 = 0;
  const frame = (agora: number) => {
    raf = requestAnimationFrame(frame);
    if (mx < -1e3 && agora - ultimo < 1000 / 30) return;
    ultimo = agora;
    if (!t0) t0 = agora;
    pintar((agora - t0) / 1000);
    if (caixa.dataset.estado !== 'vivo') caixa.dataset.estado = 'vivo';
  };
  const ligar = () => { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(frame); };
  const parar = () => { cancelAnimationFrame(raf); raf = 0; };

  new ResizeObserver(() => medir()).observe(canvas);
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; visivel ? ligar() : parar(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? parar() : ligar()));
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (e.matches) { parar(); caixa.dataset.estado = 'parado'; }
  });

  medir();
  ligar();
}
