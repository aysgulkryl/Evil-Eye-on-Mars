import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { METINLER, doldur } from '../data/metinler';
import { baskinAday, birinciAraliklari, boylamMetni, egimDurumu, enlemMetni, katkilar, paretoAdaylari, skorRengi } from '../utils/mcda';

import { analogGozlemleri } from '../data/analogGozlemler';
import { ANALOG_OZELLIKLER, analogEslesme } from '../utils/analog';
import { vitaPuani } from '../data/vita';
import { mekeDegeri } from '../data/meke';
import { GOREV_ESIKLERI, esikKaynakli } from '../data/gorevEsikleri';

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
const etiket = { color: '#475569', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' } as const;

function Olcu({ ad, deger, birim, oran, renk }: { ad: string; deger: string; birim: string; oran: number; renk: string }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Typography sx={etiket}>{ad}</Typography>
        <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
          {deger} <span style={{ fontWeight: 400, color: '#475569', fontSize: 11 }}>{birim}</span>
        </Typography>
      </Box>
      <Box sx={{ mt: 0.5, height: 5, borderRadius: 3, bgcolor: 'rgba(15,23,42,0.08)', overflow: 'hidden' }}>
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
      <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(15,23,42,0.1)" strokeWidth="9" />
      <circle
        cx="50" cy="50" r={r} fill="none" stroke={renk} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${(skor / 100) * c} ${c}`} transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 300ms ease, stroke 300ms ease', filter: `drop-shadow(0 0 5px ${renk})` }}
      />
      <text x="50" y="55" textAnchor="middle" fill="#0f172a" fontSize="22" fontWeight="800" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {skor.toFixed(1)}
      </text>
    </Box>
  );
}

/** Seçili bölgenin telemetri kartı: koordinat, skorlar, EDL işareti, mineraller ve kararın "neden"i. */
export default function TelemetriKarti({ aday, adaylar, skor, sira, agirlikG, agirlikA, dil, elendi }: Props) {
  const t = METINLER[dil];
  const renk = elendi ? '#475569' : skorRengi(skor);
  const egim = egimDurumu(aday.egim);
  const k = katkilar(aday, agirlikG, agirlikA);
  const baskin = baskinAday(aday, adaylar);
  const parettoda = paretoAdaylari(adaylar).some((p) => p.id === aday.id);
  const aralik = birinciAraliklari(aday, adaylar);
  const KAYA_AZAMI = 20;
  const RAKIM_ARALIK = [-5, 0]; // km; yalnızca çubuk ölçeği için
  const gozlem = analogGozlemleri(aday.id);
  const meke = analogEslesme(gozlem);
  const vita = vitaPuani(aday.id);
  // %57,5 gibi yarım puanlar kaybolmasın: tam sayıysa ondalıksız, değilse tek ondalık (dile göre virgül/nokta)
  const yuzdeYaz = (x: number) => {
    const y = Math.round(x * 10) / 10;
    return Number.isInteger(y) ? String(y) : dil === 'tr' ? String(y).replace('.', ',') : String(y);
  };
  const vitaKaynak =
    aday.astroKaynak !== 'rubrik'
      ? t.vitaUzman
      : vita.jeolog?.puan != null && vita.biyolog?.puan != null
        ? doldur(t.vitaIkiPuanlayici, { f: (vita.fark ?? 0).toFixed(0) })
        : vita.biyolog?.puan != null
          ? t.vitaBiyolog
          : t.vitaJeolog;
  const mekeRef = ['ph', 'su_tuzlulugu', 'tuz_toleransi']
    .map((id) => mekeDegeri(id))
    .filter((m) => m && m.deger !== null)
    .map((m) => {
      const deger = dil === 'en' ? String(m!.deger).replace(/(\d),(\d)/g, '$1.$2') : String(m!.deger);
      const ad = t.mekeRefAd[m!.id as keyof typeof t.mekeRefAd] ?? m!.parametre;
      return `${ad}: ${deger}${m!.birim && m!.birim !== '—' ? ' ' + m!.birim : ''}`;
    });

  return (
    <Box sx={{ display: 'grid', gap: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <SkorHalkasi skor={skor} renk={renk} />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ ...etiket }}>{elendi ? t.noGo : `#${sira}`} · {t.skor}</Typography>
          <Typography variant="h6" sx={{ color: '#0f172a', lineHeight: 1.2, fontWeight: 800 }}>{aday.ad}</Typography>
          <Typography variant="caption" sx={{ color: '#334155', fontVariantNumeric: 'tabular-nums' }}>
            {enlemMetni(aday.enlem)} · {boylamMetni(aday.boylam)}
          </Typography>
        </Box>
      </Box>

      {/* güvenlik ve astrobiyoloji alt indeksleri + bileşik skora katkıları */}
      <Box sx={{ display: 'grid', gap: 0.75 }}>
        <Olcu ad={t.guvenlik} deger={String(aday.guvenlik)} birim="/100" oran={aday.guvenlik} renk={skorRengi(aday.guvenlik)} />
        <Olcu ad={t.astro} deger={String(aday.astro)} birim="/100" oran={aday.astro} renk={skorRengi(aday.astro)} />
        <Typography variant="caption" sx={{ color: '#475569' }}>
          {t.katki}: {k.guvenlik.toFixed(1)} ({t.katkiGuvenlik}) + {k.astro.toFixed(1)} ({t.katkiAstro}) = <b style={{ color: '#0f172a' }}>{skor.toFixed(1)}</b>
        </Typography>
        <Typography variant="caption" sx={{ color: aday.astroKaynak === 'rubrik' ? '#15803d' : '#b45309' }}>
          {t.astro}: {vitaKaynak}
        </Typography>
      </Box>

      {/* kararın dayanağı: baskınlık ve 1. olma aralığı */}
      <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(15,23,42,0.05)', display: 'grid', gap: 0.5 }}>
        {baskin ? (
          <Typography variant="caption" sx={{ color: '#be123c', lineHeight: 1.45 }}>
            ⚠ {doldur(t.baskinNotu, { x: baskin.ad })}
          </Typography>
        ) : (
          parettoda && (
            <Typography variant="caption" sx={{ color: '#047857', lineHeight: 1.45 }}>
              ✓ {t.paretoNotu}
            </Typography>
          )
        )}
        {!(baskin && aralik.length === 0) && (
        <Typography variant="caption" sx={{ color: '#334155', lineHeight: 1.45 }}>
          {aralik.length === 0
            ? t.birinciYok
            : aralik.map((r) => doldur(t.birinciAralik, { a: r.baslangic.toFixed(0), b: r.bitis.toFixed(0) })).join(' ')}
        </Typography>
        )}
      </Box>

      {/* Meke analog eşleşmesi: Dünya analoğu Meke Maarı ile uydudan gözlenebilen özellik benzerliği */}
      <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.25)', display: 'grid', gap: 0.75 }}>
        {meke.alt !== null && meke.ust !== null ? (
          <>
            {/* aralık: koyu çubuk = kesin (alt sınır), açık çubuk = boş özelliklerden gelen belirsizlik */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Typography sx={etiket}>{t.mekeBaslik}</Typography>
                <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                  {Math.abs(meke.alt - meke.ust) < 0.05 ? `%${yuzdeYaz(meke.alt)}` : `%${yuzdeYaz(meke.alt)}–${yuzdeYaz(meke.ust)}`}
                </Typography>
              </Box>
              <Box sx={{ mt: 0.5, height: 7, borderRadius: 3, bgcolor: 'rgba(15,23,42,0.08)', overflow: 'hidden', position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.min(100, meke.ust)}%`, bgcolor: 'rgba(2,132,199,0.3)' }} />
                <Box sx={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${Math.max(1, Math.min(100, meke.alt))}%`, bgcolor: '#0284c7' }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: meke.kapsam < 100 ? '#b45309' : '#475569' }}>
              {doldur(t.mekeKapsam, { k: meke.kapsam.toFixed(0) })}
              {meke.kapsam < 100 ? ` ${t.mekeAralikAciklama}` : ''}
            </Typography>
          </>
        ) : (
          <>
            <Typography sx={etiket}>{t.mekeBaslik}</Typography>
            <Typography variant="caption" sx={{ color: '#475569' }}>
              {meke.durum === 'agirlik-bekleniyor' ? t.mekeAgirlikBekleniyor : meke.durum === 'yetersiz-veri' ? doldur(t.mekeYetersiz, { k: meke.kapsam.toFixed(0) }) : t.mekeVeriBekleniyor}
            </Typography>
          </>
        )}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {ANALOG_OZELLIKLER.map((o) => {
            const d = gozlem[o];
            const stil =
              d === 'evet'
                ? { bgcolor: 'rgba(56,189,248,0.2)', color: '#0369a1', border: '1px solid rgba(56,189,248,0.5)' }
                : d === 'belirsiz'
                  ? { bgcolor: 'rgba(252,211,77,0.12)', color: '#b45309', border: '1px dashed rgba(252,211,77,0.5)' }
                  : d === 'hayir'
                    ? { bgcolor: 'transparent', color: '#64748b', border: '1px solid rgba(100,116,139,0.4)', textDecoration: 'line-through' }
                    : { bgcolor: 'transparent', color: '#64748b', border: '1px dashed rgba(100,116,139,0.4)' };
            return (
              <Chip
                key={o}
                size="small"
                label={d === null ? `${t.mekeOzellik[o]} · ${t.mekeEksik}` : t.mekeOzellik[o]}
                sx={{ ...stil, fontWeight: 600, fontSize: 11 }}
              />
            );
          })}
        </Box>
        {mekeRef.length > 0 && (
          <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
            {t.mekeReferans}: {mekeRef.join(' · ')}
          </Typography>
        )}
      </Box>


      <Box sx={{ height: 1, bgcolor: 'rgba(15,23,42,0.08)' }} />

      {/* mühendislik telemetrisi */}
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Olcu ad={t.egim} deger={aday.egim.toFixed(1)} birim="°" oran={(aday.egim / 15) * 100} renk={EGIM_RENK[egim]} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: -0.25 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: EGIM_RENK[egim], flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: EGIM_RENK[egim], fontWeight: 600 }}>
            {t.edl}: {t.egimDurum[egim]}
          </Typography>
        </Box>
        <Olcu ad={t.kaya} deger={String(aday.kaya)} birim="%" oran={(aday.kaya / KAYA_AZAMI) * 100} renk="#2563eb" />
        {!esikKaynakli(GOREV_ESIKLERI.kaya) && (
          <Typography variant="caption" sx={{ color: '#b45309', mt: -0.5 }}>{t.kayaKaynaksiz}</Typography>
        )}
        <Olcu ad={t.rakim} deger={aday.rakim.toFixed(1)} birim="km" oran={((aday.rakim - RAKIM_ARALIK[1]) / (RAKIM_ARALIK[0] - RAKIM_ARALIK[1])) * 100} renk="#7c3aed" />
        <Typography variant="caption" sx={{ color: '#64748b', mt: -0.5 }}>{t.rakimNotu}</Typography>
      </Box>

      <Box sx={{ height: 1, bgcolor: 'rgba(15,23,42,0.08)' }} />

      <Box>
        <Typography sx={etiket}>{t.paleo}</Typography>
        <Typography sx={{ color: '#0f172a', fontWeight: 600, fontSize: 14 }}>{aday.ozellik[dil]}</Typography>
      </Box>
      <Box>
        <Typography sx={{ ...etiket, mb: 0.5 }}>{t.mineraller}</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {aday.mineraller[dil].map((m) => (
            <Chip key={m} size="small" label={m} sx={{ bgcolor: 'rgba(37,99,235,0.18)', color: '#1d4ed8', border: '1px solid rgba(37,99,235,0.45)', fontWeight: 600 }} />
          ))}
        </Box>
      </Box>

      {aday.veri === 'taslak' && (
        <Typography variant="caption" sx={{ color: '#b45309', lineHeight: 1.45 }}>
          {t.veriBadge}: {t.taslakRozet}. {t.taslakIpucu}
        </Typography>
      )}

      {/* ayrıntılar: ilk bakışta gerekmeyen bilgiler katlanır */}
      <Box component="details" sx={{ '& summary': { cursor: 'pointer', ...etiket, listStyle: 'revert', mb: 1 } }}>
        <summary>{t.ayrintilar}</summary>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {/* bölgesel arazi: MOLA'dan ölçülen (iniş ölçeğindeki eğimden farklı, km ölçeğinde) */}
          {aday.bolgeselEgimMedyan !== undefined && (
            <Box sx={{ display: 'grid', gap: 0.5 }}>
              <Typography sx={etiket}>{t.araziBaslik}</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
                {[
                  { ad: t.araziEgimMedyan, deger: `${aday.bolgeselEgimMedyan.toFixed(2)}°` },
                  { ad: t.araziEgimDik, deger: aday.bolgeselEgimDik !== undefined ? `${aday.bolgeselEgimDik.toFixed(2)}°` : '—' },
                  { ad: t.araziPuruzluluk, deger: aday.puruzluluk !== undefined ? `${aday.puruzluluk} m` : '—' },
                ].map((s) => (
                  <Box key={s.ad} sx={{ p: 0.75, borderRadius: 1, bgcolor: 'rgba(15,23,42,0.04)' }}>
                    <Typography sx={{ color: '#475569', fontSize: 10, lineHeight: 1.3 }}>{s.ad}</Typography>
                    <Typography sx={{ color: '#0f172a', fontWeight: 700, fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{s.deger}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box>
            <Typography sx={etiket}>{t.bolge}</Typography>
            <Typography sx={{ color: '#0f172a', fontSize: 13, lineHeight: 1.45 }}>{aday.bolge[dil]}</Typography>
          </Box>
          <Box>
            <Typography sx={etiket}>{t.gecmis}</Typography>
            <Typography sx={{ color: '#334155', fontSize: 12, lineHeight: 1.55 }}>{aday.gecmis[dil]}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
