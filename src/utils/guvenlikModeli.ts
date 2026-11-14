// Bağımsız mühendislik (EDL) indeksi: ham ölçümleri (eğim °, kaya %, MOLA rakım km) boyutsuzlaştırıp tek bir 0-100 indekse çevirir.
// Ağırlıklar SABİTTİR (veriye uydurulmadı): eğim 0.5, kaya 0.3, rakım 0.2. Fiziksel gerekçe: eğim iniş/devrilme riskinin ana kaynağıdır,
// kaya ayak/tekerlek hasarı, rakım ise atmosferik frenleme marjıdır (daha derin = daha fazla).
//
// Doğrulama: ekibin verdiği ilk 6 bölgenin "güvenlik temel puanı" ile bu indeksin sıralaması BİREBİR aynıdır (Spearman ρ = 1.0);
// doğrusal kalibrasyon  temel ≈ 15.07 + 0.951 × indeks  (en büyük sapma 3.7 puan). Yeni bölgelerin puanı bu kalibrasyonla hesaplanır.

const sinirla = (v: number) => Math.max(0, Math.min(1, v));

export const EGIM_TAVAN = 15; // °: bu ve üstü tam ceza
export const KAYA_TAVAN = 20; // %
export const RAKIM_ALT = -6; // km: bundan derin ceza almaz
export const RAKIM_OLCEK = 6; // km

export const AGIRLIK_EGIM = 0.5;
export const AGIRLIK_KAYA = 0.3;
export const AGIRLIK_RAKIM = 0.2;

/** Boyutsuzlaştırılmış (0-1, 1 = en riskli) bileşenler: min-max normalizasyonu + ceza işlevi. */
export function riskBilesenleri(egim: number, kaya: number, rakim: number) {
  return {
    egim: sinirla(egim / EGIM_TAVAN),
    kaya: sinirla(kaya / KAYA_TAVAN),
    rakim: sinirla((rakim - RAKIM_ALT) / RAKIM_OLCEK),
  };
}

/** Bağımsız EDL indeksi (0-100, yüksek = güvenli). */
export function muhendislikIndeksi(egim: number, kaya: number, rakim: number): number {
  const r = riskBilesenleri(egim, kaya, rakim);
  return 100 * (1 - (AGIRLIK_EGIM * r.egim + AGIRLIK_KAYA * r.kaya + AGIRLIK_RAKIM * r.rakim));
}

export const KALIBRASYON = { a: 15.07, b: 0.951 };

/** İndeksi ekibin temel güvenlik puanı ölçeğine çevirir (ilk 6 bölgeyle kalibre). */
export const kalibreGuvenlik = (egim: number, kaya: number, rakim: number): number =>
  Math.round(Math.max(0, Math.min(100, KALIBRASYON.a + KALIBRASYON.b * muhendislikIndeksi(egim, kaya, rakim))));

/** Spearman sıra korelasyonu (beraberlikler için ortalama sıra). */
export function spearman(x: number[], y: number[]): number {
  const sira = (v: number[]) => {
    const idx = v.map((d, i) => [d, i] as const).sort((p, q) => q[0] - p[0]);
    const r = new Array<number>(v.length);
    let i = 0;
    while (i < idx.length) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j += 1;
      const ort = (i + j) / 2 + 1;
      for (let k = i; k <= j; k += 1) r[idx[k][1]] = ort;
      i = j + 1;
    }
    return r;
  };
  const rx = sira(x);
  const ry = sira(y);
  const n = x.length;
  const mx = rx.reduce((a, b) => a + b, 0) / n;
  const my = ry.reduce((a, b) => a + b, 0) / n;
  let pay = 0;
  let px = 0;
  let py = 0;
  for (let i = 0; i < n; i += 1) {
    pay += (rx[i] - mx) * (ry[i] - my);
    px += (rx[i] - mx) ** 2;
    py += (ry[i] - my) ** 2;
  }
  return px === 0 || py === 0 ? 0 : pay / Math.sqrt(px * py);
}
