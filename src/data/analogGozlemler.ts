// Her Mars bölgesinin Meke ile karşılaştırılan özellikleri (Veri Tablosu > Mars Adayları sekmesi).
// 'evet' | 'hayir' | 'belirsiz' | null  (null = veri henüz yok, hesaba katılmaz)
//   kraterGolu ← "Krater gölü yapısı"   sulfat ← "Sülfat"   klorur ← "Klörür"
//   volkanik   ← "Volkanik bağlam"      paleogol ← "Sulu ortam tipi" (göl / paleogöl varsa 'evet')
//   suKimyasi  ← Kanıt sekmesi "Analog: su kimyası" (nötr-bazik, Meke gibi → 'evet'; asidik → 'hayir')
// Oğuz'un (jeoloji) bulduğu değerler buraya yazılacak. Kaynaksız değer yazılmaz.

import type { AnalogGozlemler } from '../utils/analog';

const bos = (): AnalogGozlemler => ({ kraterGolu: null, sulfat: null, klorur: null, volkanik: null, paleogol: null, suKimyasi: null });

export const ANALOG_GOZLEMLER: Record<string, AnalogGozlemler> = {
  // Veri Tablosu > Mars Adayları (15.11.2026): yalnızca Jezero ve Oxia satırları dolu; diğerleri Oğuz'dan bekleniyor.
  jezero: { kraterGolu: 'evet', sulfat: 'evet', klorur: 'hayir', volkanik: 'evet', paleogol: 'evet', suKimyasi: null }, // K33, K39, K41, K42
  oxia: { ...bos(), kraterGolu: 'hayir', volkanik: 'hayir' },
  mawrth: bos(),
  gale: bos(),
  arcadia: bos(),
  eberswalde: bos(),
  columbia: bos(),
  holden: bos(),
  nili: bos(),
  meridiani: bos(),
  aram: bos(),
  deut: bos(),
  hellas: bos(),
  melas: bos(),
  utopia: bos(),
  amazonis: bos(),
};

/** Bir bölgenin gözlemleri; listede yoksa hepsi null. */
export const analogGozlemleri = (id: string): AnalogGozlemler => ANALOG_GOZLEMLER[id] ?? bos();
