import { useSearchParams } from '../shims/useSearchParams';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { acikTema } from '../utils/acikTema';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import useMediaQuery from '@mui/material/useMediaQuery';
import FormControlLabel from '@mui/material/FormControlLabel';

import { Iconify } from '../shims/Iconify';
import { DashboardContent } from '../shims/DashboardContent';

import { tavizMetni } from '../utils/taviz';
import { INISLER } from '../data/inisler';
import { OZELLIKLER } from '../data/ozellikler';
import { METINLER, doldur } from '../data/metinler';
import { molaYukle, noktaVerisi } from '../utils/nokta';
import { ADAYLAR, SENARYOLAR, VERI_KAYNAKLARI, VARSAYILAN_KISIT } from '../data/adaylar';
import {
  siralama,
  astroPayi,
  skorRengi,
  etkinAgirlik,
  tavizAnalizi,
} from '../utils/mcda';
import MarsKure, { YuklemeKatmani, webglVarMi } from '../components/MarsKure';
import KararSeridi from '../components/KararSeridi';
import DengeGrafigi from '../components/DengeGrafigi';
import AnalizModal from '../components/AnalizModal';
import MiniHarita from '../components/MiniHarita';
import BilgiKarti from '../components/BilgiKarti';
import TelemetriKarti from '../components/TelemetriKarti';
import KarsilastirModal from '../components/KarsilastirModal';

import type { SondaVerisi, KartIcerigi } from '../components/BilgiKarti';
import type { Dil } from '../data/adaylar';
import type { OzellikGrup } from '../data/ozellikler';
import type { Odak, Sonda, Isaret, AdayDurum } from '../components/MarsKure';

// ----------------------------------------------------------------------

// Dış çerçevedeki yıldızlar (saf CSS): her nokta kendi tekrar boyutuyla döşenir; farklı boyutlar deseni gizler
const YILDIZ_NOKTALARI: [number, number, number, number, number][] = [
  // [tekrar boyutu px, x, y, yarıçap px, opaklık]
  [173, 23, 41, 1, 0.7], [173, 97, 13, 1, 0.5], [173, 141, 88, 1.5, 0.8], [173, 61, 129, 1, 0.45], [173, 12, 160, 1, 0.6],
  [251, 188, 37, 1, 0.55], [251, 40, 210, 1.5, 0.7], [251, 131, 152, 1, 0.4], [251, 227, 236, 1, 0.6],
  [397, 311, 71, 2, 0.85], [397, 77, 333, 1, 0.5], [397, 205, 289, 1.5, 0.65], [397, 368, 380, 1, 0.5],
];
const YILDIZLAR = YILDIZ_NOKTALARI.map(([, x, y, r, o]) => `radial-gradient(${r}px ${r}px at ${x}px ${y}px, rgba(255,255,255,${o}), transparent)`).join(', ');
const YILDIZ_BOYUT = YILDIZ_NOKTALARI.map(([k]) => `${k}px ${k}px`).join(', ');

const PANEL_SX = {
  bgcolor: '#d5dbe3',
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: 2,
  color: '#1e293b',
  p: 2,
  overflowY: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: 'rgba(15,23,42,0.2) transparent',
} as const;

const ETIKET_SX = { color: '#475569', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 } as const;

const BUTON_SX = {
  color: '#fff',
  borderColor: 'rgba(255,255,255,0.3)',
  bgcolor: 'rgba(5,7,13,0.6)',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.12)' },
} as const;

// Açık panellerdeki ikincil düğme
const BUTON_SX_ACIK = {
  color: '#0f172a',
  borderColor: 'rgba(15,23,42,0.25)',
  bgcolor: '#ffffff',
  fontWeight: 600,
  textTransform: 'none',
  '&:hover': { borderColor: '#0f172a', bgcolor: 'rgba(15,23,42,0.05)' },
} as const;

// Sunum modu: her adım bir görev senaryosu (ağırlıklar + kısıtlar)
const TUR_ADIMLARI = [
  { tip: 'giris' as const },
  { tip: 'senaryo' as const, id: 'guvenlik' },
  { tip: 'senaryo' as const, id: 'dengeli' },
  { tip: 'senaryo' as const, id: 'yasam' },
  { tip: 'senaryo' as const, id: 'insanli' },
  { tip: 'son' as const },
];

const GENEL_BAKIS: Omit<Odak, 'anahtar'> = { enlem: 12, boylam: 40, mesafe: 3.3 };
// Sütunun tepesi kadrajda kalsın: bakış ekseni siteden 16° güneyde, kamera 2.75 uzakta
const YAKIN_MESAFE = 2.75;
const EGIK_BAKIS = 16;
const yakinOdak = (a: { enlem: number; boylam: number }) => ({ enlem: Math.max(-75, a.enlem - EGIK_BAKIS), boylam: a.boylam, mesafe: YAKIN_MESAFE });
const ILK_GORUNEN = 8;

const sinirla = (v: string | null, varsayilan: number) => {
  const n = Number(v);
  return v !== null && v !== '' && Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : varsayilan;
};

function ilkDil(param: string | null): Dil {
  if (param === 'tr' || param === 'en') return param;
  try {
    const kayit = window.localStorage.getItem('mars-konumlama:dil');
    if (kayit === 'tr' || kayit === 'en') return kayit;
  } catch {
    /* depolama kapalı olabilir */
  }
  return 'tr';
}

type AramaSecenegi = { tip: 'aday' | 'inis' | 'ad'; id: string; ad: string; grup: string };

// ----------------------------------------------------------------------

export default function MarsKonumlamaPage() {
  const [params, setParams] = useSearchParams();
  const hareketAz = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [dil, setDil] = useState<Dil>(() => ilkDil(params.get('l')));
  const [agirlikG, setAgirlikG] = useState(() => sinirla(params.get('s'), 50));
  const [agirlikA, setAgirlikA] = useState(() => sinirla(params.get('a'), 50));
  const [kisitAcik, setKisitAcik] = useState(() => params.get('k') === '1');
  const [kisitEgim, setKisitEgim] = useState(VARSAYILAN_KISIT.egim);
  const [kisitKaya, setKisitKaya] = useState(VARSAYILAN_KISIT.kaya);
  const [taslakDahil, setTaslakDahil] = useState(() => params.get('t') !== '0');

  const [adayGoster, setAdayGoster] = useState(true);
  const [inisGoster, setInisGoster] = useState(true);
  const [adGoster, setAdGoster] = useState(true);
  const [adGruplari, setAdGruplari] = useState<Record<OzellikGrup, boolean>>({ krater: true, volkan: true, kanyon: true, bolge: true });

  const [secili, setSecili] = useState<Isaret | null>(null);
  const [sonda, setSonda] = useState<Sonda | null>(null);
  const [sondaVeri, setSondaVeri] = useState<SondaVerisi>({ durum: 'yukleniyor' });
  const [hoverIsaret, setHoverIsaret] = useState<Isaret | null>(null);
  const [odak, setOdak] = useState<Odak | null>(null);
  const [turIndeks, setTurIndeks] = useState<number | null>(null);
  const [analizAcik, setAnalizAcik] = useState(false);
  const [analizId, setAnalizId] = useState<string | null>(null);
  const [karsilastirAcik, setKarsilastirAcik] = useState(false);
  const [karsA, setKarsA] = useState('jezero');
  const [karsB, setKarsB] = useState('gale');
  const [hepsiGoster, setHepsiGoster] = useState(false);
  const [degisim, setDegisim] = useState<Record<string, number>>({});

  const bakisIsaretiRef = useRef<HTMLDivElement>(null);

  const t = METINLER[dil];
  const webgl = useMemo(() => webglVarMi(), []);

  // ---- veri seti ve hesaplama
  const aktif = useMemo(() => (taslakDahil ? ADAYLAR : ADAYLAR.filter((a) => a.veri === 'verilen')), [taslakDahil]);
  const kisit = useMemo(() => ({ acik: kisitAcik, egim: kisitEgim, kaya: kisitKaya }), [kisitAcik, kisitEgim, kisitKaya]);
  const sirali = useMemo(() => siralama(aktif, agirlikG, agirlikA, kisit), [aktif, agirlikG, agirlikA, kisit]);
  const uygunlar = useMemo(() => sirali.filter((s) => !s.elendi), [sirali]);
  const elenenler = useMemo(() => sirali.filter((s) => s.elendi), [sirali]);
  const durum = useMemo<Record<string, AdayDurum>>(
    () => Object.fromEntries(sirali.map((s) => [s.aday.id, { skor: s.skor, sira: s.sira, elendi: s.elendi }])),
    [sirali]
  );
  const uygunAdaylar = useMemo(() => uygunlar.map((s) => s.aday), [uygunlar]);
  const taviz = useMemo(() => tavizAnalizi(aktif, agirlikG, agirlikA, kisit), [aktif, agirlikG, agirlikA, kisit]);
  const pay = astroPayi(agirlikG, agirlikA) * 100;
  const etkin = etkinAgirlik(agirlikG, agirlikA);
  const birinci = uygunlar[0]?.aday ?? null;
  const seciliAday = secili?.tip === 'aday' ? aktif.find((a) => a.id === secili.id) ?? null : null;

  // ---- yardımcılar
  const uc = useCallback((hedef: Omit<Odak, 'anahtar'>) => setOdak({ ...hedef, anahtar: Date.now() + Math.random() }), []);

  const adaySec = useCallback(
    (id: string) => {
      const a = ADAYLAR.find((x) => x.id === id);
      if (!a) return;
      setSecili({ tip: 'aday', id });
      setSonda(null);
      uc(yakinOdak(a));
    },
    [uc]
  );

  const inisSec = useCallback(
    (id: string) => {
      const o = INISLER.find((x) => x.id === id);
      if (!o) return;
      setSecili({ tip: 'inis', id });
      setSonda(null);
      uc(yakinOdak(o));
    },
    [uc]
  );

  const yuzeyTikla = useCallback(
    (enlem: number, boylam: number, ozellikId?: string, ucus = false) => {
      setSecili(null);
      setSonda({ enlem, boylam, ozellikId });
      if (ucus) uc(yakinOdak({ enlem, boylam }));
    },
    [uc]
  );

  const kapat = useCallback(() => {
    setSecili(null);
    setSonda(null);
  }, []);

  const hoverDegis = useCallback((i: Isaret | null) => {
    setHoverIsaret((onceki) => (onceki?.id === i?.id && onceki?.tip === i?.tip ? onceki : i));
  }, []);

  // yüzey noktası için gerçek MOLA verisi (ızgara ilk tıklamada yüklenir)
  useEffect(() => {
    if (!sonda) return undefined;
    let iptal = false;
    setSondaVeri({ durum: 'yukleniyor' });
    molaYukle().then((grid) => {
      if (iptal) return;
      setSondaVeri(grid ? { durum: 'hazir', veri: noktaVerisi(grid, sonda.enlem, sonda.boylam) } : { durum: 'yok' });
    });
    return () => {
      iptal = true;
    };
  }, [sonda]);

  // havuz küçülünce seçili aday artık yoksa seçimi bırak
  useEffect(() => {
    if (secili?.tip === 'aday' && !aktif.some((a) => a.id === secili.id)) setSecili(null);
  }, [aktif, secili]);

  useEffect(() => {
    const kapatTus = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && turIndeks === null) kapat();
    };
    window.addEventListener('keydown', kapatTus);
    return () => window.removeEventListener('keydown', kapatTus);
  }, [kapat, turIndeks]);

  const senaryoUygula = useCallback((sen: (typeof SENARYOLAR)[number]) => {
    setAgirlikG(sen.agirlik[0]);
    setAgirlikA(sen.agirlik[1]);
    setKisitAcik(sen.kisit);
  }, []);

  const payAyarla = useCallback((p: number) => {
    setAgirlikG(100 - p);
    setAgirlikA(p);
  }, []);

  // ---- sıralama değişim okları (kaydırıcı oynarken kısa süre görünür)
  const oncekiSiralar = useRef<Record<string, number>>(Object.fromEntries(sirali.map((s) => [s.aday.id, s.sira])));
  const siraImzasi = sirali.map((s) => `${s.aday.id}:${s.sira}`).join('|');
  useEffect(() => {
    const onceki = oncekiSiralar.current;
    const simdi = Object.fromEntries(sirali.map((s) => [s.aday.id, s.sira]));
    const fark: Record<string, number> = {};
    Object.keys(simdi).forEach((id) => {
      if (onceki[id] && simdi[id] && onceki[id] !== simdi[id]) fark[id] = onceki[id] - simdi[id]; // + yükseldi
    });
    oncekiSiralar.current = simdi;
    if (Object.keys(fark).length === 0) return undefined;
    setDegisim(fark);
    const z = setTimeout(() => setDegisim({}), 1600);
    return () => clearTimeout(z);
    // yalnızca sıra değiştiğinde çalışsın
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siraImzasi]);

  // ---- bağlantı ve yerel depo (paylaşılabilir tercih)
  useEffect(() => {
    const z = setTimeout(() => {
      const p = new URLSearchParams();
      p.set('s', String(agirlikG));
      p.set('a', String(agirlikA));
      p.set('k', kisitAcik ? '1' : '0');
      p.set('t', taslakDahil ? '1' : '0');
      p.set('l', dil);
      setParams(p, { replace: true });
    }, 250);
    return () => clearTimeout(z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agirlikG, agirlikA, kisitAcik, taslakDahil, dil]);

  useEffect(() => {
    try {
      window.localStorage.setItem('mars-konumlama:dil', dil);
    } catch {
      /* depolama kapalı olabilir */
    }
  }, [dil]);

  // ---- sunum modu: aynı veri, farklı görev senaryoları, farklı kazananlar
  useEffect(() => {
    if (turIndeks === null) return undefined;
    const adim = TUR_ADIMLARI[turIndeks];
    if (adim.tip === 'senaryo') {
      const sen = SENARYOLAR.find((s) => s.id === adim.id)!;
      senaryoUygula(sen);
      const k = siralama(aktif, sen.agirlik[0], sen.agirlik[1], { acik: sen.kisit, egim: kisitEgim, kaya: kisitKaya }).find((s) => !s.elendi);
      if (k) {
        setSecili({ tip: 'aday', id: k.aday.id });
        setSonda(null);
        uc(yakinOdak(k.aday));
      }
    } else {
      setSecili(null);
      setSonda(null);
      uc(GENEL_BAKIS);
    }
    const sure = adim.tip === 'senaryo' ? 7500 : adim.tip === 'son' ? 9000 : 5500;
    const z = setTimeout(() => setTurIndeks((i) => (i === null || i + 1 >= TUR_ADIMLARI.length ? null : i + 1)), sure);
    return () => clearTimeout(z);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turIndeks]);

  useEffect(() => {
    if (turIndeks === null) return undefined;
    const kapatTus = (e: KeyboardEvent) => e.key === 'Escape' && setTurIndeks(null);
    window.addEventListener('keydown', kapatTus);
    return () => window.removeEventListener('keydown', kapatTus);
  }, [turIndeks]);

  const turAciklamasi = useMemo(() => {
    if (turIndeks === null) return null;
    const adim = TUR_ADIMLARI[turIndeks];
    if (adim.tip === 'giris') return t.turAdimlari.giris;
    if (adim.tip === 'son') return t.turAdimlari.son;
    const sen = SENARYOLAR.find((s) => s.id === adim.id)!;
    const k = siralama(aktif, sen.agirlik[0], sen.agirlik[1], { acik: sen.kisit, egim: kisitEgim, kaya: kisitKaya }).find((s) => !s.elendi);
    return doldur(t.turAdimlari.kazanan, {
      senaryo: t.senaryo[sen.id as keyof typeof t.senaryo],
      g: sen.agirlik[0],
      a: sen.agirlik[1],
      kisit: sen.kisit ? t.turAdimlari.kisitEk : '',
      ad: k?.aday.ad ?? '—',
      skor: k ? k.skor.toFixed(1) : '—',
    });
  }, [turIndeks, t, aktif, kisitEgim, kisitKaya]);

  // ---- modallar
  const analizAc = (id?: string) => {
    setAnalizId(id ?? secili?.id ?? birinci?.id ?? aktif[0].id);
    setAnalizAcik(true);
  };

  const karsilastirAc = (id?: string) => {
    const a = id ?? secili?.id ?? birinci?.id ?? aktif[0].id;
    const diger = (uygunlar.find((s) => s.aday.id !== a) ?? sirali.find((s) => s.aday.id !== a))?.aday.id ?? a;
    setKarsA(aktif.some((x) => x.id === a) ? a : aktif[0].id);
    setKarsB(diger);
    setKarsilastirAcik(true);
  };

  // ---- arama / açılır liste seçenekleri
  const aramaSecenekleri = useMemo<AramaSecenegi[]>(
    () => [
      ...aktif.map((a) => ({ tip: 'aday' as const, id: a.id, ad: a.ad, grup: t.grupAday })),
      ...INISLER.map((o) => ({ tip: 'inis' as const, id: o.id, ad: `${o.ad} (${o.yil})`, grup: t.grupInis })),
      ...OZELLIKLER.map((o) => ({ tip: 'ad' as const, id: o.id, ad: o.ad, grup: t.grupAd })),
    ],
    [aktif, t]
  );

  // Büyük harf dönüşümü dile göre yapılır: EN modda 'i' → 'I' (Türkçe 'İ' değil).
  useEffect(() => {
    document.documentElement.lang = dil;
  }, [dil]);

  // ---- bilgi kartı içeriği
  const kartIcerigi = useMemo<KartIcerigi | null>(() => {
    if (secili?.tip === 'aday') {
      const s = sirali.find((x) => x.aday.id === secili.id);
      return s ? { tip: 'aday', aday: s.aday, durum: { skor: s.skor, sira: s.sira, elendi: s.elendi }, ihlaller: s.ihlaller, toplam: uygunlar.length } : null;
    }
    if (secili?.tip === 'inis') {
      const o = INISLER.find((x) => x.id === secili.id);
      return o ? { tip: 'inis', inis: o } : null;
    }
    if (sonda) return { tip: 'sonda', enlem: sonda.enlem, boylam: sonda.boylam, ozellik: OZELLIKLER.find((x) => x.id === sonda.ozellikId), sonda: sondaVeri };
    return null;
  }, [secili, sonda, sondaVeri, sirali, uygunlar.length]);

  const kart = kartIcerigi ? (
    <ThemeProvider theme={acikTema}>
      <BilgiKarti icerik={kartIcerigi} dil={dil} onKapat={kapat} onDetay={(id) => analizAc(id)} onAdaSec={adaySec} onKarsilastir={karsilastirAc} />
    </ThemeProvider>
  ) : null;

  const ipucu = useMemo(() => {
    if (!hoverIsaret) return null;
    if (hoverIsaret.tip === 'aday') {
      const s = sirali.find((x) => x.aday.id === hoverIsaret.id);
      return s ? { metin: s.elendi ? `${s.aday.ad} · ${t.noGo}` : `${s.aday.ad} · #${s.sira} · ${s.skor.toFixed(1)}`, hedef: hoverIsaret } : null;
    }
    const o = INISLER.find((x) => x.id === hoverIsaret.id);
    return o ? { metin: `${o.ad} · ${o.yil}`, hedef: hoverIsaret } : null;
  }, [hoverIsaret, sirali, t]);

  const yedek = (
    <Box sx={{ height: 1, display: 'grid', placeItems: 'center', p: 3, textAlign: 'center', color: '#94a3b8' }}>
      <Typography variant="body2">{webgl ? t.kureHata : t.webglYok}</Typography>
    </Box>
  );

  const gorunenListe = hepsiGoster ? uygunlar : uygunlar.slice(0, ILK_GORUNEN);
  const gizliSayi = uygunlar.length - gorunenListe.length;
  const taslakSayisi = ADAYLAR.filter((a) => a.veri === 'taslak').length;

  // ---------------------------------------------------------------------

  return (
    <DashboardContent maxWidth={false} sx={{ pb: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: { xs: '1fr', lg: '310px minmax(0, 1fr) 330px', xl: '350px minmax(0, 1fr) 370px' },
          gridTemplateRows: { lg: 'minmax(0, 1fr)' },
          height: { lg: 'calc(100dvh - 40px)' },
          minHeight: { lg: 640 },
          p: 1.5,
          borderRadius: 3,
          // dış çerçeve: kürenin arkasındaki uzayla aynı siyah + hafif yıldız alanı (saf CSS, görsel dosya yok)
          bgcolor: '#04060b',
          backgroundImage: YILDIZLAR,
          backgroundSize: YILDIZ_BOYUT,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* ===================== SOL PANEL (HUD) ===================== */}
        <Box sx={{ ...PANEL_SX, display: 'grid', alignContent: 'start', gap: 1.5, order: { xs: 2, lg: 1 } }}>
          <ThemeProvider theme={acikTema}>
          <Box>
            <Chip size="small" label={t.rozet} sx={{ bgcolor: 'rgba(37,99,235,0.2)', color: '#1d4ed8', border: '1px solid rgba(37,99,235,0.5)', fontWeight: 700, mb: 1 }} />
            <Typography component="h1" sx={{ fontWeight: 800, fontSize: 18, lineHeight: 1.25, color: '#0f172a' }}>
              Evil Eye on Mars <span style={{ color: '#1d4ed8' }}>|</span> Mars Landing &amp; Astrobiology Matrix
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5, lineHeight: 1.45 }}>
              {t.alt}
            </Typography>
          </Box>

          {/* hızlı senaryolar */}
          <Box>
            <Typography sx={ETIKET_SX}>{t.senaryolar}</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 0.75 }}>
              {SENARYOLAR.map((s) => {
                const aktifSen = agirlikG === s.agirlik[0] && agirlikA === s.agirlik[1] && kisitAcik === s.kisit;
                return (
                  <Chip
                    key={s.id}
                    size="small"
                    clickable
                    label={t.senaryo[s.id as keyof typeof t.senaryo]}
                    title={t.senaryoIpucu[s.id as keyof typeof t.senaryoIpucu]}
                    onClick={() => senaryoUygula(s)}
                    sx={{
                      color: aktifSen ? '#ffffff' : '#334155',
                      bgcolor: aktifSen ? '#2563eb' : 'rgba(15,23,42,0.06)',
                      border: `1px solid ${aktifSen ? '#1d4ed8' : 'rgba(15,23,42,0.12)'}`,
                      fontWeight: 600,
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* iki bağımsız kaydırıcı */}
          <Box sx={{ display: 'grid', gap: 1 }}>
            {[
              { anahtar: 'g', etiket: t.guvenlikEtiket, yardim: t.guvenlikYardim, deger: agirlikG, set: setAgirlikG, renk: '#0891b2' },
              { anahtar: 'a', etiket: t.astroEtiket, yardim: t.astroYardim, deger: agirlikA, set: setAgirlikA, renk: '#f59e0b' },
            ].map((k) => (
              <Box key={k.anahtar}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{k.etiket}</Typography>
                  <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 800, fontSize: 18, color: k.renk }}>%{k.deger}</Typography>
                </Box>
                <Slider
                  size="small"
                  min={0}
                  max={100}
                  step={1}
                  value={k.deger}
                  onChange={(_e, v) => k.set(v as number)}
                  aria-label={k.etiket}
                  sx={{ color: k.renk, mt: 0, py: 0.75, '& .MuiSlider-rail': { opacity: 0.25 }, '& .MuiSlider-thumb': { boxShadow: `0 0 10px ${k.renk}` } }}
                />
                <Typography variant="caption" sx={{ color: '#64748b' }}>{k.yardim}</Typography>
              </Box>
            ))}
            <Typography variant="caption" sx={{ color: etkin.sifir ? '#b45309' : '#64748b', lineHeight: 1.45 }}>
              {etkin.sifir ? t.sifirAgirlik : t.bagimsiz}
            </Typography>
          </Box>

          {/* mühendislik kısıtları (No-Go) */}
          <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: kisitAcik ? 'rgba(244,63,94,0.09)' : 'rgba(15,23,42,0.04)', border: `1px solid ${kisitAcik ? 'rgba(244,63,94,0.45)' : 'rgba(15,23,42,0.08)'}` }}>
            <FormControlLabel
              sx={{ m: 0, alignItems: 'flex-start', gap: 0.5 }}
              control={<Switch size="small" checked={kisitAcik} onChange={(_e, c) => setKisitAcik(c)} color="error" />}
              label={<Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.35, mt: 0.5 }}>{t.kisitBaslik}</Typography>}
            />
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', lineHeight: 1.4 }}>{t.kisitAciklama}</Typography>
            {kisitAcik && (
              <Box sx={{ mt: 0.75, display: 'grid', gap: 0.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#334155' }}>{t.kisitEgim}</Typography>
                  <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>≤ {kisitEgim}°</Typography>
                </Box>
                <Slider size="small" min={1} max={25} step={0.5} value={kisitEgim} onChange={(_e, v) => setKisitEgim(v as number)} aria-label={t.kisitEgim} color="error" sx={{ py: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" sx={{ color: '#334155' }}>{t.kisitKaya}</Typography>
                  <Typography variant="caption" sx={{ color: '#0f172a', fontWeight: 700 }}>≤ %{kisitKaya}</Typography>
                </Box>
                <Slider size="small" min={2} max={20} step={1} value={kisitKaya} onChange={(_e, v) => setKisitKaya(v as number)} aria-label={t.kisitKaya} color="error" sx={{ py: 0.5 }} />
                <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>{t.kisitNot}</Typography>
              </Box>
            )}
          </Box>

          {/* taviz göstergesi */}
          <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Typography sx={{ ...ETIKET_SX, color: '#b45309', mb: 0.4 }}>{t.tavizBaslik}</Typography>
            <Typography sx={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.5 }}>{tavizMetni(t, taviz)}</Typography>
          </Box>

          {/* veri seti */}
          <FormControlLabel
            sx={{ m: 0, alignItems: 'flex-start', gap: 0.5 }}
            control={<Switch size="small" checked={taslakDahil} onChange={(_e, c) => setTaslakDahil(c)} />}
            label={
              <Box sx={{ mt: 0.4 }}>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{doldur(t.taslakAnahtar, { n: taslakSayisi })}</Typography>
                <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.35, display: 'block' }}>{t.taslakIpucu}</Typography>
              </Box>
            }
          />

          {/* arama + açılır liste */}
          <Box>
            <Autocomplete
              size="small"
              options={aramaSecenekleri}
              groupBy={(o) => o.grup}
              getOptionLabel={(o) => o.ad}
              isOptionEqualToValue={(o, v) => o.tip === v.tip && o.id === v.id}
              value={null}
              blurOnSelect
              noOptionsText={t.bulunamadi}
              onChange={(_e, o) => {
                if (!o) return;
                if (o.tip === 'aday') adaySec(o.id);
                else if (o.tip === 'inis') inisSec(o.id);
                else {
                  const oz = OZELLIKLER.find((x) => x.id === o.id);
                  if (oz) yuzeyTikla(oz.enlem, oz.boylam, oz.id, true);
                }
              }}
              renderInput={(p) => (
                <TextField
                  {...p}
                  placeholder={t.araSec}
                  sx={{ '& .MuiOutlinedInput-root': { color: '#0f172a', bgcolor: 'rgba(15,23,42,0.04)', '& fieldset': { borderColor: 'rgba(15,23,42,0.18)' } }, '& input::placeholder': { color: '#475569', opacity: 1 } }}
                />
              )}
              slotProps={{ paper: { sx: { bgcolor: '#ffffff', color: '#1e293b', backgroundImage: 'none' } } }}
            />
          </Box>

          {/* anlık sıralama (açılır) */}
          <Box>
            <Typography sx={ETIKET_SX}>{t.siralama}</Typography>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, mt: 0.75, display: 'grid', gap: 0.5 }}>
              {gorunenListe.map((s) => {
                const renk = skorRengi(s.skor);
                const aktifSatir = secili?.tip === 'aday' && secili.id === s.aday.id;
                const d = degisim[s.aday.id];
                return (
                  <Box component="li" key={s.aday.id} sx={{ listStyle: 'none' }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => adaySec(s.aday.id)}
                      aria-pressed={aktifSatir}
                      sx={{
                        width: 1,
                        display: 'grid',
                        gridTemplateColumns: '30px 1fr auto',
                        alignItems: 'center',
                        gap: 1,
                        textAlign: 'left',
                        p: '5px 10px',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        color: 'inherit',
                        font: 'inherit',
                        bgcolor: aktifSatir ? 'rgba(15,23,42,0.1)' : 'rgba(15,23,42,0.04)',
                        border: `1px solid ${aktifSatir ? renk : 'rgba(15,23,42,0.07)'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'background-color 150ms, border-color 150ms',
                        '&:hover': { bgcolor: 'rgba(15,23,42,0.09)' },
                        '&:focus-visible': { outline: `2px solid ${renk}`, outlineOffset: 2 },
                      }}
                    >
                      <Box sx={{ position: 'absolute', inset: 0, width: `${s.skor}%`, bgcolor: `${renk}1f`, transition: 'width 250ms ease', pointerEvents: 'none' }} />
                      <Typography sx={{ position: 'relative', fontWeight: 800, color: renk, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>#{s.sira}</Typography>
                      <Typography sx={{ position: 'relative', fontSize: 13, fontWeight: 600, color: '#0f172a', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.aday.ad}
                        {s.aday.veri === 'taslak' && <span style={{ marginLeft: 6, fontSize: 10, color: '#b45309' }}>◌</span>}
                        {d ? <span style={{ marginLeft: 6, fontSize: 11, color: d > 0 ? '#059669' : '#e11d48' }}>{d > 0 ? `▲${d}` : `▼${-d}`}</span> : null}
                      </Typography>
                      <Typography sx={{ position: 'relative', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums', color: '#0f172a' }}>{s.skor.toFixed(1)}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {(gizliSayi > 0 || hepsiGoster) && uygunlar.length > ILK_GORUNEN && (
              <Button size="small" onClick={() => setHepsiGoster((x) => !x)} sx={{ mt: 0.5, textTransform: 'none', color: '#1d4ed8' }}>
                {hepsiGoster ? t.azGoster : doldur(t.tumunuGoster, { n: uygunlar.length })}
              </Button>
            )}

            {elenenler.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography sx={{ ...ETIKET_SX, color: '#be123c' }}>{doldur(t.elenenBaslik, { n: elenenler.length })}</Typography>
                <Box sx={{ mt: 0.5, display: 'grid', gap: 0.4 }}>
                  {elenenler.map((s) => (
                    <Box
                      key={s.aday.id}
                      component="button"
                      type="button"
                      onClick={() => adaySec(s.aday.id)}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '4px 10px', borderRadius: 1.25, cursor: 'pointer', color: 'inherit', font: 'inherit', textAlign: 'left', bgcolor: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.28)', '&:hover': { bgcolor: 'rgba(244,63,94,0.14)' } }}
                    >
                      <Typography sx={{ color: '#f43f5e', fontWeight: 800, fontSize: 12 }}>✕</Typography>
                      <Typography sx={{ flex: 1, fontSize: 12.5, color: '#334155', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.aday.ad}</Typography>
                      <Typography sx={{ fontSize: 10.5, color: '#be123c', whiteSpace: 'nowrap' }}>
                        {s.ihlaller.map((i) => doldur(i.tip === 'egim' ? t.ihlalEgim : t.ihlalKaya, { d: i.deger, s: i.sinir })).join(' · ')}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <KararSeridi
            adaylar={uygunAdaylar.length > 0 ? uygunAdaylar : aktif}
            astroPay={pay}
            baslik={t.karar}
            ipucu={t.kararIpucu}
            guvenlikEtiket={t.guvenlik}
            astroEtiket={t.astro}
            onPayDegis={payAyarla}
          />

          {/* karşılaştır */}
          <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(244,114,182,0.07)', border: '1px solid rgba(244,114,182,0.3)', display: 'grid', gap: 0.75 }}>
            <Typography sx={{ ...ETIKET_SX, color: '#be185d' }}>{t.karsilastir.bolumBaslik}</Typography>
            <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.45 }}>{t.karsilastir.bolumIpucu}</Typography>
            <Button size="small" variant="outlined" onClick={() => karsilastirAc()} startIcon={<Iconify icon="solar:transfer-horizontal-bold" width={18} />} sx={{ ...BUTON_SX_ACIK, justifySelf: 'start' }}>
              {t.karsilastir.ac}
            </Button>
          </Box>

          {/* katmanlar */}
          <Box component="details" sx={{ '& summary': { cursor: 'pointer', ...ETIKET_SX, listStyle: 'revert' } }}>
            <summary>{t.katmanlar}</summary>
            <Box sx={{ mt: 0.75, display: 'grid' }}>
              {[
                { ad: t.adayKatman, deger: adayGoster, set: setAdayGoster },
                { ad: doldur(t.inisKatman, { n: INISLER.length }), deger: inisGoster, set: setInisGoster },
                { ad: t.adlarKatman, deger: adGoster, set: setAdGoster },
              ].map((k) => (
                <FormControlLabel
                  key={k.ad}
                  sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 12.5, color: '#1e293b' } }}
                  control={<Checkbox size="small" checked={k.deger} onChange={(_e, c) => k.set(c)} sx={{ py: 0.4 }} />}
                  label={k.ad}
                />
              ))}
              {adGoster && (
                <Box sx={{ pl: 2.5, display: 'grid' }}>
                  {(Object.keys(adGruplari) as OzellikGrup[]).map((g) => (
                    <FormControlLabel
                      key={g}
                      sx={{ m: 0, '& .MuiFormControlLabel-label': { fontSize: 12, color: '#334155' } }}
                      control={<Checkbox size="small" checked={adGruplari[g]} onChange={(_e, c) => setAdGruplari((o) => ({ ...o, [g]: c }))} sx={{ py: 0.25 }} />}
                      label={t.adlarGruplari[g]}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
          </ThemeProvider>
        </Box>

        {/* ===================== ORTA: 3B KÜRE ===================== */}
        <Box
          sx={{
            position: 'relative',
            order: { xs: 1, lg: 2 },
            height: { xs: '62vh', lg: 1 },
            minHeight: { xs: 400, lg: 0 },
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: '#04060b',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {webgl && <YuklemeKatmani metin={t.yukleniyor} />}
          {webgl ? (
            <MarsKure
              adaylar={aktif}
              durum={durum}
              inisler={INISLER}
              ozellikler={OZELLIKLER}
              adayGoster={adayGoster}
              inisGoster={inisGoster}
              adGoster={adGoster}
              adGruplari={adGruplari}
              secili={secili}
              sonda={sonda}
              odak={odak}
              otoDonus={!secili && !sonda && turIndeks === null && !hareketAz}
              hareketAz={hareketAz}
              kart={kart}
              ipucu={ipucu}
              bakisIsaretiRef={bakisIsaretiRef}
              onIsaretSec={(i) => (i.tip === 'aday' ? adaySec(i.id) : inisSec(i.id))}
              onYuzeyTikla={(enlem, boylam, ozellikId) => yuzeyTikla(enlem, boylam, ozellikId)}
              onBosTikla={kapat}
              onHover={hoverDegis}
              yedek={yedek}
            />
          ) : (
            yedek
          )}

          {/* 2B renkli harita (sol üst) */}
          <Box sx={{ position: 'absolute', top: 10, left: 10, width: { xs: 150, sm: 230, lg: 250 }, zIndex: 5 }}>
            <MiniHarita
              adaylar={aktif}
              durum={durum}
              inisler={INISLER}
              adayGoster={adayGoster}
              inisGoster={inisGoster}
              secili={secili}
              sonda={sonda}
              bakisIsaretiRef={bakisIsaretiRef}
              baslik={t.miniHarita}
              onTikla={(enlem, boylam) => {
                yuzeyTikla(enlem, boylam, undefined, true);
              }}
            />
          </Box>

          {/* araç çubuğu (sağ üst) */}
          <Box sx={{ position: 'absolute', top: 10, right: 10, left: { xs: 170, sm: 250, lg: 270 }, display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'flex-end', pointerEvents: 'none', zIndex: 5, '& > *': { pointerEvents: 'auto' } }}>
            <Button
              size="small"
              variant="contained"
              color={turIndeks === null ? 'error' : 'inherit'}
              onClick={() => setTurIndeks(turIndeks === null ? 0 : null)}
              startIcon={<Iconify icon={turIndeks === null ? 'solar:play-circle-bold' : 'solar:stop-circle-bold'} width={18} />}
              sx={{ fontWeight: 700, textTransform: 'none' }}
            >
              {turIndeks === null ? t.sunum : t.sunumDur}
            </Button>
            <Button size="small" variant="outlined" onClick={() => analizAc()} startIcon={<Iconify icon="solar:document-text-bold" width={18} />} sx={BUTON_SX}>
              {t.analizDugme}
            </Button>
            <Box sx={{ display: 'inline-flex', borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.3)' }} role="group" aria-label={t.dil}>
              {(['tr', 'en'] as const).map((d) => (
                <Button
                  key={d}
                  size="small"
                  onClick={() => setDil(d)}
                  aria-pressed={dil === d}
                  sx={{ minWidth: 38, borderRadius: 0, color: '#fff', fontWeight: 800, bgcolor: dil === d ? 'rgba(37,99,235,0.7)' : 'rgba(5,7,13,0.6)', '&:hover': { bgcolor: dil === d ? 'rgba(37,99,235,0.85)' : 'rgba(255,255,255,0.12)' } }}
                >
                  {d.toUpperCase()}
                </Button>
              ))}
            </Box>
          </Box>

          {/* alt bilgi: sunum anlatımı ya da etkileşim ipucu */}
          <Box sx={{ position: 'absolute', left: 12, right: 12, bottom: 10, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 4 }}>
            {turAciklamasi ? (
              <Box sx={{ maxWidth: 640, px: 2, py: 1.25, borderRadius: 2, bgcolor: 'rgba(5,7,13,0.88)', border: '1px solid rgba(37,99,235,0.6)', color: '#fff', textAlign: 'center', boxShadow: '0 0 24px rgba(37,99,235,0.25)' }} aria-live="polite">
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>{turAciklamasi}</Typography>
              </Box>
            ) : (
              !kart && (
                <Typography variant="caption" sx={{ color: 'rgba(203,213,225,0.75)', textShadow: '0 1px 4px #000', textAlign: 'center', display: { xs: 'none', sm: 'block' } }}>
                  {t.kureIpucu}
                </Typography>
              )
            )}
          </Box>
        </Box>

        {/* ===================== SAĞ PANEL (TELEMETRİ) ===================== */}
        <Box sx={{ ...PANEL_SX, display: 'grid', alignContent: 'start', gap: 2, order: 3 }}>
          <ThemeProvider theme={acikTema}>
          <Typography sx={ETIKET_SX}>{t.telemetri}</Typography>

          {seciliAday ? (
            <TelemetriKarti
              aday={seciliAday}
              adaylar={aktif}
              skor={durum[seciliAday.id].skor}
              sira={durum[seciliAday.id].sira}
              agirlikG={agirlikG}
              agirlikA={agirlikA}
              dil={dil}
              elendi={durum[seciliAday.id].elendi}
            />
          ) : kartIcerigi ? (
            <BilgiKarti icerik={kartIcerigi} dil={dil} kompakt onAdaSec={adaySec} />
          ) : (
            <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.55 }}>{t.secimYok}</Typography>
          )}

          <DengeGrafigi
            adaylar={aktif}
            skorlar={Object.fromEntries(sirali.map((s) => [s.aday.id, s.skor]))}
            seciliId={secili?.tip === 'aday' ? secili.id : null}
            agirlikG={agirlikG}
            agirlikA={agirlikA}
            birinciId={birinci?.id ?? ''}
            baslik={t.dengeGrafik}
            ipucu={t.dengeIpucu}
            guvenlikEtiket={t.guvenlik}
            astroEtiket={t.astro}
            elenenIdler={new Set(elenenler.map((e) => e.aday.id))}
            onSec={adaySec}
          />

          {/* veri ve yöntem */}
          <Box component="details" sx={{ '& summary': { cursor: 'pointer', ...ETIKET_SX, listStyle: 'revert' } }}>
            <summary>{t.yontem}</summary>
            <Box sx={{ mt: 1, display: 'grid', gap: 1 }}>
              <Typography sx={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 12, color: '#0f172a', bgcolor: 'rgba(15,23,42,0.06)', p: 1, borderRadius: 1, lineHeight: 1.5 }}>
                {t.formul}
              </Typography>
              <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.5 }}>{t.formulAcik}</Typography>
              <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.5 }}>{t.esikler}</Typography>
              <Typography variant="caption" sx={{ color: '#b45309', lineHeight: 1.5 }}>{t.sinirlar}</Typography>
              <Typography sx={{ ...ETIKET_SX, mt: 0.5 }}>{t.kaynaklar}</Typography>
              <Box component="ul" sx={{ m: 0, pl: 2, listStyleType: 'disc' }}>
                {VERI_KAYNAKLARI.map((k) => (
                  <Typography key={k.ad} component="li" variant="caption" sx={{ display: 'list-item', color: '#334155', lineHeight: 1.5 }}>
                    <a href={k.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1' }}>{k.ad}</a> — {k.rol[dil]}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>
          </ThemeProvider>
        </Box>
      </Box>

      <ThemeProvider theme={acikTema}>
      <AnalizModal
        acik={analizAcik}
        onKapat={() => setAnalizAcik(false)}
        dil={dil}
        adaylar={aktif}
        seciliId={analizId}
        onSec={setAnalizId}
        onKarsilastir={(id) => {
          setAnalizAcik(false);
          karsilastirAc(id);
        }}
        agirlikG={agirlikG}
        agirlikA={agirlikA}
        kisit={kisit}
      />
      <KarsilastirModal
        acik={karsilastirAcik}
        onKapat={() => setKarsilastirAcik(false)}
        dil={dil}
        adaylar={aktif}
        aId={karsA}
        bId={karsB}
        onDegis={(a, b) => {
          setKarsA(a);
          setKarsB(b);
        }}
        agirlikG={agirlikG}
        agirlikA={agirlikA}
        kisit={kisit}
      />
      </ThemeProvider>
    </DashboardContent>
  );
}
