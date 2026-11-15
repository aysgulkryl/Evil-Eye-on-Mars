import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from '../shims/Iconify';

import { METINLER, doldur } from '../data/metinler';
import { riskBilesenleri } from '../utils/guvenlikModeli';
import {
  baskinAday,
  bilesikSkor,
  etkinAgirlik,
  kisitDurumu,
  paretoAdaylari,
  skorRengi,
  siralama,
} from '../utils/mcda';

import type { Aday, Dil } from '../data/adaylar';
import type { Kisit } from '../utils/mcda';

type Props = {
  acik: boolean;
  onKapat: () => void;
  dil: Dil;
  adaylar: Aday[];
  aId: string;
  bId: string;
  onDegis: (a: string, b: string) => void;
  agirlikG: number;
  agirlikA: number;
  kisit: Kisit;
};

const A_RENK = '#0891b2';
const B_RENK = '#db2777';
const etiket = { color: '#475569', fontSize: 11, letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: 700 } as const;

/** Beş eksenli profil radarı (0–1; dışarısı daha iyi). Eğim, kaya ve rakım riski tersine çevrilip marj olarak çizilir. */
function Radar({ a, b, etiketler }: { a: Aday; b: Aday; etiketler: string[] }) {
  const R = 72;
  const C = 100;
  const eksen = (x: Aday) => {
    const r = riskBilesenleri(x.egim, x.kaya, x.rakim);
    return [x.guvenlik / 100, x.astro / 100, 1 - r.egim, 1 - r.kaya, 1 - r.rakim];
  };
  const nokta = (v: number, i: number) => {
    const aci = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return [C + Math.cos(aci) * R * v, C + Math.sin(aci) * R * v] as const;
  };
  const yol = (vals: number[]) => vals.map((v, i) => nokta(v, i).map((c) => c.toFixed(1)).join(',')).join(' ');
  return (
    <Box component="svg" viewBox="-34 -6 268 212" role="img" aria-label={etiketler.join(', ')} sx={{ width: 1, maxWidth: 290, height: 'auto', mx: 'auto', display: 'block' }}>
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <polygon key={s} points={yol([s, s, s, s, s])} fill="none" stroke="rgba(15,23,42,0.12)" />
      ))}
      {etiketler.map((_e, i) => {
        const [x, y] = nokta(1, i);
        return <line key={i} x1={C} y1={C} x2={x} y2={y} stroke="rgba(15,23,42,0.12)" />;
      })}
      <polygon points={yol(eksen(a))} fill={`${A_RENK}33`} stroke={A_RENK} strokeWidth="2" />
      <polygon points={yol(eksen(b))} fill={`${B_RENK}33`} stroke={B_RENK} strokeWidth="2" />
      {etiketler.map((e, i) => {
        const [x, y] = nokta(1.2, i);
        return (
          <text key={e} x={x} y={y + 3} fill="#334155" fontSize="8.5" textAnchor="middle">
            {e}
          </text>
        );
      })}
    </Box>
  );
}

/** İki bölgeyi karşılaştıran, ekranın ortasında açılan pencere. */
export default function KarsilastirModal({ acik, onKapat, dil, adaylar, aId, bId, onDegis, agirlikG, agirlikA, kisit }: Props) {
  const t = METINLER[dil];
  const k = t.karsilastir;
  const a = adaylar.find((x) => x.id === aId) ?? adaylar[0];
  const b = adaylar.find((x) => x.id === bId && x.id !== a.id) ?? adaylar.find((x) => x.id !== a.id) ?? adaylar[0];

  const bilgi = useMemo(() => {
    const sira = siralama(adaylar, agirlikG, agirlikA, kisit);
    const de = (x: Aday) => sira.find((s) => s.aday.id === x.id)!;
    const pareto = new Set(paretoAdaylari(adaylar).map((x) => x.id));
    // baştan başa: skor_a(t) − skor_b(t) = d0 + t·(d1 − d0), t = astrobiyoloji payı (0..1)
    const d0 = a.guvenlik - b.guvenlik;
    const d1 = a.astro - b.astro;
    let kesisim: number | null = null;
    if ((d0 > 0 && d1 < 0) || (d0 < 0 && d1 > 0)) kesisim = (d0 / (d0 - d1)) * 100;
    const aHep = d0 >= 0 && d1 >= 0 && (d0 > 0 || d1 > 0);
    const bHep = d0 <= 0 && d1 <= 0 && (d0 < 0 || d1 < 0);
    const e = etkinAgirlik(agirlikG, agirlikA);
    return {
      sa: de(a), sb: de(b), pareto, kesisim, aHep, bHep, d0, d1,
      pay: (e.wA / (e.wS + e.wA)) * 100,
      skA: bilesikSkor(a, agirlikG, agirlikA), skB: bilesikSkor(b, agirlikG, agirlikA),
      baskA: baskinAday(a, adaylar), baskB: baskinAday(b, adaylar),
      kA: kisitDurumu(a, kisit), kB: kisitDurumu(b, kisit),
    };
  }, [adaylar, a, b, agirlikG, agirlikA, kisit]);

  const iyiYon = (x: number, y: number, yuksekIyi: boolean) => (x === y ? 0 : (x > y) === yuksekIyi ? 1 : 2); // 1: A iyi, 2: B iyi

  type Satir = { ad: string; a: React.ReactNode; b: React.ReactNode; iyi?: 0 | 1 | 2 };
  const satirlar: Satir[] = [
    { ad: t.skor, a: bilgi.skA.toFixed(1), b: bilgi.skB.toFixed(1), iyi: iyiYon(bilgi.skA, bilgi.skB, true) },
    { ad: t.siralama, a: bilgi.sa.elendi ? t.noGo : `#${bilgi.sa.sira}`, b: bilgi.sb.elendi ? t.noGo : `#${bilgi.sb.sira}`, iyi: bilgi.sa.elendi === bilgi.sb.elendi ? iyiYon(bilgi.sa.sira, bilgi.sb.sira, false) : bilgi.sa.elendi ? 2 : 1 },
    { ad: t.guvenlik, a: a.guvenlik, b: b.guvenlik, iyi: iyiYon(a.guvenlik, b.guvenlik, true) },
    { ad: t.astro, a: a.astro, b: b.astro, iyi: iyiYon(a.astro, b.astro, true) },
    { ad: t.egim, a: `${a.egim.toFixed(1)}°`, b: `${b.egim.toFixed(1)}°`, iyi: iyiYon(a.egim, b.egim, false) },
    { ad: t.kaya, a: `%${a.kaya}`, b: `%${b.kaya}`, iyi: iyiYon(a.kaya, b.kaya, false) },
    { ad: t.rakim, a: `${a.rakim.toFixed(1)} km`, b: `${b.rakim.toFixed(1)} km`, iyi: iyiYon(a.rakim, b.rakim, false) },
    {
      ad: k.kisit,
      a: <span style={{ color: bilgi.kA.gecer ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{bilgi.kA.gecer ? t.analiz.gecer : t.noGo}</span>,
      b: <span style={{ color: bilgi.kB.gecer ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{bilgi.kB.gecer ? t.analiz.gecer : t.noGo}</span>,
      iyi: bilgi.kA.gecer === bilgi.kB.gecer ? 0 : bilgi.kA.gecer ? 1 : 2,
    },
    { ad: t.paleo, a: a.ozellik[dil], b: b.ozellik[dil] },
    { ad: t.mineraller, a: a.mineraller[dil].join(', '), b: b.mineraller[dil].join(', ') },
    { ad: t.bolge, a: a.bolge[dil], b: b.bolge[dil] },
    { ad: k.veri, a: a.veri === 'taslak' ? t.taslakRozet : t.verilenRozet, b: b.veri === 'taslak' ? t.taslakRozet : t.verilenRozet },
    {
      ad: k.pareto,
      a: bilgi.baskA ? doldur(t.analiz.baskin, { x: bilgi.baskA.ad.split(' ')[0] }) : bilgi.pareto.has(a.id) ? t.analiz.paretoCephe : '—',
      b: bilgi.baskB ? doldur(t.analiz.baskin, { x: bilgi.baskB.ad.split(' ')[0] }) : bilgi.pareto.has(b.id) ? t.analiz.paretoCephe : '—',
    },
  ];

  const fark = Math.abs(bilgi.skA - bilgi.skB);
  const onde = bilgi.skA >= bilgi.skB ? a : b;
  const geri = onde.id === a.id ? b : a;
  let ozet = doldur(k.ozetKazanan, { a: onde.ad, b: geri.ad, d: fark.toFixed(1) });
  if (bilgi.kA.gecer !== bilgi.kB.gecer) ozet += ` ${doldur(k.ozetKisit, { x: (bilgi.kA.gecer ? b : a).ad })}`;
  if (a.astro !== b.astro) ozet += ` ${doldur(k.ozetBilim, { x: (a.astro > b.astro ? a : b).ad, d: Math.abs(a.astro - b.astro) })}`;
  if (a.guvenlik !== b.guvenlik) ozet += ` ${doldur(k.ozetGuvenlik, { x: (a.guvenlik > b.guvenlik ? a : b).ad, d: Math.abs(a.guvenlik - b.guvenlik) })}`;

  const secici = (deger: Aday, renk: string, etk: string, degis: (id: string) => void, haric: string) => (
    <Autocomplete
      size="small"
      disableClearable
      value={deger}
      options={adaylar.filter((x) => x.id !== haric)}
      getOptionLabel={(o) => o.ad}
      isOptionEqualToValue={(o, v) => o.id === v.id}
      onChange={(_e, v) => degis(v.id)}
      noOptionsText={t.bulunamadi}
      renderInput={(p) => (
        <TextField
          {...p}
          label={etk}
          sx={{ '& .MuiOutlinedInput-root': { color: '#0f172a', '& fieldset': { borderColor: renk }, '&:hover fieldset': { borderColor: renk } }, '& label': { color: renk } }}
        />
      )}
      slotProps={{ paper: { sx: { bgcolor: '#ffffff', color: '#1e293b', backgroundImage: 'none' } } }}
    />
  );

  const kazananSerit = (() => {
    const pay = bilgi.pay;
    let metin: string;
    if (bilgi.aHep) metin = doldur(k.hep, { a: a.ad, b: b.ad });
    else if (bilgi.bHep) metin = doldur(k.hep, { a: b.ad, b: a.ad });
    else if (bilgi.kesisim === null) metin = k.ayniPuan;
    else {
      const altKazanan = bilgi.d0 > 0 ? a : b; // güvenlik ağırlıklı uçta kim önde
      const ustKazanan = altKazanan.id === a.id ? b : a;
      metin = doldur(k.kesisimMetni, { x: bilgi.kesisim.toFixed(1), alt: altKazanan.ad, ust: ustKazanan.ad });
    }
    // şerit: sol uç güvenlik, sağ uç astrobiyoloji
    const bolum = bilgi.kesisim ?? (bilgi.aHep ? 0 : bilgi.bHep ? 0 : 50);
    const solRenk = bilgi.aHep ? B_RENK : bilgi.bHep ? A_RENK : bilgi.d0 > 0 ? A_RENK : B_RENK;
    const sagRenk = bilgi.aHep ? A_RENK : bilgi.bHep ? B_RENK : bilgi.d0 > 0 ? B_RENK : A_RENK;
    return { metin, pay, bolum: bilgi.aHep || bilgi.bHep ? 0 : bolum, solRenk, sagRenk };
  })();

  return (
    <Dialog
      open={acik}
      onClose={onKapat}
      maxWidth="md"
      fullWidth
      scroll="paper"
      slotProps={{ paper: { sx: { bgcolor: '#ffffff', color: '#1e293b', backgroundImage: 'none', border: '1px solid rgba(15,23,42,0.12)', borderRadius: 3 } } }}
    >
      <Box sx={{ p: 2.25, pb: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1, borderBottom: '1px solid rgba(15,23,42,0.1)' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{k.baslik}</Typography>
          <Typography variant="body2" sx={{ color: '#475569' }}>{k.alt}</Typography>
        </Box>
        <IconButton onClick={onKapat} aria-label={t.kapat} sx={{ color: '#475569' }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2.25, display: 'grid', gap: 2.25 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
          {secici(a, A_RENK, k.bolgeA, (id) => onDegis(id, b.id), b.id)}
          {secici(b, B_RENK, k.bolgeB, (id) => onDegis(a.id, id), a.id)}
        </Box>

        <Box sx={{ p: 1.75, borderRadius: 2, bgcolor: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.08)' }}>
          <Typography sx={{ ...etiket, mb: 0.5 }}>{k.ozet}</Typography>
          <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: '#0f172a' }}>{ozet}</Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.55fr 1fr' }, gap: 2.25, alignItems: 'start' }}>
          {/* yan yana tablo */}
          <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(15,23,42,0.1)' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr', bgcolor: 'rgba(15,23,42,0.06)' }}>
              <Box sx={{ p: 1 }} />
              {[a, b].map((x, i) => (
                <Box key={x.id} sx={{ p: 1, borderLeft: '1px solid rgba(15,23,42,0.08)', borderTop: `3px solid ${i === 0 ? A_RENK : B_RENK}` }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a', lineHeight: 1.25 }}>{x.ad}</Typography>
                </Box>
              ))}
            </Box>
            {satirlar.map((s) => (
              <Box key={s.ad} sx={{ display: 'grid', gridTemplateColumns: '0.8fr 1fr 1fr', borderTop: '1px solid rgba(15,23,42,0.07)' }}>
                <Typography sx={{ ...etiket, p: 1, alignSelf: 'center' }}>{s.ad}</Typography>
                {[s.a, s.b].map((v, i) => {
                  const iyi = s.iyi === (i === 0 ? 1 : 2);
                  return (
                    <Box key={i} sx={{ p: 1, borderLeft: '1px solid rgba(15,23,42,0.07)', bgcolor: iyi ? 'rgba(16,185,129,0.12)' : 'transparent', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {iyi && <Iconify icon="solar:check-circle-bold" width={15} sx={{ color: '#10b981', flexShrink: 0 }} />}
                      <Typography component="div" sx={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.4, fontVariantNumeric: 'tabular-nums' }}>{v}</Typography>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          {/* radar + baştan başa */}
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box>
              <Typography sx={etiket}>{k.radar}</Typography>
              <Radar a={a} b={b} etiketler={[t.guvenlik, t.astro, k.eksenEgim, k.eksenKaya, k.eksenRakim]} />
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5 }}>
                {[[a, A_RENK], [b, B_RENK]].map(([x, c]) => (
                  <Box key={(x as Aday).id} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c as string }} />
                    <Typography sx={{ fontSize: 11.5, color: '#334155' }}>{(x as Aday).ad.split(' ')[0]}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box>
              <Typography sx={etiket}>{k.basaBas}</Typography>
              <Box sx={{ position: 'relative', mt: 0.75, height: 26, borderRadius: 1, overflow: 'hidden', display: 'flex', border: '1px solid rgba(15,23,42,0.14)' }}>
                {kazananSerit.bolum > 0 ? (
                  <>
                    <Box sx={{ width: `${kazananSerit.bolum}%`, bgcolor: `${kazananSerit.solRenk}55` }} />
                    <Box sx={{ flex: 1, bgcolor: `${kazananSerit.sagRenk}55` }} />
                  </>
                ) : (
                  <Box sx={{ flex: 1, bgcolor: `${bilgi.aHep ? A_RENK : bilgi.bHep ? B_RENK : '#64748b'}55` }} />
                )}
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: `calc(${kazananSerit.pay}% - 1px)`, width: 2, bgcolor: '#0f172a', boxShadow: '0 0 6px #0f172a' }} />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: 11, mt: 0.5 }}>
                <span>{t.guvenlik}</span>
                <span>{t.astro}</span>
              </Box>
              <Typography sx={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5, mt: 0.5 }}>{kazananSerit.metin}</Typography>
              <Typography sx={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45, mt: 0.5 }}>
                {doldur(k.simdi, { kazanan: onde.ad, fark: fark.toFixed(1) })}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[a, b].map((x, i) => (
            <Chip
              key={x.id}
              size="small"
              label={`${x.ad}: ${bilesikSkor(x, agirlikG, agirlikA).toFixed(1)}`}
              sx={{ color: i === 0 ? A_RENK : B_RENK, border: `1px solid ${skorRengi(bilesikSkor(x, agirlikG, agirlikA))}`, bgcolor: 'transparent', fontWeight: 700 }}
            />
          ))}
          <Typography sx={{ fontSize: 11.5, color: '#64748b', alignSelf: 'center' }}>{t.sinirlar}</Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
