// Meke Maarı (Karapınar, Konya): Dünya analoğu referans verileri.
// Değerler Veri Tablosu > Meke sekmesinden gelir. Bulunmayan değer null kalır; arayüz "veri bekleniyor" gösterir.
// Her değerin kaynağı (Kaynaklar sekmesindeki K-numarası), sayfası ve ÖLÇÜM YILI yazılmalıdır:
// Meke son yıllarda büyük ölçüde kuruduğu için eski ölçümler bugünkü durumu yansıtmayabilir.

export type MekeDurum = 'Aranıyor' | 'Bulundu' | 'Kontrol edildi' | 'Bulunamadı';
export type MekeKategori = 'Jeoloji' | 'Jeokimya' | 'Biyoloji' | 'Sunum';

export type MekeParametre = {
  id: string;
  parametre: string;
  /** Sayı (ör. 12.5) ya da metin (ör. tür adları, mineral listesi). null = henüz bulunmadı. */
  deger: number | string | null;
  birim: string;
  durum: MekeDurum;
  kategori: MekeKategori;
  /** Bu özelliğin Mars'ta uydudan nasıl görülebileceği. */
  marsKarsiligi: string;
  /** Kaynaklar sekmesindeki ID, ör. 'K01'. */
  kaynak: string | null;
  /** Sayfa, tablo ya da şekil numarası, ör. 's. 205, Tablo 1'. */
  sayfa: string | null;
  /** Ölçümün yapıldığı yıl, ör. 2011. */
  olcumYili: number | null;
  not?: string;
};

/** Yeni satır için kısa yol: değer, kaynak, sayfa ve yıl boş başlar. */
const p = (
  id: string,
  parametre: string,
  birim: string,
  kategori: MekeKategori,
  marsKarsiligi: string,
  not?: string
): MekeParametre => ({ id, parametre, deger: null, birim, durum: 'Aranıyor', kategori, marsKarsiligi, kaynak: null, sayfa: null, olcumYili: null, not });

export const MEKE_VERILERI: MekeParametre[] = [
  // Jeoloji
  p('konum_enlem', 'Konum: enlem', '°', 'Jeoloji', '—'),
  p('konum_boylam', 'Konum: boylam', '°', 'Jeoloji', '—'),
  p('maar_capi', 'Maar çapı', 'km', 'Jeoloji', 'MOLA ile krater çapı'),
  p('krater_derinligi', 'Krater derinliği', 'm', 'Jeoloji', 'MOLA ile krater derinliği'),
  p('maarin_yasi', 'Maarın yaşı', 'yıl önce', 'Jeoloji', 'Krater yoğunluğu ile yaş tahmini'),
  p('volkanik_kayac', 'Volkanik kayaç türü', '—', 'Jeoloji', 'Volkanik birimlere yakınlık'),
  p('gol_alani', 'Göl alanı (ölçüm yılıyla)', 'km²', 'Jeoloji', 'Paleogöl alanı'),
  p('gol_derinligi', 'Göl derinliği (ölçüm yılıyla)', 'm', 'Jeoloji', '—'),
  p('kuruma', 'Kuruma süreci / su seviyesi değişimi', '—', 'Jeoloji', "Mars'ın kuruma tarihi ile kıyas"),
  // Jeokimya
  p('su_tuzlulugu', 'Su tuzluluğu', 'g/L', 'Jeokimya', 'CRISM klorür ve sülfat tespiti', 'Kaynak K01 tablosundan işlenecek'),
  p('ph', 'pH', '—', 'Jeokimya', 'Doğrudan ölçülemez; mineral uyumu ile dolaylı'),
  p('katyonlar', 'Baskın katyonlar (Na, Mg, Ca...)', '—', 'Jeokimya', '—'),
  p('anyonlar', 'Baskın anyonlar (Cl, SO4...)', '—', 'Jeokimya', 'CRISM klorür ve sülfat tespiti'),
  p('evaporitler', 'Tespit edilen evaporit mineralleri', '—', 'Jeokimya', 'CRISM mineral tespiti'),
  p('mg_sulfat', 'Mg-sülfat / evaporit oranı', '%', 'Jeokimya', 'CRISM Mg-sülfat tespiti'),
  // Biyoloji
  p('taksonlar', 'Halofil / ekstremofil taksonlar', '—', 'Biyoloji', '—', 'Kaynak K02'),
  p('tuz_toleransi', 'Tuzluluk toleransı aralığı', 'g/L', 'Biyoloji', 'Hangi Mars tuzluluğunda yaşam mümkün?'),
  p('ph_toleransi', 'pH toleransı aralığı', '—', 'Biyoloji', '—'),
  p('sicaklik_toleransi', 'Sıcaklık toleransı aralığı', '°C', 'Biyoloji', '—'),
  p('biyoimzalar', 'Biyoimza türleri (pigment, lipid, mikrobiyal mat...)', '—', 'Biyoloji', 'Gezgin cihazlarıyla aranabilir mi?'),
  p('koruyan_ortam', 'Biyoimzaları koruyan mineral / ortam', '—', 'Biyoloji', 'CRISM mineral tespiti'),
  p('su_sicakligi', 'Göl suyu sıcaklığı aralığı', '°C', 'Biyoloji', '—'),
];

/** id ile tek bir Meke değeri. */
export const mekeDegeri = (id: string): MekeParametre | undefined => MEKE_VERILERI.find((m) => m.id === id);

/** Kaç değer bulundu / kontrol edildi? (arayüzde ilerleme göstergesi için) */
export function mekeIlerleme() {
  const toplam = MEKE_VERILERI.length;
  const bulundu = MEKE_VERILERI.filter((m) => m.deger !== null).length;
  const kontrol = MEKE_VERILERI.filter((m) => m.durum === 'Kontrol edildi').length;
  return { toplam, bulundu, kontrol };
}
