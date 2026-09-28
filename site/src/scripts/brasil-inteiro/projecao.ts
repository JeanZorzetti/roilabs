// Projeção do mapa da home: equirretangular com correção de cosseno na latitude média do país.
// Os pôsteres em public/art/brasil-inteiro/ foram gerados com estes mesmos limites; mudar aqui exige
// gerar os pôsteres de novo, senão a troca pôster → canvas pula.
export const LIMITES = { lon0: -73.6, lon1: -32.0, lat0: 5.2, lat1: -34.2 };
export const COS_LAT = Math.cos((14 * Math.PI) / 180);
export const ASPECTO = ((LIMITES.lon1 - LIMITES.lon0) * COS_LAT) / (LIMITES.lat0 - LIMITES.lat1);

// Onde a luz nasce: Goiânia, a cidade de exemplo no rótulo do mapa.
export const ORIGEM = { lon: -49.2648, lat: -16.6869 };

/** Posição normalizada (0–1) de um ponto dentro da caixa do mapa. */
export function projetar(lon: number, lat: number): [number, number] {
  return [
    (lon - LIMITES.lon0) / (LIMITES.lon1 - LIMITES.lon0),
    (LIMITES.lat0 - lat) / (LIMITES.lat0 - LIMITES.lat1),
  ];
}
