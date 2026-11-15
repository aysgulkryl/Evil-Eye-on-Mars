// Meke analog benzerlik hesabı: bir Mars bölgesi, Dünya analoğu Meke Maarı'na ne kadar benziyor?
//
// Yöntem: Meke'nin uydudan gözlenebilen özellikleri (krater gölü yapısı, sülfat, klorür, volkanik bağlam, paleogöl, su kimyası/pH)
// her Mars bölgesinde aranır. Her özellik: Evet = 1, Belirsiz = 0,5, Hayır = 0 puan.
// Eşleşme (%) = Σ(puan × ağırlık) ÷ Σ(ağırlık) × 100
// Verisi olmayan özellik (null) hesaba katılmaz; "kapsam" ne kadar ağırlığın veriyle desteklendiğini gösterir.
//
// Ağırlıklar ekip kararıdır (Veri Tablosu > Analog Ağırlıkları sekmesi, jeolog + biyolog). Gelene kadar null kalır:
// ağırlık yoksa sistem yüzde UYDURMAZ, "ağırlık bekleniyor" der.

/** Uydudan gözlenen bir özelliğin bir Mars bölgesindeki durumu. null = veri henüz yok. */
export type Gozlem = 'evet' | 'hayir' | 'belirsiz' | null;

/** Meke ile karşılaştırılan özellikler (Analog Ağırlıkları sekmesindeki satırlar). */
export const ANALOG_OZELLIKLER = ['kraterGolu', 'sulfat', 'klorur', 'volkanik', 'paleogol', 'suKimyasi'] as const;
export type AnalogOzellik = (typeof ANALOG_OZELLIKLER)[number];

/** Bir Mars bölgesinin Meke'ye karşı gözlemleri. */
export type AnalogGozlemler = Record<AnalogOzellik, Gozlem>;

/** Her özelliğin ağırlığı (%). null = ekip henüz karar vermedi. */
export type AnalogAgirliklar = Record<AnalogOzellik, number | null>;

// YER TUTUCU: Oğuz (jeoloji) ve Hasan (biyoloji) Analog Ağırlıkları sekmesini doldurunca buraya yazılacak.
// Kaynak: Meke_analog_tablo_ve_agirliklar.xlsx > Ağırlıklar (Hasan, biyoloji; toplam 100). Gerekçeler:
export const ANALOG_AGIRLIKLARI: AnalogAgirliklar = {
  kraterGolu: 20, // Meke bir maar (K04); Mars'taki krater gölleri çarpma kökenli
  sulfat: 15, // Var ama ikinci anyon; Mg-sülfat verisi tek ölçüm (K90 s. 19485, 19495)
  klorur: 25, // Meke'nin ana anyonu (K90 s. 19485, 19489)
  volkanik: 10, // Mars'ta yaygın, tek başına ayırt edici değil (K04, K03)
  paleogol: 20, // Kurumuş tuz gölü (K04, K69); Vita K2 ile çakıştığı için 20
  suKimyasi: 10, // pH: Meke 6,6–8,3; Mars'ta yalnızca minerallerden dolaylı (jarosit = asidik, smektit/karbonat = nötr-bazik)
};

/** Yüzde verilebilmesi için ağırlığın en az bu kadarı (%) veriyle desteklenmeli. */
export const MIN_KAPSAM = 50;

const PUAN: Record<Exclude<Gozlem, null>, number> = { evet: 1, belirsiz: 0.5, hayir: 0 };

export type AnalogSonuc = {
  /** Yalnızca bilinen özellikler üzerinden yüzde (boşlar paydadan çıkar). Az bilinen bölgeyi şişirir; arayüzde GÖSTERİLMEZ, aralık gösterilir. */
  yuzde: number | null;
  /** Aralık alt sınırı: boş özellikler "Yok" sayılırsa (0-100). Hasan'ın önerisi. */
  alt: number | null;
  /** Aralık üst sınırı: boş özellikler "Var" sayılırsa (0-100). */
  ust: number | null;
  /** Ağırlığın yüzde kaçı veriyle destekleniyor (0-100). Düşükse sonuç güvenilmezdir. */
  kapsam: number;
  /** 'tamam' | 'eksik-veri' (bazı özellikler null) | 'yetersiz-veri' (ağırlığın yarısından azı veriyle destekli) | 'agirlik-bekleniyor' | 'veri-yok' */
  durum: 'tamam' | 'eksik-veri' | 'yetersiz-veri' | 'agirlik-bekleniyor' | 'veri-yok';
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
    return { yuzde: null, alt: null, ust: null, kapsam: 0, durum: 'agirlik-bekleniyor', eslesenler, eksikler };
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
    return { yuzde: null, alt: null, ust: null, kapsam: 0, durum: 'veri-yok', eslesenler, eksikler };
  }
  const kapsam = (verili / toplamAgirlik) * 100;
  // Hasan (biyoloji) kuralı, Vita'daki "en az 4/5 kriter" kuralıyla aynı mantık:
  // ağırlığın yarısından fazlası verisizse sonuç benzerliği değil eksik veriyi ölçer, yüzde verilmez.
  if (kapsam < MIN_KAPSAM) {
    return { yuzde: null, alt: null, ust: null, kapsam, durum: 'yetersiz-veri', eslesenler, eksikler };
  }
  // Aralık (Hasan): eksik veri ne cezalandırılır ne ödüllendirilir; belirsizlik doğrudan görünür.
  const alt = (puanli / toplamAgirlik) * 100; // boşlar "Yok"
  const ust = ((puanli + (toplamAgirlik - verili)) / toplamAgirlik) * 100; // boşlar "Var"
  return {
    yuzde: (puanli / verili) * 100,
    alt,
    ust,
    kapsam,
    durum: eksikler.length ? 'eksik-veri' : 'tamam',
    eslesenler,
    eksikler,
  };
}
