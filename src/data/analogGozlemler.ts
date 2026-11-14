// Her Mars bölgesinin Meke ile karşılaştırılan özellikleri (Veri Tablosu > Mars Adayları sekmesi).
// 'evet' | 'hayir' | 'belirsiz' | null  (null = veri henüz yok, hesaba katılmaz)
//   kraterGolu ← "Krater gölü yapısı"   sulfat ← "Sülfat"   klorur ← "Klörür"
//   volkanik   ← "Volkanik bağlam"      paleogol ← "Sulu ortam tipi" (göl / paleogöl varsa 'evet')
// Oğuz'un (jeoloji) bulduğu değerler buraya yazılacak. Kaynaksız değer yazılmaz.

import type { AnalogGozlemler } from '../utils/analog';

const bos = (): AnalogGozlemler => ({ kraterGolu: null, sulfat: null, klorur: null, volkanik: null, paleogol: null });

export const ANALOG_GOZLEMLER: Record<string, AnalogGozlemler> = {
  jezero: bos(),
  oxia: bos(),
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
