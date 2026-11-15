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

// Eğim: MSL (Curiosity) mühendislik kısıtı, 2–10 km ölçeğinde azami 20°.
//   Karşılaştırılan değer: MOLA 16 ppd bölgesel eğimin en dik %10'u (p90, ~3,7 km piksel, 10 km pencere) = adaylar.ts bolgeselEgimDik.
//   Bu bir BÖLGESEL ön elemedir; metre ölçeğindeki iniş eğimi (2–5 m) HiRISE verisi gerektirir.
// Kaya: kaynak bulunamadı (Görev Eşikleri sekmesi boş); prototip değeri "kaynaksız" olarak kalır.
export const GOREV_ESIKLERI: { egim: Esik; kaya: Esik } = {
  egim: {
    deger: 20, birim: '°', gorev: 'MSL (Curiosity)',
    kaynak: "Mars Science Laboratory Engineering Constraints User's Guide (JPL, 2007)",
    not: '2–10 km ölçeği; MOLA bölgesel eğim, en dik %10 ile karşılaştırılır', prototip: 5,
  },
  kaya: { deger: null, birim: '%', gorev: null, kaynak: null, prototip: 10 },
};

/** Kullanılacak sınır: kaynaklı değer varsa o, yoksa prototipteki eski değer. */
export const esikDegeri = (e: Esik): number => e.deger ?? e.prototip;

/** Sınırın bir kaynağa dayanıp dayanmadığı (arayüzde "kaynaksız" uyarısı için). */
export const esikKaynakli = (e: Esik): boolean => e.deger !== null && e.kaynak !== null;
