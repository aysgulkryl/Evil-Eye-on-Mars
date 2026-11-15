// Vita puanı: astrobiyolojik keşif potansiyeli, ekibin rubriğine göre (Veri Tablosu > Vita Rubriği + Vita Puanlama).
//
// Her bölgeyi jeolog ve biyolog AYRI AYRI, her kriter için 0-3 puanla değerlendirir.
// Bir puanlayıcının Vita puanı = Σ(kriter puanı × ağırlık) ÷ (3 × dolu kriterlerin ağırlık toplamı) × 100
// Boş kriter hesaba katılmaz (0 sayılmaz); en az 4/5 kriter dolu değilse "yetersiz veri".
// İki puanlayıcı da tamamsa ortalaması alınır; aradaki fark arayüzde/raporda gösterilebilir.
// Rubrik puanı yoksa adaylar.ts içindeki eski uzman tahmini kullanılır ve "uzman tahmini" olarak işaretlenir.

export type VitaKriter = { id: string; ad: { tr: string; en: string }; agirlik: number | null };

// Kaynak: Veri Tablosu > Vita Rubriği (Hasan, biyoloji). Ağırlıklar eşit (%20).
export const VITA_KRITERLERI: VitaKriter[] = [
  { id: 'k1', ad: { tr: 'Kayaların yaşı', en: 'Age of the rocks' }, agirlik: 20 },
  { id: 'k2', ad: { tr: 'Sıvı suyun ne kadar süre kaldığı', en: 'Duration of liquid water' }, agirlik: 20 },
  { id: 'k3', ad: { tr: 'Biyoimza koruyan mineraller', en: 'Biosignature-preserving minerals' }, agirlik: 20 },
  { id: 'k4', ad: { tr: 'Çökel kaya ve hızlı gömülme', en: 'Sedimentary rock and rapid burial' }, agirlik: 20 },
  { id: 'k5', ad: { tr: 'Radyasyondan korunma ve erişim', en: 'Radiation shielding and access' }, agirlik: 20 },
];

/** Bir puanlayıcının 5 kritere verdiği puanlar (0-3), VITA_KRITERLERI sırasıyla. null = henüz puanlanmadı. */
export type KriterPuanlari = [number | null, number | null, number | null, number | null, number | null];
const bos = (): KriterPuanlari => [null, null, null, null, null];

// Kaynak: Veri Tablosu v6 > Vita Puanlama (15.11.2026). Jeolog (Oğuz) ve biyolog (Hasan) 16 bölgeyi BAĞIMSIZ puanladı;
// Vita = iki puanlayıcının ortalaması, aradaki fark arayüzde gösterilir.
// Puanlar "katı elips okuması"dır (kural 3-a): yalnızca iniş elipsi içindeki birimler; gerekçeler Kanıt sekmesinde.
export const VITA_PUANLARI: Record<string, { jeolog: KriterPuanlari; biyolog: KriterPuanlari }> = {
  jezero: { jeolog: [1, 2, 3, 3, 2], biyolog: [0, 3, 3, 2, 2] },
  oxia: { jeolog: [3, 2, 2, 2, 3], biyolog: [3, 2, 2, 3, 3] },
  mawrth: { jeolog: [2, 1, 2, 1, 3], biyolog: [3, 2, 3, 1, 3] },
  gale: { jeolog: [0, 3, 2, 1, 2], biyolog: [1, 2, 1, 1, 2] },
  arcadia: { jeolog: [0, 0, 1, 1, 2], biyolog: [0, 0, 1, 0, 1] },
  eberswalde: { jeolog: [2, 3, 1, 3, 1], biyolog: [1, 3, 2, 2, 2] },
  columbia: { jeolog: [2, 1, 3, 0, 2], biyolog: [1, 1, 2, 1, 2] },
  holden: { jeolog: [1, 1, 2, 2, 1], biyolog: [1, 2, 2, 2, 1] },
  nili: { jeolog: [2, 2, 2, 0, 1], biyolog: [2, 2, 2, 1, 1] },
  meridiani: { jeolog: [2, 2, 2, 1, 1], biyolog: [2, 2, 2, 2, 1] },
  aram: { jeolog: [0, 1, 1, 2, 0], biyolog: [1, 2, 2, 2, 1] },
  deut: { jeolog: [0, 0, 0, 2, 1], biyolog: [1, 0, 1, 1, 1] },
  hellas: { jeolog: [1, 1, 0, 2, 0], biyolog: [1, 1, 1, 1, 1] },
  melas: { jeolog: [2, 3, 2, 3, 2], biyolog: [1, 3, 2, 2, 2] },
  utopia: { jeolog: [1, 1, 1, 0, 1], biyolog: [0, 1, 1, 0, 1] },
  amazonis: { jeolog: [1, 1, 1, 1, 0], biyolog: [0, 1, 1, 1, 0] },
};

/** Bir puanlayıcının puanı hesaplanabilmesi için en az kaç kriterin dolu olması gerekir (ekip kararı: 5 kriterin 4'ü). */
export const MIN_DOLU_KRITER = 4;

export type PuanlayiciSonuc = {
  /** 0-100; null = yetersiz veri (MIN_DOLU_KRITER'den az kriter dolu) ya da ağırlıklar eksik. */
  puan: number | null;
  /** Kaç kriter puanlandı (boş hücreler hesaba katılmaz). */
  dolu: number;
  /** Toplam ağırlığın yüzde kaçı puanlanmış kriterlerden geliyor (0-100). */
  kapsam: number;
};

/**
 * Tek puanlayıcının Vita puanı.
 * Boş kriter (null) = veri yok: 0 sayılmaz, hesaba hiç katılmaz; ağırlıklar dolu kriterler arasında yeniden ölçeklenir.
 * ("Kanıt belirsiz" bir durumsa puanlayıcı rubrikteki belirsiz seviyesini BİLEREK seçer; bu boş hücreyle aynı şey değildir.)
 */
export function puanlayiciVita(p: KriterPuanlari, kriterler: VitaKriter[] = VITA_KRITERLERI): PuanlayiciSonuc {
  if (kriterler.some((k) => k.agirlik === null || (k.agirlik as number) < 0)) return { puan: null, dolu: 0, kapsam: 0 };
  const gecersiz = p.some((x) => x !== null && (x < 0 || x > 3));
  const toplamAgirlik = kriterler.reduce((s, k) => s + (k.agirlik as number), 0);
  let doluAgirlik = 0;
  let ham = 0;
  let dolu = 0;
  kriterler.forEach((k, i) => {
    const x = p[i];
    if (x === null || x === undefined) return;
    dolu += 1;
    doluAgirlik += k.agirlik as number;
    ham += x * (k.agirlik as number);
  });
  const kapsam = toplamAgirlik > 0 ? (doluAgirlik / toplamAgirlik) * 100 : 0;
  if (gecersiz || dolu < MIN_DOLU_KRITER || doluAgirlik <= 0) return { puan: null, dolu, kapsam };
  return { puan: (ham / (3 * doluAgirlik)) * 100, dolu, kapsam };
}

export type VitaSonuc = {
  /** 0-100; null ise rubrik puanı yok (ya da yetersiz veri), uzman tahmini kullanılır. */
  puan: number | null;
  jeolog: PuanlayiciSonuc | null;
  biyolog: PuanlayiciSonuc | null;
  /** İki puanlayıcı arasındaki fark (ikisi de varsa). Büyükse ekip konuşmalı. */
  fark: number | null;
};

export function vitaPuani(id: string, puanlar = VITA_PUANLARI, kriterler: VitaKriter[] = VITA_KRITERLERI): VitaSonuc {
  const kayit = puanlar[id];
  const j = kayit ? puanlayiciVita(kayit.jeolog, kriterler) : null;
  const b = kayit ? puanlayiciVita(kayit.biyolog, kriterler) : null;
  const var_ = [j?.puan ?? null, b?.puan ?? null].filter((x): x is number => x !== null);
  return {
    puan: var_.length ? var_.reduce((s, x) => s + x, 0) / var_.length : null,
    jeolog: j,
    biyolog: b,
    fark: j?.puan != null && b?.puan != null ? Math.abs(j.puan - b.puan) : null,
  };
}

// Erişilebilir hedeflerle okuma (Hasan, Veri Tablosu v5 > Vita Puanlama J–N sütunları): elipsin dışındaki, gezginin
// ulaşabileceği hedefler de sayılır. Arayüzde kullanılmaz; karşılaştırma ve jüri sorusu için saklanır.
// Sonuç: Oxia iki okumada da 1. (hedefleri elipsin içinde); erişilebilir okumada Jezero 2.ye çıkar.
export const VITA_PUANLARI_ERISILEBILIR: Record<string, KriterPuanlari> = {
  jezero: [3, 3, 3, 3, 2],
  oxia: [3, 2, 2, 3, 3],
  mawrth: [3, 2, 3, 1, 3],
  gale: [2, 2, 3, 2, 2],
  arcadia: [0, 0, 1, 0, 1],
  eberswalde: [1, 3, 2, 3, 2],
  columbia: [1, 2, 2, 1, 2],
  holden: [1, 2, 2, 3, 1],
  nili: [3, 2, 2, 1, 2],
  meridiani: [2, 2, 2, 2, 1],
  aram: [1, 2, 2, 2, 1],
  deut: [1, 0, 1, 1, 1],
  hellas: [1, 1, 1, 1, 1],
  melas: [1, 3, 2, 3, 2],
  utopia: [0, 1, 1, 0, 1],
  amazonis: [0, 1, 1, 1, 0],
};
