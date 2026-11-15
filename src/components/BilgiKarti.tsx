import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from '../shims/Iconify';

import { INIS_RENKLERI } from '../data/inisler';
import { METINLER, doldur } from '../data/metinler';
import { bolgeBul, donemMetni, enYakinlar } from '../utils/nokta';
import { OZELLIK_NOTLARI, TUR_ADI, TUR_GENEL, OZELLIK_GRUBU, OZELLIK_RENGI } from '../data/ozellikler';
import { boylamMetni, enlemMetni, egimDurumu, skorRengi } from '../utils/mcda';

import type { NoktaVerisi } from '../utils/nokta';
import type { Inis } from '../data/inisler';
import type { Aday, Dil } from '../data/adaylar';
import type { Ozellik } from '../data/ozellikler';
import type { AdayDurum } from './MarsKure';
import type { KisitIhlali } from '../utils/mcda';

export type SondaVerisi = { durum: 'yukleniyor' | 'hazir' | 'yok'; veri?: NoktaVerisi };

export type KartIcerigi =
  | { tip: 'aday'; aday: Aday; durum: AdayDurum; ihlaller: KisitIhlali[]; toplam: number }
  | { tip: 'inis'; inis: Inis }
  | { tip: 'sonda'; enlem: number; boylam: number; ozellik?: Ozellik; sonda: SondaVerisi };

type Props = {
  icerik: KartIcerigi;
  dil: Dil;
  kompakt?: boolean; // yan panelde: kapat düğmesi ve giriş animasyonu olmadan
  onKapat?: () => void;
  onDetay?: (adayId: string) => void;
  onAdaSec?: (adayId: string) => void;
  onKarsilastir?: (adayId: string) => void;
};

const etiket = { color: '#475569', fontSize: 10.5, letterSpacing: 0.7, textTransform: 'uppercase', fontWeight: 700 } as const;

function Satir({ ad, deger }: { ad: string; deger: string }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, alignItems: 'baseline' }}>
      <Typography sx={{ ...etiket, minWidth: 0 }}>{ad}</Typography>
      <Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: 12.5, fontVariantNumeric: 'tabular-nums', textAlign: 'right', whiteSpace: 'nowrap' }}>{deger}</Typography>
    </Box>
  );
}

function Basligi({ renk, baslik, alt, onKapat, kapatMetni }: { renk: string; baslik: string; alt: string; onKapat?: () => void; kapatMetni: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ mt: '5px', width: 10, height: 10, borderRadius: '50%', bgcolor: renk, boxShadow: `0 0 8px ${renk}`, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ color: '#0f172a', fontWeight: 800, fontSize: 15, lineHeight: 1.25 }}>{baslik}</Typography>
        <Typography sx={{ color: '#475569', fontSize: 11.5, lineHeight: 1.3 }}>{alt}</Typography>
      </Box>
      {onKapat && (
        <IconButton size="small" onClick={onKapat} aria-label={kapatMetni} sx={{ color: '#475569', mt: -0.5, mr: -0.75 }}>
          <Iconify icon="mingcute:close-line" width={18} />
        </IconButton>
      )}
    </Box>
  );
}

/** Bir pine, iniş yerine ya da yüzeydeki herhangi bir noktaya tıklanınca açılan bilgi kartı. */
export default function BilgiKarti({ icerik, dil, kompakt, onKapat, onDetay, onAdaSec, onKarsilastir }: Props) {
  const t = METINLER[dil];
  const anahtar =
    icerik.tip === 'aday' ? `a:${icerik.aday.id}` : icerik.tip === 'inis' ? `i:${icerik.inis.id}` : `s:${icerik.enlem.toFixed(2)},${icerik.boylam.toFixed(2)}`;

  const kutu = (children: React.ReactNode) => (
    <Box
      key={anahtar}
      sx={{
        p: 1.75,
        display: 'grid',
        gap: 1.1,
        color: '#1e293b',
        borderRadius: kompakt ? 1.5 : 2,
        bgcolor: kompakt ? 'rgba(15,23,42,0.04)' : 'rgba(226,231,238,0.97)',
        border: '1px solid rgba(15,23,42,0.14)',
        boxShadow: kompakt ? 'none' : '0 12px 40px rgba(15,23,42,0.18)',
        backdropFilter: kompakt ? 'none' : 'blur(10px)',
        maxHeight: kompakt ? 'none' : 'min(420px, calc(100% - 16px))',
        overflowY: kompakt ? 'visible' : 'auto',
        scrollbarWidth: 'thin',
        animation: kompakt ? 'none' : 'bilgiKartiAc 240ms cubic-bezier(0.2, 0.9, 0.25, 1) both',
        '@keyframes bilgiKartiAc': {
          from: { opacity: 0, transform: 'translateY(10px) scale(0.93)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    >
      {children}
    </Box>
  );

  // ------------------------------------------------------------------ aday bölge
  if (icerik.tip === 'aday') {
    const { aday, durum, ihlaller, toplam } = icerik;
    const renk = durum.elendi ? '#475569' : skorRengi(durum.skor);
    const egim = egimDurumu(aday.egim);
    const EGIM_RENK = { ideal: '#10b981', dikkat: '#f59e0b', kritik: '#f43f5e' } as const;
    return kutu(
      <>
        <Basligi
          renk={renk}
          baslik={aday.ad}
          alt={durum.elendi ? `${t.noGo}: ${ihlaller.map((i) => doldur(i.tip === 'egim' ? t.ihlalEgim : t.ihlalKaya, { d: i.deger, s: i.sinir })).join(', ')}` : `#${durum.sira}/${toplam} · ${t.skor} ${durum.skor.toFixed(1)}`}
          onKapat={onKapat}
          kapatMetni={t.kapat}
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          <Chip size="small" label={aday.veri === 'taslak' ? t.taslakRozet : t.verilenRozet} variant="outlined" sx={{ height: 20, fontSize: 10.5, color: aday.veri === 'taslak' ? '#b45309' : '#047857', borderColor: 'currentColor' }} />
          <Chip size="small" label={aday.ozellik[dil]} variant="outlined" sx={{ height: 20, fontSize: 10.5, color: '#334155', borderColor: 'rgba(15,23,42,0.25)' }} />
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, columnGap: 2 }}>
          <Satir ad={t.guvenlik} deger={`${aday.guvenlik}/100`} />
          <Satir ad={t.astro} deger={`${aday.astro}/100`} />
        </Box>
        {/* Açılır kartta (küre üstü) yalnızca özet: ayrıntılar sağdaki telemetri panelinde. */}
        {kompakt && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5, columnGap: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={etiket}>{t.egim}</Typography>
            <Typography sx={{ color: EGIM_RENK[egim], fontWeight: 700, fontSize: 12.5 }}>{aday.egim.toFixed(1)}°</Typography>
          </Box>
          <Satir ad={t.kaya} deger={`%${aday.kaya}`} />
          <Satir ad={t.rakim} deger={`${aday.rakim.toFixed(1)} km`} />
          <Satir ad={t.koordinat} deger={`${aday.enlem.toFixed(1)}°, ${aday.boylam.toFixed(1)}°`} />
        </Box>
        )}
        <Box>
          <Typography sx={etiket}>{t.bolge}</Typography>
          <Typography sx={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.4 }}>{aday.bolge[dil]}</Typography>
        </Box>
        {kompakt && (
        <Box>
          <Typography sx={etiket}>{t.gecmis}</Typography>
          <Typography sx={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{aday.gecmis[dil]}</Typography>
        </Box>
        )}
        {!kompakt && <Typography sx={{ fontSize: 11.5, color: '#475569' }}>{t.kartIpucu}</Typography>}
        {!kompakt && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            <Button size="small" variant="contained" color="error" onClick={() => onDetay?.(aday.id)} sx={{ textTransform: 'none', fontWeight: 700 }}>
              {t.detayAc}
            </Button>
            <Button size="small" variant="outlined" onClick={() => onKarsilastir?.(aday.id)} sx={{ textTransform: 'none', color: '#0f172a', borderColor: 'rgba(15,23,42,0.3)' }}>
              {t.karsilastirDugme}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // ------------------------------------------------------------------ iniş yeri
  if (icerik.tip === 'inis') {
    const { inis } = icerik;
    const renk = INIS_RENKLERI[inis.durum];
    const b = bolgeBul(inis.enlem, inis.boylam);
    const yak = enYakinlar(inis.enlem, inis.boylam).aday;
    return kutu(
      <>
        <Basligi renk={renk} baslik={inis.ad} alt={`${inis.kurum} · ${inis.yil} · ${inis.tur[dil]}`} onKapat={onKapat} kapatMetni={t.kapat} />
        <Chip size="small" label={t.durumlar[inis.durum]} sx={{ height: 20, fontSize: 10.5, width: 'fit-content', color: renk, bgcolor: `${renk}22`, border: `1px solid ${renk}` }} />
        <Typography sx={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{inis.not[dil]}</Typography>
        <Box sx={{ display: 'grid', gap: 0.5 }}>
          <Satir ad={t.koordinat} deger={`${enlemMetni(inis.enlem)} · ${boylamMetni(inis.boylam)}`} />
          <Satir ad={t.hangiBolge} deger={b.ana?.ad ?? t.genelAd[inis.enlem < -20 ? 'guney' : inis.enlem > 30 ? 'kuzey' : 'ekvator']} />
          <Satir ad={t.donem} deger={b.donem} />
          <Satir ad={t.yakinAday} deger={`${yak.oge.ad} (${yak.km.toFixed(0)} ${t.km})`} />
        </Box>
        {!kompakt && yak.km < 1500 && (
          <Button size="small" variant="outlined" onClick={() => onAdaSec?.(yak.oge.id)} sx={{ textTransform: 'none', width: 'fit-content', color: '#0f172a', borderColor: 'rgba(15,23,42,0.3)' }}>
            {yak.oge.ad}
          </Button>
        )}
      </>
    );
  }

  // ------------------------------------------------------------------ yüzey noktası / adlandırılmış özellik
  const { enlem, boylam, ozellik, sonda } = icerik;
  const b = bolgeBul(enlem, boylam, sonda.veri?.rakimKm);
  const yak = enYakinlar(enlem, boylam);
  const genelAd = enlem < -20 ? t.genelAd.guney : enlem > 30 ? t.genelAd.kuzey : t.genelAd.ekvator;
  const baslik = ozellik ? ozellik.ad : b.ana?.ad ?? genelAd;
  const grup = ozellik ? OZELLIK_GRUBU[ozellik.tur] : null;
  const renk = grup ? OZELLIK_RENGI[grup] : '#0891b2';
  const aciklama = ozellik
    ? OZELLIK_NOTLARI[ozellik.ad]?.[dil] ?? TUR_GENEL[ozellik.tur][dil]
    : b.ana
      ? b.ana.aciklama[dil]
      : t.genelNot;
  const v = sonda.veri;

  return kutu(
    <>
      <Basligi renk={renk} baslik={baslik} alt={ozellik ? TUR_ADI[ozellik.tur][dil] : t.sondaBaslik} onKapat={onKapat} kapatMetni={t.kapat} />
      <Typography sx={{ fontSize: 12.5, color: '#1e293b', lineHeight: 1.5 }}>{aciklama}</Typography>
      <Box sx={{ display: 'grid', gap: 0.5 }}>
        <Satir ad={t.koordinat} deger={`${enlemMetni(enlem)} · ${boylamMetni(boylam)}`} />
        {sonda.durum === 'yukleniyor' && <Typography sx={{ color: '#64748b', fontSize: 12 }}>{t.sondaYukleniyor}</Typography>}
        {sonda.durum === 'yok' && <Typography sx={{ color: '#b45309', fontSize: 12 }}>{t.sondaVeriYok}</Typography>}
        {v && (
          <>
            <Satir ad={t.rakimMola} deger={`${v.rakimKm.toFixed(2)} km`} />
            <Satir ad={doldur(t.bolgeselEgim, { km: v.tabanKm.toFixed(0) })} deger={`${v.egim.toFixed(1)}° · ${t.yuzey[v.yuzey]}`} />
            <Satir ad={t.rolyef} deger={`${v.rolyefKm.toFixed(1)} km`} />
          </>
        )}
        {(ozellik ? b.ana && b.ana.ad !== ozellik.ad : true) && (
          <Satir ad={t.hangiBolge} deger={b.ana ? `${b.ana.ad}${b.ust ? ` · ${doldur(t.icindeBolge, { x: b.ust.ad })}` : ''}` : genelAd} />
        )}
      </Box>
      <Box>
        <Typography sx={etiket}>{t.donem}</Typography>
        <Typography sx={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>{donemMetni(b.donem, dil)}</Typography>
      </Box>
      <Box sx={{ display: 'grid', gap: 0.25 }}>
        <Typography sx={{ fontSize: 11.5, color: '#475569' }}>
          {t.yakinAday}: {yak.aday.oge.ad} ({yak.aday.km.toFixed(0)} {t.km})
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: '#475569' }}>
          {t.yakinInis}: {yak.inis.oge.ad} ({yak.inis.km.toFixed(0)} {t.km})
        </Typography>
      </Box>
      {v && <Typography sx={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.4 }}>{t.genelUyari}</Typography>}
      {!kompakt && yak.aday.km < 2500 && (
        <Button size="small" variant="outlined" onClick={() => onAdaSec?.(yak.aday.oge.id)} sx={{ textTransform: 'none', width: 'fit-content', color: '#0f172a', borderColor: 'rgba(15,23,42,0.3)' }}>
          {yak.aday.oge.ad}
        </Button>
      )}
    </>
  );
}
