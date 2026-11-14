import type { Metin2 } from './adaylar';

// Mars'a inen (ya da inmeye çalışan) araçlar. Koordinatlar NASA NSSDC ve Wikipedia GeoData'dan alınmıştır
// (doğu boylamı −180…180'e çevrildi). Başarısız/kayıp görevlerin konumu yaklaşıktır.
export type DurumInis = 'basarili' | 'kismi' | 'kayip';

export type Inis = {
  id: string;
  ad: string;
  kurum: string;
  yil: number;
  tur: Metin2;
  durum: DurumInis;
  enlem: number;
  boylam: number;
  not: Metin2;
};

export const INIS_RENKLERI: Record<DurumInis, string> = { basarili: '#38bdf8', kismi: '#facc15', kayip: '#fb7185' };

export const INISLER: Inis[] = [
  { id: 'viking1', ad: 'Viking 1', kurum: 'NASA', yil: 1976, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'basarili', enlem: 22.27, boylam: -47.95,
    not: { tr: 'Mars’ta ilk başarılı uzun ömürlü yüzey görevi (yaklaşık 6 yıl); biyoloji deneyleri yaptı. Chryse Planitia.', en: 'First long-lived successful Mars surface mission (about 6 years); ran biology experiments. Chryse Planitia.' } },
  { id: 'viking2', ad: 'Viking 2', kurum: 'NASA', yil: 1976, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'basarili', enlem: 47.64, boylam: 134.29,
    not: { tr: 'Utopia Planitia’da yaklaşık 3,5 yıl çalıştı; yüzeyde don gözlemledi.', en: 'Worked about 3.5 years in Utopia Planitia; observed surface frost.' } },
  { id: 'pathfinder', ad: 'Mars Pathfinder / Sojourner', kurum: 'NASA', yil: 1997, tur: { tr: 'İniş aracı + gezgin', en: 'Lander + rover' }, durum: 'basarili', enlem: 19.13, boylam: -33.22,
    not: { tr: 'Sojourner, Mars’ın ilk gezgin aracıydı. Ares Vallis’in taşkın ovası.', en: 'Sojourner was the first rover on Mars. Ares Vallis flood plain.' } },
  { id: 'spirit', ad: 'Spirit (MER-A)', kurum: 'NASA', yil: 2004, tur: { tr: 'Gezgin', en: 'Rover' }, durum: 'basarili', enlem: -14.57, boylam: 175.47,
    not: { tr: 'Gusev Krateri, 2010’a kadar. Columbia Hills’te hidrotermal silika buldu.', en: 'Gusev Crater, until 2010. Found hydrothermal silica in the Columbia Hills.' } },
  { id: 'opportunity', ad: 'Opportunity (MER-B)', kurum: 'NASA', yil: 2004, tur: { tr: 'Gezgin', en: 'Rover' }, durum: 'basarili', enlem: -1.95, boylam: -5.53,
    not: { tr: 'Meridiani Planum, 2018’e kadar (hedef 90 gün, çalışma yaklaşık 14 yıl). Hematit ve sülfat kanıtı.', en: 'Meridiani Planum, until 2018 (90-day goal, about 14 years of operation). Hematite and sulfate evidence.' } },
  { id: 'phoenix', ad: 'Phoenix', kurum: 'NASA', yil: 2008, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'basarili', enlem: 68.22, boylam: -125.75,
    not: { tr: 'Kuzey kutup ovası; yüzeye yakın su buzunu doğrudan doğruladı ve perklorat buldu.', en: 'Northern polar plain; directly confirmed near-surface water ice and found perchlorate.' } },
  { id: 'curiosity', ad: 'Curiosity (MSL)', kurum: 'NASA', yil: 2012, tur: { tr: 'Gezgin', en: 'Rover' }, durum: 'basarili', enlem: -4.59, boylam: 137.44,
    not: { tr: 'Gale Krateri (Bradbury Landing). Yaşanabilir bir ortamın geçmişteki kanıtını buldu; Mt. Sharp’a tırmanıyor.', en: 'Gale Crater (Bradbury Landing). Found evidence of a past habitable environment; climbing Mt. Sharp.' } },
  { id: 'insight', ad: 'InSight', kurum: 'NASA', yil: 2018, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'basarili', enlem: 4.5, boylam: 135.62,
    not: { tr: 'Elysium Planitia; Mars depremlerini ve iç yapısını ölçen jeofizik istasyonu (2022’ye kadar).', en: 'Elysium Planitia; geophysical station measuring marsquakes and the interior (until 2022).' } },
  { id: 'perseverance', ad: 'Perseverance (Mars 2020)', kurum: 'NASA', yil: 2021, tur: { tr: 'Gezgin + helikopter', en: 'Rover + helicopter' }, durum: 'basarili', enlem: 18.45, boylam: 77.45,
    not: { tr: 'Jezero Krateri (Octavia E. Butler Landing). Örnek toplayıp saklıyor; Ingenuity helikopteri ilk motorlu uçuşları yaptı.', en: 'Jezero Crater (Octavia E. Butler Landing). Collecting and caching samples; the Ingenuity helicopter made the first powered flights.' } },
  { id: 'zhurong', ad: 'Zhurong (Tianwen-1)', kurum: 'CNSA', yil: 2021, tur: { tr: 'İniş aracı + gezgin', en: 'Lander + rover' }, durum: 'basarili', enlem: 25.07, boylam: 109.93,
    not: { tr: 'Güney Utopia Planitia; Çin’in ilk Mars gezgini (2022’ye kadar).', en: 'Southern Utopia Planitia; China’s first Mars rover (until 2022).' } },
  { id: 'mars3', ad: 'Mars 3', kurum: 'SSCB', yil: 1971, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'kismi', enlem: -45.0, boylam: -158.0,
    not: { tr: 'Mars’a ilk yumuşak iniş; yaklaşık 15 saniye sonra sinyal kesildi. Konum yaklaşık.', en: 'First soft landing on Mars; signal lost after about 15 seconds. Position approximate.' } },
  { id: 'beagle2', ad: 'Beagle 2', kurum: 'İngiltere / ESA', yil: 2003, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'kismi', enlem: 11.53, boylam: 90.43,
    not: { tr: 'Isidis Planitia’ya indi ancak güneş panelleri tam açılmadı; 2015’te MRO görüntüledi.', en: 'Landed in Isidis Planitia but its solar panels did not fully deploy; imaged by MRO in 2015.' } },
  { id: 'mars2', ad: 'Mars 2', kurum: 'SSCB', yil: 1971, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'kayip', enlem: -45.0, boylam: 47.0,
    not: { tr: 'İniş sırasında çarptı; Mars yüzeyine ulaşan ilk insan yapımı nesne. Konum yaklaşık.', en: 'Crashed on landing; the first human-made object to reach the Martian surface. Position approximate.' } },
  { id: 'mars6', ad: 'Mars 6', kurum: 'SSCB', yil: 1974, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'kayip', enlem: -23.9, boylam: -19.42,
    not: { tr: 'İniş sırasında temas kaybı. Konum yaklaşık.', en: 'Contact lost during landing. Position approximate.' } },
  { id: 'mpl', ad: 'Mars Polar Lander', kurum: 'NASA', yil: 1999, tur: { tr: 'İniş aracı', en: 'Lander' }, durum: 'kayip', enlem: -76.0, boylam: 165.0,
    not: { tr: 'Güney kutup bölgesine inişte kayboldu. Konum yaklaşık.', en: 'Lost during landing near the south pole. Position approximate.' } },
  { id: 'schiaparelli', ad: 'Schiaparelli (ExoMars)', kurum: 'ESA', yil: 2016, tur: { tr: 'İniş demosu', en: 'Landing demonstrator' }, durum: 'kayip', enlem: -2.05, boylam: -6.21,
    not: { tr: 'Meridiani Planum; paraşüt/retro roket hatası sonrası çarptı.', en: 'Meridiani Planum; crashed after a parachute/retro-rocket anomaly.' } },
];
