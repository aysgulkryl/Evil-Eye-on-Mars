import { memo } from 'react';
import type { RefObject } from 'react';

import Box from '@mui/material/Box';

import { INIS_RENKLERI } from '../data/inisler';
import { skorRengi } from '../utils/mcda';

import type { Aday } from '../data/adaylar';
import type { Inis } from '../data/inisler';
import type { Isaret, Sonda, AdayDurum } from './MarsKure';

type Props = {
  adaylar: Aday[];
  durum: Record<string, AdayDurum>;
  inisler: Inis[];
  adayGoster: boolean;
  inisGoster: boolean;
  secili: Isaret | null;
  sonda: Sonda | null;
  bakisIsaretiRef: RefObject<HTMLDivElement | null>;
  baslik: string;
  onTikla: (enlem: number, boylam: number) => void;
};

const yuzde = (enlem: number, boylam: number) => ({ left: `${((boylam + 180) / 360) * 100}%`, top: `${((90 - enlem) / 180) * 100}%` });

/** Aynı çalışmayı düz (eşdikdörtgen) renkli haritada gösterir; tıklanan noktayı incelemeye gönderir. */
function MiniHaritaBilesen({ adaylar, durum, inisler, adayGoster, inisGoster, secili, sonda, bakisIsaretiRef, baslik, onTikla }: Props) {
  return (
    <Box
      role="img"
      aria-label={baslik}
      title={baslik}
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const boylam = ((e.clientX - r.left) / r.width) * 360 - 180;
        const enlem = 90 - ((e.clientY - r.top) / r.height) * 180;
        onTikla(Math.max(-90, Math.min(90, enlem)), Math.max(-180, Math.min(180, boylam)));
      }}
      sx={{
        position: 'relative',
        width: 1,
        aspectRatio: '2 / 1',
        borderRadius: 1.5,
        overflow: 'hidden',
        cursor: 'crosshair',
        border: '1px solid rgba(255,255,255,0.28)',
        boxShadow: '0 4px 18px rgba(0,0,0,0.55)',
        backgroundImage: 'url(/assets/mars-konumlama/mars-mini.jpg)',
        backgroundSize: '100% 100%',
        backgroundColor: '#1a0f0c',
      }}
    >
      {/* enlem/boylam ızgarası */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '16.666% 33.333%' }} />

      {inisGoster &&
        inisler.map((o) => {
          const secildi = secili?.tip === 'inis' && secili.id === o.id;
          return (
            <Box
              key={o.id}
              sx={{
                position: 'absolute',
                ...yuzde(o.enlem, o.boylam),
                width: secildi ? 9 : 6,
                height: secildi ? 9 : 6,
                bgcolor: INIS_RENKLERI[o.durum],
                border: '1px solid rgba(0,0,0,0.6)',
                transform: 'translate(-50%, -50%) rotate(45deg)',
                pointerEvents: 'none',
              }}
            />
          );
        })}

      {adayGoster &&
        adaylar.map((a) => {
          const d = durum[a.id];
          const renk = d?.elendi ? '#94a3b8' : skorRengi(d?.skor ?? 0);
          const secildi = secili?.tip === 'aday' && secili.id === a.id;
          return (
            <Box
              key={a.id}
              sx={{
                position: 'absolute',
                ...yuzde(a.enlem, a.boylam),
                width: secildi ? 11 : 7,
                height: secildi ? 11 : 7,
                borderRadius: '50%',
                bgcolor: renk,
                border: secildi ? '2px solid #fff' : '1px solid rgba(0,0,0,0.65)',
                boxShadow: secildi ? `0 0 8px ${renk}` : 'none',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          );
        })}

      {sonda && (
        <Box
          sx={{ position: 'absolute', ...yuzde(sonda.enlem, sonda.boylam), width: 11, height: 11, borderRadius: '50%', border: '2px solid #22d3ee', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
        />
      )}

      {/* şu an küre üzerinde bakılan yer */}
      <Box ref={bakisIsaretiRef} sx={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', left: -9, top: -9, width: 18, height: 18, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.95)', boxShadow: '0 0 6px rgba(0,0,0,0.8)' }} />
        <Box sx={{ position: 'absolute', left: -1, top: -14, width: 2, height: 28, bgcolor: 'rgba(255,255,255,0.55)' }} />
        <Box sx={{ position: 'absolute', left: -14, top: -1, width: 28, height: 2, bgcolor: 'rgba(255,255,255,0.55)' }} />
      </Box>
    </Box>
  );
}

export default memo(MiniHaritaBilesen);
