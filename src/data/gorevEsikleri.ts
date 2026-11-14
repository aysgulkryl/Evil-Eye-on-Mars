// Görev eşikleri (No-Go sınırları): gerçek görevlerin iniş gereksinimleri (Veri Tablosu > Görev Eşikleri sekmesi).
// Değer bulunana kadar null kalır ve prototipteki eski sınır kullanılır; arayüz/raporda "kaynaksız" diye belirtilmelidir.
// ÖNEMLİ: eğimin hangi ÖLÇEKTE (ör. 2 m, 1 km taban) tanımlandığı yazılmalı; adaylar.ts'teki egim değerleriyle aynı ölçekte olmalı.

export type Esik = {
  /** Sınır değeri; null = henüz kaynaktan bulunmadı. */
  deger: number | null;
  birim: string;
  /** Hangi görevin gereksinimi, ör. 'MSL (Curiosity)'. */
  gorev: string | null;
  /** Kaynaklar sekmesindeki ID, ör. 'K07'. */
  kaynak: string | null;
  /** Ölçek/not, ör. '2-5 m taban uzunluğunda'. */
  not?: string;
  /** Prototipte kullanılan eski değer (kaynaksız); deger null iken bu kullanılır. */
  prototip: number;
};

// YER TUTUCU: Oğuz (jeoloji) Görev Eşikleri sekmesini doldurunca buraya yazılacak.
export const GOREV_ESIKLERI: { egim: Esik; kaya: Esik } = {
  egim: { deger: null, birim: '°', gorev: null, kaynak: null, prototip: 5 },
  kaya: { deger: null, birim: '%', gorev: null, kaynak: null, prototip: 10 },
};

/** Kullanılacak sınır: kaynaklı değer varsa o, yoksa prototipteki eski değer. */
export const esikDegeri = (e: Esik): number => e.deger ?? e.prototip;

/** Sınırın bir kaynağa dayanıp dayanmadığı (arayüzde "kaynaksız" uyarısı için). */
export const esikKaynakli = (e: Esik): boolean => e.deger !== null && e.kaynak !== null;
