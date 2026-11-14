// Meke analog benzerlik hesabı: bir Mars bölgesi, Dünya analoğu Meke Maarı'na ne kadar benziyor?
//
// Yöntem: Meke'nin uydudan gözlenebilen özellikleri (krater gölü yapısı, sülfat, klorür, volkanik bağlam, paleogöl)
// her Mars bölgesinde aranır. Her özellik: Evet = 1, Belirsiz = 0,5, Hayır = 0 puan.
// Eşleşme (%) = Σ(puan × ağırlık) ÷ Σ(ağırlık) × 100
// Verisi olmayan özellik (null) hesaba katılmaz; "kapsam" ne kadar ağırlığın veriyle desteklendiğini gösterir.
//
// Ağırlıklar ekip kararıdır (Veri Tablosu > Analog Ağırlıkları sekmesi, jeolog + biyolog). Gelene kadar null kalır:
// ağırlık yoksa sistem yüzde UYDURMAZ, "ağırlık bekleniyor" der.

/** Uydudan gözlenen bir özelliğin bir Mars bölgesindeki durumu. null = veri henüz yok. */
export type Gozlem = 'evet' | 'hayir' | 'belirsiz' | null;

/** Meke ile karşılaştırılan özellikler (Analog Ağırlıkları sekmesindeki satırlar). */
export const ANALOG_OZELLIKLER = ['kraterGolu', 'sulfat', 'klorur', 'volkanik', 'paleogol'] as const;
export type AnalogOzellik = (typeof ANALOG_OZELLIKLER)[number];

/** Bir Mars bölgesinin Meke'ye karşı gözlemleri. */
export type AnalogGozlemler = Record<AnalogOzellik, Gozlem>;

/** Her özelliğin ağırlığı (%). null = ekip henüz karar vermedi. */
export type AnalogAgirliklar = Record<AnalogOzellik, number | null>;

// YER TUTUCU: Oğuz (jeoloji) ve Hasan (biyoloji) Analog Ağırlıkları sekmesini doldurunca buraya yazılacak.
export const ANALOG_AGIRLIKLARI: AnalogAgirliklar = {
  kraterGolu: null,
  sulfat: null,
  klorur: null,
  volkanik: null,
  paleogol: null,
};

const PUAN: Record<Exclude<Gozlem, null>, number> = { evet: 1, belirsiz: 0.5, hayir: 0 };

export type AnalogSonuc = {
  /** 0-100 eşleşme yüzdesi. null: hesaplanamadı (bkz. durum). */
  yuzde: number | null;
  /** Ağırlığın yüzde kaçı veriyle destekleniyor (0-100). Düşükse sonuç güvenilmezdir. */
  kapsam: number;
  /** 'tamam' | 'eksik-veri' (bazı özellikler null) | 'agirlik-bekleniyor' | 'veri-yok' */
  durum: 'tamam' | 'eksik-veri' | 'agirlik-bekleniyor' | 'veri-yok';
  /** Meke ile eşleşen (Evet) özellikler. */
  eslesenler: AnalogOzellik[];
  /** Verisi olmayan özellikler (arayüzde "veri bekleniyor" diye gösterilir). */
  eksikler: AnalogOzellik[];
};

/** Bir Mars bölgesinin Meke analog eşleşme yüzdesi. */
export function analogEslesme(g: AnalogGozlemler, agirlik: AnalogAgirliklar = ANALOG_AGIRLIKLARI): AnalogSonuc {
  const eslesenler = ANALOG_OZELLIKLER.filter((o) => g[o] === 'evet');
  const eksikler = ANALOG_OZELLIKLER.filter((o) => g[o] === null);

  // Ağırlıklardan biri bile belirlenmemişse yüzde verilmez (yarım ağırlıkla hesap yanıltıcı olur).
  if (ANALOG_OZELLIKLER.some((o) => agirlik[o] === null || (agirlik[o] as number) < 0)) {
    return { yuzde: null, kapsam: 0, durum: 'agirlik-bekleniyor', eslesenler, eksikler };
  }

  let toplamAgirlik = 0;
  let verili = 0;
  let puanli = 0;
  for (const o of ANALOG_OZELLIKLER) {
    const w = agirlik[o] as number;
    toplamAgirlik += w;
    const d = g[o];
    if (d === null) continue; // veri yok: hesaba katılmaz
    verili += w;
    puanli += PUAN[d] * w;
  }

  if (toplamAgirlik <= 0 || verili <= 0) {
    return { yuzde: null, kapsam: 0, durum: 'veri-yok', eslesenler, eksikler };
  }
  return {
    yuzde: (puanli / verili) * 100,
    kapsam: (verili / toplamAgirlik) * 100,
    durum: eksikler.length ? 'eksik-veri' : 'tamam',
    eslesenler,
    eksikler,
  };
}
