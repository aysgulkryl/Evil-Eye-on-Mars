// Evil Eye on Mars çok kriterli karar (MCDA) motoru: yalnızca saf fonksiyonlar, arayüzden bağımsız.
//   Bileşik Skor = (G·wS + A·wA) / (wS + wA)     G: güvenlik, A: astrobiyoloji puanı (0-100)

import type { Aday } from '../data/adaylar';

export type Kisit = { acik: boolean; egim: number; kaya: number };
export type KisitIhlali = { tip: 'egim' | 'kaya'; deger: number; sinir: number };
export type Siralama = { aday: Aday; skor: number; sira: number; elendi: boolean; ihlaller: KisitIhlali[] };

/** No-Go eğim kontrolünde kullanılan değer: MOLA bölgesel eğimin en dik %10'u (yoksa site eğimi). Bkz. gorevEsikleri.ts. */
export const nogoEgim = (a: Pick<Aday, 'egim' | 'bolgeselEgimDik'>): number => a.bolgeselEgimDik ?? a.egim;

/** Mühendislik kısıtları (No-Go): eğim ya da kaya dağılımı sınırı aşan bölge, astrobiyolojisi ne olursa olsun elenir. */
export function kisitDurumu(a: Pick<Aday, 'egim' | 'kaya' | 'bolgeselEgimDik'>, k: Kisit): { gecer: boolean; ihlaller: KisitIhlali[] } {
  const ihlaller: KisitIhlali[] = [];
  const egim = nogoEgim(a);
  if (egim > k.egim) ihlaller.push({ tip: 'egim', deger: egim, sinir: k.egim });
  if (a.kaya > k.kaya) ihlaller.push({ tip: 'kaya', deger: a.kaya, sinir: k.kaya });
  return { gecer: ihlaller.length === 0, ihlaller };
}

export const RENK_YESIL = '#10b981';
export const RENK_SARI = '#f59e0b';
export const RENK_KIRMIZI = '#f43f5e';

/** İki ağırlık da 0 ise formül tanımsızdır (0/0): eşit ağırlık varsayılır. */
export function etkinAgirlik(wS: number, wA: number): { wS: number; wA: number; sifir: boolean } {
  const s = Math.max(0, wS);
  const a = Math.max(0, wA);
  return s + a <= 0 ? { wS: 1, wA: 1, sifir: true } : { wS: s, wA: a, sifir: false };
}

/** Astrobiyoloji ağırlığının toplam içindeki payı (0..1). */
export const astroPayi = (wS: number, wA: number): number => {
  const e = etkinAgirlik(wS, wA);
  return e.wA / (e.wS + e.wA);
};

export function bilesikSkor(a: Pick<Aday, 'guvenlik' | 'astro'>, wS: number, wA: number): number {
  const e = etkinAgirlik(wS, wA);
  return (a.guvenlik * e.wS + a.astro * e.wA) / (e.wS + e.wA);
}

/** Skor katkıları: güvenlik ve astrobiyolojinin bileşik skora kaç puan kattığı (toplamı bileşik skora eşit). */
export function katkilar(a: Pick<Aday, 'guvenlik' | 'astro'>, wS: number, wA: number) {
  const e = etkinAgirlik(wS, wA);
  const toplam = e.wS + e.wA;
  return { guvenlik: (a.guvenlik * e.wS) / toplam, astro: (a.astro * e.wA) / toplam };
}

/** %70 ve üzeri zümrüt yeşili, %50-%69 kehribar sarısı, %50 altı gül kırmızısı. */
export const skorRengi = (skor: number): string =>
  skor >= 70 ? RENK_YESIL : skor >= 50 ? RENK_SARI : RENK_KIRMIZI;

/** Uygun adaylar skora göre sıralanır (sira 1…n); kısıtlara takılanlar (elendi) sonda ve sira = 0 olarak listelenir. */
export function siralama(adaylar: Aday[], wS: number, wA: number, kisit?: Kisit): Siralama[] {
  const hepsi = adaylar.map((aday) => {
    const d = kisit?.acik ? kisitDurumu(aday, kisit) : { gecer: true, ihlaller: [] as KisitIhlali[] };
    return { aday, skor: bilesikSkor(aday, wS, wA), elendi: !d.gecer, ihlaller: d.ihlaller };
  });
  const sirala = (a: { skor: number; aday: Aday }, b: { skor: number; aday: Aday }) =>
    b.skor - a.skor || b.aday.guvenlik - a.aday.guvenlik || b.aday.astro - a.aday.astro || a.aday.ad.localeCompare(b.aday.ad);
  const uygun = hepsi
    .filter((h) => !h.elendi)
    .sort(sirala)
    .map((h, i) => ({ ...h, sira: i + 1 }));
  const elenen = hepsi
    .filter((h) => h.elendi)
    .sort(sirala)
    .map((h) => ({ ...h, sira: 0 }));
  return [...uygun, ...elenen];
}

/** Başka bir aday hem güvenlikte hem astrobiyolojide en az onun kadar iyiyse (biri kesin iyiyse) o aday "baskın"dır. */
export function baskinAday(hedef: Aday, adaylar: Aday[]): Aday | null {
  return (
    adaylar.find(
      (d) =>
        d.id !== hedef.id &&
        d.guvenlik >= hedef.guvenlik &&
        d.astro >= hedef.astro &&
        (d.guvenlik > hedef.guvenlik || d.astro > hedef.astro)
    ) || null
  );
}

/** Pareto cephesi: hiçbir adayın baskın olmadığı adaylar. */
export const paretoAdaylari = (adaylar: Aday[]): Aday[] => adaylar.filter((a) => baskinAday(a, adaylar) === null);

export type KazananParcasi = { baslangic: number; bitis: number; aday: Aday }; // yüzde 0-100: astrobiyoloji payı

/**
 * Tercih ekseni boyunca (astrobiyoloji payı %0 → %100) kimin 1. olduğunu bulur.
 * Bileşik skor payın doğrusal fonksiyonu olduğu için kazanan parçaları tam çözülür (örnekleme değil).
 */
export function kazananSeridi(adaylar: Aday[]): KazananParcasi[] {
  const parcalar: KazananParcasi[] = [];
  let t = 0; // 0..1
  let mevcut = enIyi(adaylar, 0);
  while (true) {
    // Mevcut kazananı geçecek en yakın t: skor(a,t) = G + t(A-G); mevcut m: kesişim t* = (Gm-Ga)/((Gm-Ga)+(Aa-Am))
    let sonraki: { t: number; aday: Aday } | null = null;
    adaylar.forEach((a) => {
      if (a.id === mevcut.id) return;
      const egimFark = a.astro - a.guvenlik - (mevcut.astro - mevcut.guvenlik); // a'nın mevcuda göre eğimi
      if (egimFark <= 1e-12) return; // a mevcutu hiç geçemez (sağa doğru)
      const tc = (mevcut.guvenlik - a.guvenlik) / egimFark;
      if (tc > t + 1e-12 && tc <= 1 && (!sonraki || tc < sonraki.t - 1e-12 || (Math.abs(tc - sonraki.t) <= 1e-12 && a.astro > sonraki.aday.astro))) {
        sonraki = { t: tc, aday: a };
      }
    });
    if (!sonraki) {
      parcalar.push({ baslangic: t * 100, bitis: 100, aday: mevcut });
      break;
    }
    const s: { t: number; aday: Aday } = sonraki;
    parcalar.push({ baslangic: t * 100, bitis: s.t * 100, aday: mevcut });
    t = s.t;
    mevcut = s.aday;
  }
  return parcalar;
}

function enIyi(adaylar: Aday[], t: number): Aday {
  return adaylar.reduce((m, a) => {
    const sa = (1 - t) * a.guvenlik + t * a.astro;
    const sm = (1 - t) * m.guvenlik + t * m.astro;
    return sa > sm + 1e-12 || (Math.abs(sa - sm) <= 1e-12 && a.astro > m.astro) ? a : m;
  });
}

/** Bir adayın 1. olduğu tercih aralıkları (astrobiyoloji payı, %); hiç 1. olamıyorsa boş dizi. */
export function birinciAraliklari(aday: Aday, adaylar: Aday[]): { baslangic: number; bitis: number }[] {
  return kazananSeridi(adaylar)
    .filter((p) => p.aday.id === aday.id && p.bitis - p.baslangic > 1e-9)
    .map(({ baslangic, bitis }) => ({ baslangic, bitis }));
}

/** Küre üzerindeki sütun yüksekliği (küre yarıçapı = 1 birim): bileşik skorla orantılı. */
export const sutunYuksekligi = (skor: number): number => 0.025 + (Math.max(0, Math.min(100, skor)) / 100) * 0.25;

/** Enlem/boylam (°) → küre üzerinde birim vektör. Doku merkezi boylam 0'dır (three.js SphereGeometry eşlemesi). */
export function konumVektoru(enlem: number, boylam: number): [number, number, number] {
  const la = (enlem * Math.PI) / 180;
  const lo = (boylam * Math.PI) / 180;
  return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
}

/** Küre yüzeyindeki bir noktanın (birim vektör) enlem/boylamı. konumVektoru'nun tersi. */
export function vektordenKonum(x: number, y: number, z: number): { enlem: number; boylam: number } {
  const r = Math.hypot(x, y, z) || 1;
  return {
    enlem: (Math.asin(Math.max(-1, Math.min(1, y / r))) * 180) / Math.PI,
    boylam: (Math.atan2(-z, x) * 180) / Math.PI,
  };
}

/** İki nokta arası büyük daire açısı (°). Küçük açılarda da kararlı olsun diye atan2(|çarpım|, nokta çarpımı) kullanılır. */
export function acisalMesafe(e1: number, b1: number, e2: number, b2: number): number {
  const [x1, y1, z1] = konumVektoru(e1, b1);
  const [x2, y2, z2] = konumVektoru(e2, b2);
  const nokta = x1 * x2 + y1 * y2 + z1 * z2;
  const carpim = Math.hypot(y1 * z2 - z1 * y2, z1 * x2 - x1 * z2, x1 * y2 - y1 * x2);
  return (Math.atan2(carpim, nokta) * 180) / Math.PI;
}

export function enYakinAday(enlem: number, boylam: number, adaylar: Aday[]): { aday: Aday; aci: number } {
  return adaylar
    .map((aday) => ({ aday, aci: acisalMesafe(enlem, boylam, aday.enlem, aday.boylam) }))
    .sort((a, b) => a.aci - b.aci)[0];
}

export const enlemMetni = (v: number) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'N' : 'S'}`;
export const boylamMetni = (v: number) => `${Math.abs(v).toFixed(2)}° ${v >= 0 ? 'E' : 'W'}`;

/** Eğim eşikleri: <5° ideal, 5-12° dikkat, >12° kritik risk. */
export const egimDurumu = (egim: number): 'ideal' | 'dikkat' | 'kritik' => (egim < 5 ? 'ideal' : egim <= 12 ? 'dikkat' : 'kritik');

export const MARS_KM_DERECE = 59.16; // 2π·3389,5 km / 360

export const dereceKm = (derece: number) => derece * MARS_KM_DERECE;

export type Taviz = {
  kazanan: Aday | null;
  referans: Aday | null; // aynı kısıtlarla, eşit (50/50) ağırlıkta kazanan
  dGuvenlik: number; // kazanan − referans (puan)
  dAstro: number;
  oran: number | null; // kazanılan puan başına feragat edilen puan
  yon: 'ayni' | 'guvenlik' | 'bilim';
};

/** Ağırlıkları dengeli seçimden uzaklaştırmanın bedeli: kazanılan ve feragat edilen puanlar. */
export function tavizAnalizi(adaylar: Aday[], wS: number, wA: number, kisit?: Kisit): Taviz {
  const kazanan = siralama(adaylar, wS, wA, kisit).find((s) => !s.elendi)?.aday ?? null;
  const referans = siralama(adaylar, 50, 50, kisit).find((s) => !s.elendi)?.aday ?? null;
  if (!kazanan || !referans || kazanan.id === referans.id) {
    return { kazanan, referans, dGuvenlik: 0, dAstro: 0, oran: null, yon: 'ayni' };
  }
  const dG = kazanan.guvenlik - referans.guvenlik;
  const dA = kazanan.astro - referans.astro;
  const yon = dG > dA ? 'guvenlik' : 'bilim';
  const kazanilan = yon === 'guvenlik' ? dG : dA;
  const feragat = yon === 'guvenlik' ? -dA : -dG;
  return { kazanan, referans, dGuvenlik: dG, dAstro: dA, oran: kazanilan > 0 && feragat > 0 ? feragat / kazanilan : null, yon };
}
