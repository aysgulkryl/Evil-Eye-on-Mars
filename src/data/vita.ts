// Vita puanı: astrobiyolojik keşif potansiyeli, ekibin rubriğine göre (Veri Tablosu > Vita Rubriği + Vita Puanlama).
//
// Her bölgeyi jeolog ve biyolog AYRI AYRI, her kriter için 0-3 puanla değerlendirir.
// Bir puanlayıcının Vita puanı = Σ(kriter puanı × ağırlık) ÷ 3      (ağırlıklar toplamı 100 → sonuç 0-100)
// İki puanlayıcı da tamamsa ortalaması alınır; aradaki fark arayüzde/raporda gösterilebilir.
// Rubrik puanı yoksa adaylar.ts içindeki eski uzman tahmini kullanılır ve "uzman tahmini" olarak işaretlenir.

export type VitaKriter = { id: string; ad: { tr: string; en: string }; agirlik: number | null };

// YER TUTUCU: Hasan (biyoloji) Vita Rubriği sekmesini kesinleştirince adlar ve ağırlıklar buraya yazılacak.
export const VITA_KRITERLERI: VitaKriter[] = [
  { id: 'k1', ad: { tr: 'Suyun ne kadar süre kaldığı', en: 'Duration of liquid water' }, agirlik: null },
  { id: 'k2', ad: { tr: 'Biyoimza koruyan mineraller', en: 'Biosignature-preserving minerals' }, agirlik: null },
  { id: 'k3', ad: { tr: 'Kayaların yaşı / dönemi', en: 'Age / period of the rocks' }, agirlik: null },
  { id: 'k4', ad: { tr: 'Sulu ortamın türü', en: 'Type of aqueous environment' }, agirlik: null },
  { id: 'k5', ad: { tr: 'Biyokimyasal uyum (Meke halofilleri)', en: 'Biochemical fit (Lake Meke halophiles)' }, agirlik: null },
];

/** Bir puanlayıcının 5 kritere verdiği puanlar (0-3), VITA_KRITERLERI sırasıyla. null = henüz puanlanmadı. */
export type KriterPuanlari = [number | null, number | null, number | null, number | null, number | null];
const bos = (): KriterPuanlari => [null, null, null, null, null];

// YER TUTUCU: Vita Puanlama sekmesindeki Jeolog ve Biyolog satırları buraya yazılacak.
export const VITA_PUANLARI: Record<string, { jeolog: KriterPuanlari; biyolog: KriterPuanlari }> = {
  jezero: { jeolog: bos(), biyolog: bos() },
  oxia: { jeolog: bos(), biyolog: bos() },
  mawrth: { jeolog: bos(), biyolog: bos() },
  gale: { jeolog: bos(), biyolog: bos() },
  arcadia: { jeolog: bos(), biyolog: bos() },
  eberswalde: { jeolog: bos(), biyolog: bos() },
  columbia: { jeolog: bos(), biyolog: bos() },
  holden: { jeolog: bos(), biyolog: bos() },
  nili: { jeolog: bos(), biyolog: bos() },
  meridiani: { jeolog: bos(), biyolog: bos() },
  aram: { jeolog: bos(), biyolog: bos() },
  deut: { jeolog: bos(), biyolog: bos() },
  hellas: { jeolog: bos(), biyolog: bos() },
  melas: { jeolog: bos(), biyolog: bos() },
  utopia: { jeolog: bos(), biyolog: bos() },
  amazonis: { jeolog: bos(), biyolog: bos() },
};

/** Tek puanlayıcının 0-100 Vita puanı; bir kriter ya da ağırlık eksikse null. */
export function puanlayiciVita(p: KriterPuanlari, kriterler: VitaKriter[] = VITA_KRITERLERI): number | null {
  if (kriterler.some((k) => k.agirlik === null)) return null;
  if (p.some((x) => x === null || x < 0 || x > 3)) return null;
  const toplamAgirlik = kriterler.reduce((s, k) => s + (k.agirlik as number), 0);
  if (toplamAgirlik <= 0) return null;
  const ham = kriterler.reduce((s, k, i) => s + (p[i] as number) * (k.agirlik as number), 0);
  return (ham / (3 * toplamAgirlik)) * 100; // ağırlık toplamı 100 olmasa da 0-100'e ölçeklenir
}

export type VitaSonuc = {
  /** 0-100; null ise rubrik puanı yok, uzman tahmini kullanılır. */
  puan: number | null;
  jeolog: number | null;
  biyolog: number | null;
  /** İki puanlayıcı arasındaki fark (ikisi de varsa). Büyükse ekip konuşmalı. */
  fark: number | null;
};

export function vitaPuani(id: string, puanlar = VITA_PUANLARI, kriterler: VitaKriter[] = VITA_KRITERLERI): VitaSonuc {
  const kayit = puanlar[id];
  const j = kayit ? puanlayiciVita(kayit.jeolog, kriterler) : null;
  const b = kayit ? puanlayiciVita(kayit.biyolog, kriterler) : null;
  const var_ = [j, b].filter((x): x is number => x !== null);
  return {
    puan: var_.length ? var_.reduce((s, x) => s + x, 0) / var_.length : null,
    jeolog: j,
    biyolog: b,
    fark: j !== null && b !== null ? Math.abs(j - b) : null,
  };
}
