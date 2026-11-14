import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { METINLER, doldur } from '../data/metinler';
import { baskinAday, birinciAraliklari, boylamMetni, egimDurumu, enlemMetni, katkilar, paretoAdaylari, skorRengi } from '../utils/mcda';

import type { Aday, Dil } from '../data/adaylar';

type Props = {
  aday: Aday;
  adaylar: Aday[];
  skor: number;
  sira: number;
  agirlikG: number;
  agirlikA: number;
  dil: Dil;
  elendi?: boolean;
};

const EGIM_RENK = { ideal: '#10b981', dikkat: '#f59e0b', kritik: '#f43f5e' } as const;
const etiket = { color: '#94a3b8', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' } as const;

function Olcu({ ad, deger, birim, oran, renk }: { ad: string; deger: string; birim: string; oran: number; renk: string }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={etiket}>{ad}</Typography>
        <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>
          {deger} <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}>{birim}</span>
        </Typography>
      </Box>
      <Box sx={{ mt: 0.5, height: 5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <Box sx={{ height: 1, width: `${Math.max(2, Math.min(100, oran))}%`, bgcolor: renk, borderRadius: 3, transition: 'width 300ms ease' }} />
      </Box>
    </Box>
  );
}

function SkorHalkasi({ skor, renk }: { skor: number; renk: string }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <Box component="svg" viewBox="0 0 100 100" sx={{ width: 92, height: 92, flexShrink: 0 }} role="img" aria-label={`${skor.toFixed(1)} / 100`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="9" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={renk} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(skor / 100) * c} ${c}`} transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 300ms ease, stroke 300ms ease', filter: `drop-shadow(0 0 5px ${renk})` }}
      />
      <text x="50" y="55" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {skor.toFixed(1)}
      </text>
    </Box>
  );
}

/** Seçili bölgenin telemetri kartı: koordinat, skorlar, EDL işareti, mineraller ve kararın "neden"i. */
export default function TelemetriKarti({ aday, adaylar, skor, sira, agirlikG, agirlikA, dil, elendi }: Props) {
  const t = METINLER[dil];
  const renk = elendi ? '#94a3b8' : skorRengi(skor);
  const egim = egimDurumu(aday.egim);
  const k = katkilar(aday, agirlikG, agirlikA);
  const baskin = baskinAday(aday, adaylar);
  const parettoda = paretoAdaylari(adaylar).some((p) => p.id === aday.id);
  const aralik = birinciAraliklari(aday, adaylar);
  const KAYA_AZAMI = 20;
  const RAKIM_ARALIK = [-5, 0]; // km; yalnızca çubuk ölçeği için

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SkorHalkasi skor={skor} renk={renk} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...etiket }}>{elendi ? t.noGo : `#${sira}`} · {t.skor}</Typography>
          <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.2, fontWeight: 800 }}>{aday.ad}</Typography>
          <Typography variant="caption" sx={{ color: '#cbd5e1', fontVariantNumeric: 'tabular-nums' }}>
            {enlemMetni(aday.enlem)} · {boylamMetni(aday.boylam)}
          </Typography>
        </Box>
      </Box>

      {/* güvenlik ve astrobiyoloji alt indeksleri + bileşik skora katkıları */}
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Olcu ad={t.guvenlik} deger={String(aday.guvenlik)} birim="/100" oran={aday.guvenlik} renk={skorRengi(aday.guvenlik)} />
        <Olcu ad={t.astro} deger={String(aday.astro)} birim="/100" oran={aday.astro} renk={skorRengi(aday.astro)} />
        <Typography variant="caption" sx={{ color: '#94a3b8' }}>
          {t.katki}: {k.guvenlik.toFixed(1)} ({t.katkiGuvenlik}) + {k.astro.toFixed(1)} ({t.katkiAstro}) = <b style={{ color: '#fff' }}>{skor.toFixed(1)}</b>
        </Typography>
      </Box>

      <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />

      {/* mühendislik telemetrisi */}
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Olcu ad={t.egim} deger={aday.egim.toFixed(1)} birim="°" oran={(aday.egim / 15) * 100} renk={EGIM_RENK[egim]} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: -0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: EGIM_RENK[egim], flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: EGIM_RENK[egim], fontWeight: 600 }}>
            {t.edl}: {t.egimDurum[egim]}
          </Typography>
        </Box>
        <Olcu ad={t.kaya} deger={String(aday.kaya)} birim="%" oran={(aday.kaya / KAYA_AZAMI) * 100} renk="#60a5fa" />
        <Olcu ad={t.rakim} deger={aday.rakim.toFixed(1)} birim="km" oran={((aday.rakim - RAKIM_ARALIK[1]) / (RAKIM_ARALIK[0] - RAKIM_ARALIK[1])) * 100} renk="#a78bfa" />
        <Typography variant="caption" sx={{ color: '#7c8aa0', mt: -0.5 }}>{t.rakimNotu}</Typography>
      </Box>

      <Box sx={{ height: 1, bgcolor: 'rgba(255,255,255,0.08)' }} />

      <Box>
        <Typography sx={etiket}>{t.paleo}</Typography>
        <Typography sx={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{aday.ozellik[dil]}</Typography>
      </Box>
      <Box>
        <Typography sx={{ ...etiket, mb: 0.5 }}>{t.mineraller}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {aday.mineraller[dil].map((m) => (
            <Chip key={m} size="small" label={m} sx={{ bgcolor: 'rgba(201,91,66,0.18)', color: '#fca58f', border: '1px solid rgba(201,91,66,0.45)', fontWeight: 600 }} />
          ))}
        </Box>
      </Box>

      <Box>
        <Typography sx={etiket}>{t.bolge}</Typography>
        <Typography sx={{ color: '#f1f5f9', fontSize: 13, lineHeight: 1.45 }}>{aday.bolge[dil]}</Typography>
      </Box>
      <Box>
        <Typography sx={etiket}>{t.gecmis}</Typography>
        <Typography sx={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.55 }}>{aday.gecmis[dil]}</Typography>
      </Box>
      {aday.veri === 'taslak' && (
        <Typography variant="caption" sx={{ color: '#fcd34d', lineHeight: 1.45 }}>
          {t.veriBadge}: {t.taslakRozet}. {t.taslakIpucu}
        </Typography>
      )}

      {/* kararın dayanağı: baskınlık ve 1. olma aralığı */}
      <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.05)', display: 'grid', gap: 0.5 }}>
        {baskin ? (
          <Typography variant="caption" sx={{ color: '#fda4af', lineHeight: 1.45 }}>
            ⚠ {doldur(t.baskinNotu, { x: baskin.ad })}
          </Typography>
        ) : (
          parettoda && (
            <Typography variant="caption" sx={{ color: '#6ee7b7', lineHeight: 1.45 }}>
              ✓ {t.paretoNotu}
            </Typography>
          )
        )}
        <Typography variant="caption" sx={{ color: '#cbd5e1', lineHeight: 1.45 }}>
          {aralik.length === 0
            ? t.birinciYok
            : aralik.map((r) => doldur(t.birinciAralik, { a: r.baslangic.toFixed(0), b: r.bitis.toFixed(0) })).join(' ')}
        </Typography>
      </Box>
    </Box>
  );
}
