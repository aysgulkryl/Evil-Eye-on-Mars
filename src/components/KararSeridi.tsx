import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { kazananSeridi } from '../utils/mcda';

import type { Aday } from '../data/adaylar';

// Aday kimlik renkleri (sütun/skor renginden ayrı: burada "kim" önemlidir, "ne kadar iyi" değil)
export const ADAY_RENKLERI: Record<string, string> = {
  jezero: '#22d3ee',
  oxia: '#a78bfa',
  mawrth: '#f472b6',
  gale: '#fb923c',
  arcadia: '#60a5fa',
  eberswalde: '#34d399',
};

type Props = {
  adaylar: Aday[];
  astroPay: number; // 0-100
  baslik: string;
  ipucu: string;
  guvenlikEtiket: string;
  astroEtiket: string;
  onPayDegis: (pay: number) => void;
};

const kisa = (ad: string) => ad.split(' ')[0];

/** Tercih ekseni (güvenlik → yaşam) boyunca kimin 1. olduğunu gösteren şerit. Tıklayınca kaydırıcıları o orana getirir. */
export default function KararSeridi({ adaylar, astroPay, baslik, ipucu, guvenlikEtiket, astroEtiket, onPayDegis }: Props) {
  const parcalar = useMemo(() => kazananSeridi(adaylar), [adaylar]);
  const ozet = parcalar
    .map((p) => `${kisa(p.aday.ad)} %${p.baslangic.toFixed(0)}–%${p.bitis.toFixed(0)}`)
    .join(', ');

  return (
    <Box>
      <Typography variant="overline" sx={{ color: '#94a3b8', letterSpacing: 1, lineHeight: 1.4, display: 'block' }}>
        {baslik}
      </Typography>

      <Box
        role="img"
        aria-label={`${baslik}: ${ozet}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          onPayDegis(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 100));
        }}
        sx={{ position: 'relative', mt: 0.75, height: 34, borderRadius: 1, overflow: 'hidden', display: 'flex', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {parcalar.map((p) => {
          const genislik = p.bitis - p.baslangic;
          const renk = ADAY_RENKLERI[p.aday.id] || '#94a3b8';
          return (
            <Box
              key={`${p.aday.id}-${p.baslangic}`}
              title={`${p.aday.ad}: %${p.baslangic.toFixed(1)} – %${p.bitis.toFixed(1)}`}
              sx={{
                width: `${genislik}%`,
                bgcolor: `${renk}33`,
                borderRight: '1px solid rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: renk,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                '&:last-of-type': { borderRight: 0 },
              }}
            >
              {genislik >= 14 ? kisa(p.aday.ad) : ''}
            </Box>
          );
        })}
        {/* mevcut tercih işaretçisi */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `calc(${astroPay}% - 1px)`,
            width: 2,
            bgcolor: '#fff',
            boxShadow: '0 0 8px rgba(255,255,255,0.9)',
            transition: 'left 120ms ease-out',
            pointerEvents: 'none',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, color: '#94a3b8', fontSize: 11 }}>
        <span>{guvenlikEtiket}</span>
        <span>{astroEtiket}</span>
      </Box>
      <Typography variant="caption" sx={{ color: '#7c8aa0', display: 'block', mt: 0.5, lineHeight: 1.4 }}>
        {ipucu}
      </Typography>
    </Box>
  );
}
