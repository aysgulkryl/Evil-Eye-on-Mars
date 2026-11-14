// Evil Eye on Mars aday iniş bölgeleri (16).
// "verilen": ekibin NASA Space Apps için tanımladığı ilk 6 bölge (eğim/kaya/rakım/temel puanlar ekip girdisidir).
// "taslak": sonradan eklenen 10 bölge. Koordinatlar yayımlanmış adlandırılmış özelliklerden; rakım MOLA 16 ppd verisinden okunmuştur;
//   eğim/kaya yaklaşık literatür değerleridir; güvenlik puanı bağımsız mühendislik indeksinden (kalibre) HESAPLANIR;
//   astrobiyoloji puanı uzman tahminidir. Taslak bölgeler yayımlanmış kaynaklarla doğrulanmalıdır.

import { kalibreGuvenlik } from '../utils/guvenlikModeli';
import { GOREV_ESIKLERI, esikDegeri } from './gorevEsikleri';
import { vitaPuani } from './vita';

export type Dil = 'tr' | 'en';
export type Metin2 = Record<Dil, string>;

export type Aday = {
  id: string;
  ad: string;
  enlem: number; // °N (+) / °S (-)
  boylam: number; // °E (+) / °W (-)
  egim: number; // site ölçeğinde eğim, °
  kaya: number; // yüzey kaya dağılımı, %
  rakim: number; // MOLA rakım, km
  guvenlik: number; // iniş & mühendislik güvenliği (0-100)
  astro: number; // astrobiyoloji potansiyeli (0-100)
  veri: 'verilen' | 'taslak';
  gezegenKoruma?: boolean; // yüzeye yakın su buzu: gezegen koruma (COSPAR) değerlendirmesi ek inceleme gerektirebilir
  ozellik: Metin2; // paleohidrolojik yapı
  mineraller: Record<Dil, string[]>; // CRISM tespitli / beklenen mineraller
  bolge: Metin2; // hangi coğrafi alanda
  gecmis: Metin2; // jeolojik ve görev geçmişi
  misyon?: string;
  bolgeselEgimMedyan?: number; // MOLA bölgesel eğim, medyan (°)
  bolgeselEgimDik?: number; // MOLA bölgesel eğim, en dik %10 (°)
  puruzluluk?: number; // Pürüzlülük, 10 km (MOLA, m)
  astroKaynak?: 'rubrik' | 'uzman'; // Vita puanı ekibin rubriğinden mi, eski uzman tahmininden mi?
};

type Girdi = Omit<Aday, 'guvenlik'> & { guvenlik?: number };
const hazirla = (g: Girdi): Aday => ({
  ...g,
  guvenlik: g.guvenlik ?? kalibreGuvenlik(g.egim, g.kaya, g.rakim),
});

const HAM_ADAYLAR: Aday[] = [
  {
    id: 'jezero', ad: 'Jezero Crater', enlem: 18.38, boylam: 77.58, egim: 4.2, kaya: 8, rakim: -2.5, guvenlik: 78, astro: 91, veri: 'verilen',
    bolgeselEgimMedyan: 0.55, bolgeselEgimDik: 1.07, puruzluluk: 69,
    ozellik: { tr: 'Delta & Paleogöl', en: 'Delta & Paleolake' },
    mineraller: { tr: ['Smektit Kili', 'Mg-Karbonat', 'Olivin'], en: ['Smectite Clay', 'Mg-Carbonate', 'Olivine'] },
    bolge: { tr: 'Isidis Planitia havzasının kuzeybatı kenarı, Nili Fossae yakını', en: 'NW rim of the Isidis Planitia basin, near Nili Fossae' },
    gecmis: {
      tr: 'Yaklaşık 45 km çaplı krater. Yaklaşık 3,5–3,9 milyar yıl önce nehir deltasıyla beslenen bir göl barındırdı; delta ve göl çökelleri biyoimza korunumu için birinci sınıf hedef. Perseverance 18 Şubat 2021’de burada indi.',
      en: 'Crater about 45 km across. About 3.5–3.9 billion years ago it held a lake fed by a river delta; delta and lake sediments are a prime target for biosignature preservation. Perseverance landed here on 18 February 2021.',
    },
    misyon: 'Mars 2020 / Perseverance (2021)',
  },
  {
    id: 'oxia', ad: 'Oxia Planum', enlem: 18.2, boylam: -24.3, egim: 1.8, kaya: 4, rakim: -3.0, guvenlik: 90, astro: 70, veri: 'verilen',
    bolgeselEgimMedyan: 0.42, bolgeselEgimDik: 0.59, puruzluluk: 39,
    ozellik: { tr: 'Sığ Durgun Su Havzası', en: 'Shallow Standing-Water Basin' },
    mineraller: { tr: ['Vermikülit', 'Saponit', 'Silika'], en: ['Vermiculite', 'Saponite', 'Silica'] },
    bolge: { tr: 'Arabia Terra’nın batı kenarı, Chryse Planitia yakını', en: 'Western edge of Arabia Terra, near Chryse Planitia' },
    gecmis: {
      tr: 'Noachian dönemine ait (yaklaşık 3,9 milyar yıl), geniş, düz ve kil bakımından zengin bir plato. ExoMars Rosalind Franklin gezgini için seçilen iniş bölgesi.',
      en: 'A broad, flat, clay-rich Noachian plateau (about 3.9 billion years old). The landing region selected for the ExoMars Rosalind Franklin rover.',
    },
    misyon: 'ExoMars / Rosalind Franklin (seçilen bölge)',
  },
  {
    id: 'mawrth', ad: 'Mawrth Vallis', enlem: 23.99, boylam: -18.96, egim: 8.5, kaya: 15, rakim: -2.0, guvenlik: 48, astro: 88, veri: 'verilen',
    bolgeselEgimMedyan: 1.34, bolgeselEgimDik: 2.27, puruzluluk: 133,
    ozellik: { tr: 'Masif Akarsu Kanalı', en: 'Massive Outflow Channel' },
    mineraller: { tr: ['Al-Filosilikat', 'Nontronit'], en: ['Al-Phyllosilicate', 'Nontronite'] },
    bolge: { tr: 'Arabia Terra ile Chryse Planitia arasındaki kanal ağzı', en: 'Channel mouth between Arabia Terra and Chryse Planitia' },
    gecmis: {
      tr: 'Noachian killi (Al ve Fe/Mg filosilikat) katmanlarının yüzlerce metre kalınlıkta açıkta olduğu en geniş alanlardan biri. Mars 2020 ve ExoMars için finalistti. Eğimli ve kayalık: iniş riski yüksek.',
      en: 'One of the widest exposures of hundreds of metres of Noachian clay (Al and Fe/Mg phyllosilicate) layers. A finalist for Mars 2020 and ExoMars. Steep and rocky: high landing risk.',
    },
    misyon: 'Mars 2020 / ExoMars finalisti',
  },
  {
    id: 'gale', ad: 'Gale Crater', enlem: -4.59, boylam: 137.44, egim: 6.8, kaya: 12, rakim: -4.5, guvenlik: 68, astro: 83, veri: 'verilen',
    bolgeselEgimMedyan: 2.06, bolgeselEgimDik: 16.16, puruzluluk: 740,
    ozellik: { tr: 'Katmanlı Alüvyon', en: 'Layered Alluvium' },
    mineraller: { tr: ['Fe-Killer', 'Sülfat', 'Opal Silika'], en: ['Fe-Clays', 'Sulfate', 'Opaline Silica'] },
    bolge: { tr: 'Aeolis Palus, Elysium bölgesinin güneyi (kuzey–güney dikotomi sınırı)', en: 'Aeolis Palus, south of Elysium (hemispheric dichotomy boundary)' },
    gecmis: {
      tr: '154 km çaplı krater; ortasında yaklaşık 5 km yükseklikte katmanlı Aeolis Mons (Mt. Sharp). Killer ve sülfatlar iklimin ıslaktan kuruya geçişini kaydediyor. Curiosity 2012’den beri burada çalışıyor.',
      en: '154 km crater with the layered, roughly 5 km high Aeolis Mons (Mt. Sharp) at its centre. Clays and sulfates record the climate shift from wet to dry. Curiosity has worked here since 2012.',
    },
    misyon: 'MSL / Curiosity (2012)',
  },
  {
    id: 'arcadia', ad: 'Arcadia Planitia', enlem: 39.3, boylam: -171.0, egim: 0.6, kaya: 2, rakim: -4.0, guvenlik: 97, astro: 18, veri: 'verilen', gezegenKoruma: true,
    bolgeselEgimMedyan: 1.65, bolgeselEgimDik: 4.44, puruzluluk: 146,
    ozellik: { tr: 'Buzul Düzlüğü', en: 'Glacial Plain' },
    mineraller: { tr: ['Saf Yeraltı Buz Plakaları', 'Regolit'], en: ['Pure Subsurface Ice Sheets', 'Regolith'] },
    bolge: { tr: 'Kuzey ovaları (Vastitas Borealis geçişi), Amazonian yaşlı düzlük', en: 'Northern lowlands (Vastitas Borealis transition), Amazonian-age plain' },
    gecmis: {
      tr: 'Genç (Amazonian) lav ve çökellerle kaplı çok düz ovalar. Yüzeye yakın su buzu, NASA’nın insanlı görev “Exploration Zone” çalışmalarında öne çıkıyor. Astrobiyolojik kayıt zayıf.',
      en: 'Very flat plains covered by young (Amazonian) lavas and sediments. Near-surface water ice features in NASA crewed-mission “Exploration Zone” studies. Weak astrobiological record.',
    },
    misyon: 'İnsanlı görev Exploration Zone adayı',
  },
  {
    id: 'eberswalde', ad: 'Eberswalde Crater', enlem: -23.86, boylam: -33.5, egim: 5.1, kaya: 9, rakim: -1.4, guvenlik: 64, astro: 86, veri: 'verilen',
    bolgeselEgimMedyan: 1.25, bolgeselEgimDik: 4.26, puruzluluk: 139,
    ozellik: { tr: 'Ters Akarsu Deltası', en: 'Inverted Fluvial Delta' },
    mineraller: { tr: ['Fe/Mg Killer', 'Tortul Silikat'], en: ['Fe/Mg Clays', 'Sedimentary Silicate'] },
    bolge: { tr: 'Margaritifer Terra, Holden Krateri yakını (güney yayla)', en: 'Margaritifer Terra, near Holden Crater (southern highlands)' },
    gecmis: {
      tr: 'Delta yelpazesi erozyonla “ters rölyef” biçiminde korunmuş; Fe/Mg killeri taşıyor. MSL ve Mars 2020 için finalistti.',
      en: 'The delta fan is preserved as “inverted relief” by erosion and carries Fe/Mg clays. A finalist for MSL and Mars 2020.',
    },
    misyon: 'MSL / Mars 2020 finalisti',
  },
  // ------------------------------------------------------------------ TASLAK (ekip doğrulaması gerekir)
  hazirla({
    id: 'columbia', ad: 'Columbia Hills (Gusev)', enlem: -14.57, boylam: 175.47, egim: 3.0, kaya: 14, rakim: -1.9, astro: 80, veri: 'taslak',
    bolgeselEgimMedyan: 0.18, bolgeselEgimDik: 0.32, puruzluluk: 20,
    ozellik: { tr: 'Hidrotermal silika & göl çökelleri', en: 'Hydrothermal silica & lake deposits' },
    mineraller: { tr: ['Opal-A silika', 'Mg-Fe karbonat', 'Sülfat'], en: ['Opal-A silica', 'Mg-Fe carbonate', 'Sulfate'] },
    bolge: { tr: 'Gusev Krateri, Aeolis bölgesi (güney yayla)', en: 'Gusev Crater, Aeolis region (southern highlands)' },
    gecmis: {
      tr: 'Spirit (2004) burada hidrotermal opal-A silika ve karbonat buldu: sıcak su/buhar sistemi için güçlü kanıt. Mars 2020 finalistiydi (aynı yere yeniden iniş fikri).',
      en: 'Spirit (2004) found hydrothermal opal-A silica and carbonate here: strong evidence for a hot-spring/steam system. A Mars 2020 finalist (re-landing at the same place).',
    },
    misyon: 'MER-A Spirit (2004)',
  }),
  hazirla({
    id: 'holden', ad: 'Holden Crater', enlem: -26.4, boylam: -34.0, egim: 5.5, kaya: 12, rakim: -2.3, astro: 80, veri: 'taslak',
    bolgeselEgimMedyan: 0.56, bolgeselEgimDik: 1.42, puruzluluk: 63,
    ozellik: { tr: 'Alüvyon yelpazesi & göl çökelleri', en: 'Alluvial fans & lake deposits' },
    mineraller: { tr: ['Fe/Mg smektit', 'Klorit'], en: ['Fe/Mg smectite', 'Chlorite'] },
    bolge: { tr: 'Margaritifer Terra’nın güneyi', en: 'Southern Margaritifer Terra' },
    gecmis: {
      tr: 'Genç bir çarpmayla kesilen alüvyon yelpazeleri ve göl çökelleri, megabreksiya; Fe/Mg smektit içeriyor. MSL ve Mars 2020 için finalistti.',
      en: 'Alluvial fans and lake deposits cut by a younger impact, with megabreccia and Fe/Mg smectite. A finalist for MSL and Mars 2020.',
    },
    misyon: 'MSL / Mars 2020 finalisti',
  }),
  hazirla({
    id: 'nili', ad: 'Nili Fossae', enlem: 22.57, boylam: 76.8, egim: 9.0, kaya: 14, rakim: -0.3, astro: 88, veri: 'taslak',
    bolgeselEgimMedyan: 3.17, bolgeselEgimDik: 5.38, puruzluluk: 347,
    ozellik: { tr: 'Yarılmış eski kabuk & karbonat-serpantin', en: 'Fractured ancient crust & carbonate-serpentine' },
    mineraller: { tr: ['Mg-karbonat', 'Serpantin', 'Olivin'], en: ['Mg-carbonate', 'Serpentine', 'Olivine'] },
    bolge: { tr: 'Isidis havzasının kuzeybatı çevresi', en: 'NW surroundings of the Isidis basin' },
    gecmis: {
      tr: 'Isidis çarpmasıyla çatlayan eski kabuk. Mars’ın en geniş Mg-karbonat ve serpantin (olivin alterasyonu) yüzlekleri; hidrotermal ve serpantinleşme süreçleri astrobiyoloji için çok değerli, ancak arazi engebeli.',
      en: 'Ancient crust fractured by the Isidis impact. Mars’s most extensive Mg-carbonate and serpentine (altered olivine) exposures; hydrothermal and serpentinisation processes are highly valuable for astrobiology, but the terrain is rugged.',
    },
    misyon: 'Mars 2020 finalisti',
  }),
  hazirla({
    id: 'meridiani', ad: 'Meridiani Planum', enlem: -0.03, boylam: -3.13, egim: 0.5, kaya: 3, rakim: -1.4, astro: 55, veri: 'taslak',
    bolgeselEgimMedyan: 0.45, bolgeselEgimDik: 1.78, puruzluluk: 80,
    ozellik: { tr: 'Sülfat & hematit çökelleri', en: 'Sulfate & hematite deposits' },
    mineraller: { tr: ['Hematit', 'Jarosit', 'Mg/Ca sülfat'], en: ['Hematite', 'Jarosite', 'Mg/Ca sulfate'] },
    bolge: { tr: 'Ekvator, Arabia Terra’nın güneyi', en: 'Equator, south of Arabia Terra' },
    gecmis: {
      tr: 'Opportunity (2004) hematit konkresyonları ve sülfatlı kum taşları buldu: asidik, kurak bir geçmişte yüzey suyu dönemleri. Çok düz ve güvenli; organik korunum ise zayıf (asidik/oksidan ortam).',
      en: 'Opportunity (2004) found hematite concretions and sulfate-rich sandstones: episodes of surface water in an acidic, arid past. Very flat and safe; organic preservation is poor (acidic/oxidising setting).',
    },
    misyon: 'MER-B Opportunity (2004)',
  }),
  hazirla({
    id: 'aram', ad: 'Aram Chaos', enlem: 2.6, boylam: -21.5, egim: 9.5, kaya: 13, rakim: -3.0, astro: 74, veri: 'taslak',
    bolgeselEgimMedyan: 1.29, bolgeselEgimDik: 2.73, puruzluluk: 110,
    ozellik: { tr: 'Kaotik arazi & sülfat/hematit', en: 'Chaotic terrain & sulfate/hematite' },
    mineraller: { tr: ['Hematit', 'Hidratlı sülfat', 'Fe-oksit'], en: ['Hematite', 'Hydrated sulfate', 'Fe-oxide'] },
    bolge: { tr: 'Margaritifer Terra / Oxia Palus sınırı, Ares Vallis’in kaynağı', en: 'Margaritifer Terra / Oxia Palus boundary, source of Ares Vallis' },
    gecmis: {
      tr: 'Yeraltı suyunun boşalmasıyla çöken arazi (kaos); içinde hematit ve hidratlı sülfatlar var. Büyük bir su boşalması Ares Vallis’e akmış. İniş açısından engebeli.',
      en: 'Terrain collapsed by groundwater release (chaos), containing hematite and hydrated sulfates. A large discharge flowed into Ares Vallis. Rugged for landing.',
    },
  }),
  hazirla({
    id: 'deut', ad: 'Deuteronilus Mensae', enlem: 43.9, boylam: 22.6, egim: 4.0, kaya: 6, rakim: -3.7, astro: 58, veri: 'taslak', gezegenKoruma: true,
    bolgeselEgimMedyan: 0.11, bolgeselEgimDik: 0.35, puruzluluk: 32,
    ozellik: { tr: 'Buzul kalıntıları & dikotomi sınırı', en: 'Glacial remnants & dichotomy boundary' },
    mineraller: { tr: ['Yeraltı su buzu', 'Regolit'], en: ['Subsurface water ice', 'Regolith'] },
    bolge: { tr: 'Kuzey–güney dikotomi sınırı, Ismenius Lacus bölgesi', en: 'Hemispheric dichotomy boundary, Ismenius Lacus region' },
    gecmis: {
      tr: 'Enkazla örtülü buzul kalıntıları ve kuzey ovalarına açılan mesalar. Yüzeye yakın saf su buzu insanlı görev için kaynak sayılır; gezegen koruma açısından ek inceleme gerekebilir.',
      en: 'Debris-covered glacier remnants and mesas opening to the northern plains. Near-surface pure water ice counts as a resource for crewed missions; planetary-protection review may be needed.',
    },
    misyon: 'İnsanlı görev Exploration Zone adayı',
  }),
  hazirla({
    id: 'hellas', ad: 'Hellas Planitia (taban)', enlem: -42.4, boylam: 70.5, egim: 1.2, kaya: 5, rakim: -6.2, astro: 40, veri: 'taslak',
    bolgeselEgimMedyan: 1.65, bolgeselEgimDik: 4.13, puruzluluk: 189,
    ozellik: { tr: 'Derin çarpma havzası tabanı', en: 'Floor of a deep impact basin' },
    mineraller: { tr: ['Toz ve regolit', 'Çökel tabakalar', 'Kenarda hidratlı mineraller'], en: ['Dust and regolith', 'Sediment layers', 'Hydrated minerals on the rim'] },
    bolge: { tr: 'Güney yaylaları; Mars’ın en büyük görünür çarpma havzası', en: 'Southern highlands; the largest visible impact basin on Mars' },
    gecmis: {
      tr: 'Yaklaşık 2.300 km çaplı Noachian çarpma havzası. Mars’ın en alçak yüzeyleri (−6 km ve altı): yüksek atmosfer basıncı, en iyi atmosferik frenleme marjı. Çevresinde hidratlı mineraller var; tabanda tozlu çökeller ve toz fırtınası riski.',
      en: 'Noachian impact basin about 2,300 km across. Mars’s lowest surfaces (−6 km and below): higher air pressure and the best atmospheric braking margin. Hydrated minerals around the rim; dusty floor sediments and dust-storm risk.',
    },
  }),
  hazirla({
    id: 'melas', ad: 'Melas Chasma', enlem: -10.4, boylam: -72.7, egim: 12.0, kaya: 14, rakim: -3.2, astro: 85, veri: 'taslak',
    bolgeselEgimMedyan: 4.43, bolgeselEgimDik: 6.33, puruzluluk: 484,
    ozellik: { tr: 'Katmanlı sülfat çökelleri (ILD)', en: 'Layered sulfate deposits (ILD)' },
    mineraller: { tr: ['Hidratlı sülfat', 'Fe-oksit', 'Filosilikat'], en: ['Hydrated sulfate', 'Fe-oxide', 'Phyllosilicate'] },
    bolge: { tr: 'Valles Marineris’in merkezi (Hesperian)', en: 'Heart of Valles Marineris (Hesperian)' },
    gecmis: {
      tr: 'Valles Marineris’in en geniş çukuru; katmanlı sülfat çökelleri ve hidratlı mineraller sulu çökelme kaydının zengin olduğunu gösteriyor. Duvar eğimleri ve engebe nedeniyle iniş çok riskli.',
      en: 'The widest basin of Valles Marineris; layered sulfates and hydrated minerals show a rich aqueous depositional record. Landing is very risky because of wall slopes and rugged terrain.',
    },
    misyon: 'İnsanlı görev Exploration Zone adayı',
  }),
  hazirla({
    id: 'utopia', ad: 'Utopia Planitia', enlem: 46.7, boylam: 117.5, egim: 0.8, kaya: 4, rakim: -5.0, astro: 55, veri: 'taslak', gezegenKoruma: true,
    bolgeselEgimMedyan: 0.25, bolgeselEgimDik: 0.38, puruzluluk: 26,
    ozellik: { tr: 'Kuzey ovası & yeraltı buzu', en: 'Northern plain & subsurface ice' },
    mineraller: { tr: ['Yeraltı su buzu', 'Regolit'], en: ['Subsurface water ice', 'Regolith'] },
    bolge: { tr: 'Kuzey ovaları; Viking 2 ve Zhurong inişlerinin yakını', en: 'Northern lowlands; near the Viking 2 and Zhurong landings' },
    gecmis: {
      tr: 'Mars’ın en büyük çarpma havzası olabilecek ova; kuzey okyanus kıyı çizgisi tartışması ve yeraltı buzu. Düz ve alçak. Viking 2 (1976) burada indi, Zhurong (2021) güneyinde.',
      en: 'A plain that may be the largest impact basin on Mars; debated northern-ocean shoreline and subsurface ice. Flat and low. Viking 2 (1976) landed here; Zhurong (2021) to the south.',
    },
    misyon: 'Viking 2 / Zhurong çevresi',
  }),
  hazirla({
    id: 'amazonis', ad: 'Amazonis Planitia', enlem: 24.8, boylam: -164.0, egim: 0.7, kaya: 3, rakim: -3.8, astro: 28, veri: 'taslak',
    bolgeselEgimMedyan: 0.05, bolgeselEgimDik: 0.1, puruzluluk: 12,
    ozellik: { tr: 'Genç lav ovası', en: 'Young lava plain' },
    mineraller: { tr: ['Bazalt', 'Regolit', 'Olası yeraltı buzu'], en: ['Basalt', 'Regolith', 'Possible subsurface ice'] },
    bolge: { tr: 'Tharsis ile Elysium arasındaki genç ova', en: 'Young plain between Tharsis and Elysium' },
    gecmis: {
      tr: 'Genç (Amazonian) lav akıntıları ve çökellerle kaplı çok pürüzsüz ova; sığ yeraltında buz olabilir. Astrobiyolojik kayıt zayıf.',
      en: 'A very smooth plain covered by young (Amazonian) lava flows and sediments; shallow subsurface ice is possible. Weak astrobiological record.',
    },
  }),
];

// Vita: rubrik puanı varsa o kullanılır (vita.ts), yoksa eski uzman tahmini kalır ve öyle işaretlenir.
export const ADAYLAR: Aday[] = HAM_ADAYLAR.map((a): Aday => {
  const v = vitaPuani(a.id);
  return v.puan === null ? { ...a, astroKaynak: 'uzman' } : { ...a, astro: Math.round(v.puan), astroKaynak: 'rubrik' };
});

// Hazır tercih senaryoları: [güvenlik ağırlığı, astrobiyoloji ağırlığı] ve mühendislik kısıtları açık mı
export const SENARYOLAR = [
  { id: 'dengeli', agirlik: [50, 50] as const, kisit: false },
  { id: 'guvenlik', agirlik: [90, 10] as const, kisit: true },
  { id: 'yasam', agirlik: [15, 85] as const, kisit: false },
  { id: 'insanli', agirlik: [80, 20] as const, kisit: true },
];

export type Senaryo = (typeof SENARYOLAR)[number];

// No-Go sınırları gorevEsikleri.ts'ten gelir; kaynaklı değer yoksa prototipteki eski sınır (5°, %10) kullanılır.
export const VARSAYILAN_KISIT = { egim: esikDegeri(GOREV_ESIKLERI.egim), kaya: esikDegeri(GOREV_ESIKLERI.kaya) };

export const VERI_KAYNAKLARI = [
  { ad: 'MOLA (Mars Global Surveyor)', rol: { tr: 'Rakım (16 piksel/derece) ve eğim', en: 'Elevation (16 pixel/degree) and slope' }, url: 'https://pds-geosciences.wustl.edu/missions/mgs/mola.html' },
  { ad: 'CRISM (Mars Reconnaissance Orbiter)', rol: { tr: 'Hidratlı mineral haritaları', en: 'Hydrated-mineral maps' }, url: 'https://crism.jhuapl.edu/' },
  { ad: 'HiRISE / CTX (MRO)', rol: { tr: 'Kaya dağılımı ve jeomorfoloji', en: 'Rock abundance and geomorphology' }, url: 'https://www.uahirise.org/' },
  { ad: 'Viking MDIM 2.1 (USGS Astrogeology)', rol: { tr: 'Küre zemin görüntüsü (kamu malı)', en: 'Globe basemap (public domain)' }, url: 'https://astrogeology.usgs.gov/' },
  { ad: 'NASA NSSDC / Wikipedia GeoData', rol: { tr: 'İniş yeri koordinatları', en: 'Landing-site coordinates' }, url: 'https://nssdc.gsfc.nasa.gov/planetary/mars/' },
  { ad: 'NASA PDS', rol: { tr: 'Açık veri arşivi', en: 'Open data archive' }, url: 'https://pds.nasa.gov/' },
];
