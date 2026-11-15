import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { etkinAgirlik, paretoAdaylari, skorRengi } from '../utils/mcda';

import type { Aday } from '../data/adaylar';

type Props = {
  adaylar: Aday[];
  skorlar: Record<string, number>;
  seciliId: string | null;
  agirlikG: number;
  agirlikA: number;
  birinciId: string;
  baslik: string;
  ipucu: string;
  guvenlikEtiket: string;
  astroEtiket: string;
  elenenIdler?: Set<string>;
  onSec: (id: string) => void;
};

const W = 280;
const H = 230;
const M = { sol: 34, ust: 12, sag: 14, alt: 32 };
const PW = W - M.sol - M.sag;
const PH = H - M.ust - M.alt;
const x = (g: number) => M.sol + (g / 100) * PW;
const y = (a: number) => M.ust + (1 - a / 100) * PH;

// Birbirine yakın noktaların etiketleri çakışmasın diye el ile yön verilir: [dx, dy, hizalama]
const ETIKET_YONU: Record<string, [number, number, 'start' | 'end' | 'middle']> = {
  jezero: [0, -11, 'middle'],
  gale: [9, 12, 'start'],
  eberswalde: [-5, 16, 'end'],
  mawrth: [0, -11, 'middle'],
  oxia: [-9, -6, 'end'],
  arcadia: [-9, 3, 'end'],
};

const kisa = (ad: string) => ad.split(' ')[0];

/** Güvenlik–astrobiyoloji ödünleşimi (trade-off): Pareto cephesi ve mevcut ağırlığın eşit-skor doğrusu. */
export default function DengeGrafigi({ adaylar, skorlar, seciliId, agirlikG, agirlikA, birinciId, baslik, ipucu, guvenlikEtiket, astroEtiket, elenenIdler, onSec }: Props) {
  const pareto = useMemo(
    () => paretoAdaylari(adaylar).sort((a, b) => a.guvenlik - b.guvenlik),
    [adaylar]
  );
  const paretoIdler = useMemo(() => new Set(pareto.map((p) => p.id)), [pareto]);

  // Mevcut ağırlıklarda 1. adayın geçtiği eşit-skor doğrusu: G·wG + A·wA = c·(wG+wA)
  const izoSkor = useMemo(() => {
    const e = etkinAgirlik(agirlikG, agirlikA);
    const birinci = adaylar.find((a) => a.id === birinciId);
    if (!birinci) return null;
    const toplam = e.wS + e.wA;
    const c = (birinci.guvenlik * e.wS + birinci.astro * e.wA) / toplam;
    const noktalar: string[] = [];
    for (let g = 0; g <= 100; g += 1) {
      const a = e.wA < 1e-9 ? NaN : (c * toplam - g * e.wS) / e.wA;
      if (a >= 0 && a <= 100) noktalar.push(`${x(g).toFixed(1)},${y(a).toFixed(1)}`);
    }
    if (e.wA < 1e-9) return `M${x(c)},${y(0)} L${x(c)},${y(100)}`;
    return noktalar.length > 1 ? `M${noktalar.join(' L')}` : null;
  }, [adaylar, agirlikG, agirlikA, birinciId]);

  const paretoYolu = pareto.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.guvenlik)},${y(p.astro)}`).join(' ');

  return (
    <Box>
      <Typography variant="overline" sx={{ color: '#475569', letterSpacing: 1, lineHeight: 1.4, display: 'block' }}>
        {baslik}
      </Typography>
      <Box component="svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={baslik} sx={{ width: '100%', height: 'auto', display: 'block', mt: 0.5 }}>
        {/* ızgara */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={x(v)} x2={x(v)} y1={M.ust} y2={M.ust + PH} stroke="rgba(15,23,42,0.07)" />
            <line x1={M.sol} x2={M.sol + PW} y1={y(v)} y2={y(v)} stroke="rgba(15,23,42,0.07)" />
            <text x={x(v)} y={H - 16} fill="#64748b" fontSize="9" textAnchor="middle">{v}</text>
            <text x={M.sol - 6} y={y(v) + 3} fill="#64748b" fontSize="9" textAnchor="end">{v}</text>
          </g>
        ))}
        <text x={M.sol + PW / 2} y={H - 3} fill="#475569" fontSize="10" textAnchor="middle">{guvenlikEtiket} →</text>
        <text transform={`translate(9 ${M.ust + PH / 2}) rotate(-90)`} fill="#475569" fontSize="10" textAnchor="middle">{astroEtiket} →</text>

        {/* mevcut ağırlığın eşit-skor doğrusu */}
        {izoSkor && <path d={izoSkor} fill="none" stroke="#0f172a" strokeOpacity="0.55" strokeDasharray="3 3" strokeWidth="1" />}
        {/* Pareto cephesi */}
        <path d={paretoYolu} fill="none" stroke="#10b981" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="5 3" />

        {adaylar.map((a) => {
          const skor = skorlar[a.id] ?? 0;
          const secili = a.id === seciliId;
          const [dx, dy, hiza] = ETIKET_YONU[a.id] || (a.guvenlik > 82 ? [-8, -7, 'end'] : [8, -7, 'start']);
          const etiketli = secili || paretoIdler.has(a.id);
          const elendi = elenenIdler?.has(a.id);
          return (
            <g key={a.id} onClick={() => onSec(a.id)} style={{ cursor: 'pointer' }}>
              <circle cx={x(a.guvenlik)} cy={y(a.astro)} r={secili ? 8 : 5.5} fill={skorRengi(skor)} fillOpacity={elendi ? 0.18 : paretoIdler.has(a.id) ? 1 : 0.5} stroke={secili ? '#0f172a' : paretoIdler.has(a.id) ? '#10b981' : 'rgba(15,23,42,0.35)'} strokeWidth={secili ? 2 : 1.2} />
              {etiketli && (
                <text x={x(a.guvenlik) + dx} y={y(a.astro) + dy} fill={secili ? '#0f172a' : '#334155'} fontSize="9.5" fontWeight={secili ? 700 : 500} textAnchor={hiza}>
                  {kisa(a.ad)}
                </text>
              )}
            </g>
          );
        })}
      </Box>
      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', lineHeight: 1.4 }}>
        {ipucu}
      </Typography>
    </Box>
  );
}
