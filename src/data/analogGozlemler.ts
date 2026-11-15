// Her Mars bölgesinin Meke ile karşılaştırılan özellikleri (Veri Tablosu > Mars Adayları sekmesi).
// 'evet' | 'hayir' | 'belirsiz' | null  (null = veri henüz yok, hesaba katılmaz)
//   kraterGolu ← "Krater gölü yapısı"   sulfat ← "Sülfat"   klorur ← "Klörür"
//   volkanik   ← "Volkanik bağlam"      paleogol ← "Sulu ortam tipi" (göl / paleogöl varsa 'evet')
//   suKimyasi  ← Kanıt sekmesi "Analog: su kimyası" (nötr-bazik, Meke gibi → 'evet'; asidik → 'hayir')

import type { AnalogGozlemler } from '../utils/analog';

const bos = (): AnalogGozlemler => ({ kraterGolu: null, sulfat: null, klorur: null, volkanik: null, paleogol: null, suKimyasi: null });

// Kaynak: Meke_analog_tablo_ve_agirliklar.xlsx (Hasan, 15.11.2026; Kanıt sekmesinden, Oğuz'un girdileri üzerine).
// Kural: Var/Yok/Belirsiz yalnızca kaynak açıkça söylüyorsa; bilinmeyen = null (Yok DEĞİL). Her hücrenin dayanağı tablonun Dayanak sütununda.
export const ANALOG_GOZLEMLER: Record<string, AnalogGozlemler> = {
  jezero: { kraterGolu: 'evet', sulfat: 'evet', klorur: null, volkanik: 'evet', paleogol: 'evet', suKimyasi: 'evet' },
  oxia: { kraterGolu: 'hayir', sulfat: null, klorur: null, volkanik: null, paleogol: 'belirsiz', suKimyasi: 'evet' },
  mawrth: { kraterGolu: 'hayir', sulfat: 'evet', klorur: null, volkanik: 'belirsiz', paleogol: 'belirsiz', suKimyasi: 'belirsiz' },
  gale: { kraterGolu: 'evet', sulfat: 'evet', klorur: 'evet', volkanik: null, paleogol: 'evet', suKimyasi: 'evet' },
  arcadia: { kraterGolu: 'hayir', sulfat: 'hayir', klorur: null, volkanik: 'evet', paleogol: null, suKimyasi: null },
  eberswalde: { kraterGolu: 'evet', sulfat: null, klorur: null, volkanik: null, paleogol: 'evet', suKimyasi: 'evet' },
  columbia: { kraterGolu: 'belirsiz', sulfat: 'evet', klorur: null, volkanik: 'evet', paleogol: 'belirsiz', suKimyasi: 'belirsiz' },
  holden: { kraterGolu: 'evet', sulfat: null, klorur: null, volkanik: null, paleogol: 'evet', suKimyasi: 'evet' },
  nili: { kraterGolu: 'hayir', sulfat: null, klorur: null, volkanik: 'evet', paleogol: 'belirsiz', suKimyasi: 'evet' },
  meridiani: { kraterGolu: 'hayir', sulfat: 'evet', klorur: 'belirsiz', volkanik: null, paleogol: 'evet', suKimyasi: 'hayir' },
  aram: { kraterGolu: 'belirsiz', sulfat: 'evet', klorur: null, volkanik: null, paleogol: 'belirsiz', suKimyasi: 'hayir' },
  deut: { kraterGolu: 'belirsiz', sulfat: null, klorur: null, volkanik: 'belirsiz', paleogol: 'belirsiz', suKimyasi: null },
  hellas: { kraterGolu: 'belirsiz', sulfat: 'hayir', klorur: null, volkanik: null, paleogol: 'belirsiz', suKimyasi: null },
  melas: { kraterGolu: 'hayir', sulfat: 'evet', klorur: null, volkanik: null, paleogol: 'evet', suKimyasi: 'hayir' },
  utopia: { kraterGolu: 'hayir', sulfat: 'belirsiz', klorur: null, volkanik: 'belirsiz', paleogol: 'belirsiz', suKimyasi: null },
  amazonis: { kraterGolu: 'hayir', sulfat: null, klorur: null, volkanik: 'evet', paleogol: 'belirsiz', suKimyasi: null },
};

/** Bir bölgenin gözlemleri; listede yoksa hepsi null. */
export const analogGozlemleri = (id: string): AnalogGozlemler => ANALOG_GOZLEMLER[id] ?? bos();
