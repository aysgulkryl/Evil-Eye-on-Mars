import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from '../shims/Iconify';

import { ADAYLAR, VERI_KAYNAKLARI } from '../data/adaylar';
import { METINLER, doldur } from '../data/metinler';
import { raporOlustur, dosyaIndir } from '../utils/rapor';
import { kalibreGuvenlik, muhendislikIndeksi, spearman } from '../utils/guvenlikModeli';
import { yakinInisler } from '../utils/nokta';
import { tavizMetni as tavizMetniOlustur } from '../utils/taviz';
import {
  baskinAday,
  birinciAraliklari,
  egimDurumu,
  katkilar,
  kazananSeridi,
  kisitDurumu,
  paretoAdaylari,
  siralama,
  skorRengi,
  tavizAnalizi,
} from '../utils/mcda';

import type { Aday, Dil } from '../data/adaylar';
import type { Kisit } from '../utils/mcda';

type Props = {
  acik: boolean;
  onKapat: () => void;
  dil: Dil;
  adaylar: Aday[]; // etkin aday havuzu
  seciliId: string | null;
  onSec: (id: string) => void;
  onKarsilastir: (id: string) => void;
  agirlikG: number;
  agirlikA: number;
  kisit: Kisit;
};

const etiket = { color: '#94a3b8', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 } as const;
const DURUM_RENK = { ideal: '#10b981', dikkat: '#f59e0b', kritik: '#f43f5e' } as const;

function Kart({ baslik, children, vurgu }: { baslik: string; children: React.ReactNode; vurgu?: string }) {
  return (
    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.045)', border: `1px solid ${vurgu ?? 'rgba(255,255,255,0.09)'}`, display: 'grid', gap: 1.1 }}>
      <Typography sx={etiket}>{baslik}</Typography>
      {children}
    </Box>
  );
}

function Rozet({ metin, renk }: { metin: string; renk: string }) {
  return <Chip size="small" label={metin} sx={{ height: 22, fontWeight: 700, fontSize: 11, color: renk, bgcolor: `${renk}1f`, border: `1px solid ${renk}88` }} />;
}

function Cubuk({ ad, deger, renk }: { ad: string; deger: number; renk: string }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 12.5, color: '#cbd5e1' }}>{ad}</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{deger}</Typography>
      </Box>
      <Box sx={{ mt: 0.4, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.09)', overflow: 'hidden' }}>
        <Box sx={{ height: 1, width: `${deger}%`, bgcolor: renk, borderRadius: 3 }} />
      </Box>
    </Box>
  );
}

/** Seçilen bölge için ekranın ortasında açılan, profesyonelce hazırlanmış geniş analiz raporu. */
export default function AnalizModal({ acik, onKapat, dil, adaylar, seciliId, onSec, onKarsilastir, agirlikG, agirlikA, kisit }: Props) {
  const t = METINLER[dil];
  const m = t.analiz;
  const aday = adaylar.find((a) => a.id === seciliId) ?? adaylar[0];

  const v = useMemo(() => {
    const sira = siralama(adaylar, agirlikG, agirlikA, kisit);
    const s = sira.find((x) => x.aday.id === aday.id)!;
    const kazanan = sira.find((x) => !x.elendi) ?? null;
    const uygun = adaylar.filter((a) => (kisit.acik ? kisitDurumu(a, kisit).gecer : true));
    const kd = kisitDurumu(aday, kisit);
    const aralik = birinciAraliklari(aday, uygun);
    const baskin = baskinAday(aday, adaylar);
    const pareto = paretoAdaylari(adaylar);
    const yakin = yakinInisler(aday.enlem, aday.boylam);
    const kat = katkilar(aday, agirlikG, agirlikA);
    const verilen = ADAYLAR.filter((a) => a.veri === 'verilen');
    const rho = spearman(verilen.map((a) => muhendislikIndeksi(a.egim, a.kaya, a.rakim)), verilen.map((a) => a.guvenlik));

    // "neden iki kaydırıcı yetmez" için canlı sayılar (kısıtsız, tüm etkin havuz)
    const enIyiMin = adaylar.reduce((b, a) => (Math.min(a.guvenlik, a.astro) > Math.min(b.guvenlik, b.astro) ? a : b));
    const idealYakin = adaylar.reduce((b, a) => (Math.hypot(100 - a.guvenlik, 100 - a.astro) < Math.hypot(100 - b.guvenlik, 100 - b.astro) ? a : b));
    const dengeKazanan = siralama(adaylar, 50, 50)[0].aday;
    const serit = kazananSeridi(adaylar);
    const seritMetni = serit.map((p) => `${p.aday.ad.split(' ')[0]} %${p.baslangic.toFixed(0)}–%${p.bitis.toFixed(0)}`).join(', ');
    const kisitAcik = { acik: true, egim: kisit.egim, kaya: kisit.kaya };
    const n2 = adaylar.filter((a) => kisitDurumu(a, kisitAcik).gecer).length;
    const ornekElenen = adaylar.filter((a) => !kisitDurumu(a, kisitAcik).gecer).sort((x, y) => y.astro - x.astro)[0] ?? null;
    const tamHavuz = paretoAdaylari(ADAYLAR).map((a) => a.id);
    const dayanikli = tamHavuz.includes('jezero') && tamHavuz.includes('oxia');
    const taviz = tavizAnalizi(adaylar, agirlikG, agirlikA, kisit);
    return { sira, s, kazanan, uygun, kd, aralik, baskin, pareto, yakin, kat, rho, enIyiMin, idealYakin, dengeKazanan, seritMetni, n2, tamHavuz, dayanikli, taviz, ornekElenen };
  }, [adaylar, aday, agirlikG, agirlikA, kisit]);

  const renk = v.s.elendi ? '#94a3b8' : skorRengi(v.s.skor);
  const egimD = egimDurumu(aday.egim);
  const ind = muhendislikIndeksi(aday.egim, aday.kaya, aday.rakim);
  const kal = kalibreGuvenlik(aday.egim, aday.kaya, aday.rakim);

  const ozet = v.s.elendi
    ? doldur(m.noGoOzet, { ad: aday.ad, neden: v.s.ihlaller.map((i) => doldur(i.tip === 'egim' ? t.ihlalEgim : t.ihlalKaya, { d: i.deger, s: i.sinir })).join(', '), a: aday.astro })
    : v.kazanan?.aday.id === aday.id
      ? doldur(m.kazananOzet, { ad: aday.ad })
      : doldur(m.siraOzet, { ad: aday.ad, n: v.uygun.length, sira: v.s.sira, skor: v.s.skor.toFixed(1) });

  const dG = v.kazanan ? aday.guvenlik - v.kazanan.aday.guvenlik : 0;
  const dA = v.kazanan ? aday.astro - v.kazanan.aday.astro : 0;
  const dS = v.kazanan ? v.s.skor - v.kazanan.skor : 0;
  const isaret = (x: number) => `${x > 0 ? '+' : ''}${x % 1 === 0 ? x : x.toFixed(1)}`;

  const tavizCumlesi = tavizMetniOlustur(t, v.taviz);

  return (
    <Dialog
      open={acik}
      onClose={onKapat}
      maxWidth="lg"
      fullWidth
      scroll="paper"
      slotProps={{ paper: { sx: { bgcolor: '#0a0f1b', color: '#e5e7eb', backgroundImage: 'none', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3 } } }}
    >
      {/* başlık */}
      <Box sx={{ p: 2.25, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(135deg, rgba(201,91,66,0.22), rgba(10,15,27,0))' }}>
        <Box sx={{ flex: '1 1 260px' }}>
          <Typography sx={{ ...etiket, color: '#fca58f' }}>Evil Eye on Mars · {m.baslik}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{aday.ad}</Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>{m.alt}</Typography>
        </Box>
        <Autocomplete
          size="small"
          disableClearable
          value={aday}
          options={adaylar}
          getOptionLabel={(o) => o.ad}
          isOptionEqualToValue={(o, x) => o.id === x.id}
          onChange={(_e, x) => onSec(x.id)}
          noOptionsText={t.bulunamadi}
          sx={{ width: { xs: 1, sm: 280 } }}
          renderInput={(p) => (
            <TextField
              {...p}
              label={m.bolgeSec}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' } }, '& label': { color: '#94a3b8' }, '& .MuiSvgIcon-root': { color: '#94a3b8' } }}
            />
          )}
          slotProps={{ paper: { sx: { bgcolor: '#101726', color: '#e5e7eb', backgroundImage: 'none' } } }}
        />
        <IconButton onClick={onKapat} aria-label={t.kapat} sx={{ color: '#94a3b8' }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.25, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.7fr 1fr' }, gap: 2, overflowY: 'auto' }}>
        {/* ----------------------------------------------------------------- ana sütun */}
        <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
          <Kart baslik={m.ozet} vurgu={`${renk}88`}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center', minWidth: 84 }}>
                <Typography sx={{ fontSize: 34, fontWeight: 800, color: renk, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{v.s.elendi ? '✕' : v.s.skor.toFixed(1)}</Typography>
                <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{v.s.elendi ? t.noGo : `#${v.s.sira} / ${v.uygun.length}`}</Typography>
              </Box>
              <Typography sx={{ flex: '1 1 260px', fontSize: 14.5, lineHeight: 1.6, color: '#f1f5f9' }}>{ozet}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Rozet metin={aday.veri === 'taslak' ? `${t.veriBadge}: ${t.taslakRozet}` : `${t.veriBadge}: ${t.verilenRozet}`} renk={aday.veri === 'taslak' ? '#fcd34d' : '#6ee7b7'} />
              {v.baskin ? <Rozet metin={doldur(m.baskin, { x: v.baskin.ad.split(' ')[0] })} renk="#fda4af" /> : v.pareto.some((p) => p.id === aday.id) && <Rozet metin={m.paretoCephe} renk="#6ee7b7" />}
              {v.s.elendi ? <Rozet metin={t.noGo} renk="#f43f5e" /> : kisit.acik && <Rozet metin={m.gecer} renk="#10b981" />}
              <Rozet metin={aday.ozellik[dil]} renk="#cbd5e1" />
            </Box>
          </Kart>

          <Kart baslik={m.muhendislik}>
            <Box sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { ad: t.egim, deger: `${aday.egim.toFixed(1)}°`, esik: `≤ ${kisit.egim}°`, durum: aday.egim <= kisit.egim ? m.gecer : m.asar, ok: aday.egim <= kisit.egim, not: t.egimDurum[egimD], notRenk: DURUM_RENK[egimD] },
                { ad: t.kaya, deger: `%${aday.kaya}`, esik: `≤ %${kisit.kaya}`, durum: aday.kaya <= kisit.kaya ? m.gecer : m.asar, ok: aday.kaya <= kisit.kaya, not: '', notRenk: '#94a3b8' },
                { ad: t.rakim, deger: `${aday.rakim.toFixed(1)} km`, esik: '—', durum: '—', ok: true, not: t.rakimNotu, notRenk: '#94a3b8' },
              ].map((r, i) => (
                <Box key={r.ad} sx={{ display: 'grid', gridTemplateColumns: '1fr 0.9fr 0.8fr 0.9fr', alignItems: 'center', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none', bgcolor: i % 2 ? 'transparent' : 'rgba(255,255,255,0.025)' }}>
                  <Typography sx={{ p: 1, fontSize: 12.5, fontWeight: 700, color: '#e2e8f0' }}>{r.ad}</Typography>
                  <Typography sx={{ p: 1, fontSize: 13, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{r.deger}</Typography>
                  <Typography sx={{ p: 1, fontSize: 12, color: '#94a3b8' }}>{r.esik}</Typography>
                  <Typography sx={{ p: 1, fontSize: 12, fontWeight: 700, color: r.durum === '—' ? '#94a3b8' : r.ok ? '#10b981' : '#f43f5e' }}>{r.durum}</Typography>
                  {r.not && (
                    <Typography sx={{ gridColumn: '1 / -1', px: 1, pb: 0.75, mt: -0.5, fontSize: 11.5, color: r.notRenk }}>{r.not}</Typography>
                  )}
                </Box>
              ))}
            </Box>
            <Cubuk ad={`${t.guvenlik} (${aday.veri === 'taslak' ? t.taslakRozet : t.verilenRozet})`} deger={aday.guvenlik} renk={skorRengi(aday.guvenlik)} />
            <Cubuk ad={t.astro} deger={aday.astro} renk={skorRengi(aday.astro)} />
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
              {t.katki}: {v.kat.guvenlik.toFixed(1)} ({t.katkiGuvenlik}) + {v.kat.astro.toFixed(1)} ({t.katkiAstro}) = <b style={{ color: '#fff' }}>{(v.kat.guvenlik + v.kat.astro).toFixed(1)}</b>
            </Typography>
            <Box sx={{ p: 1.25, borderRadius: 1.5, bgcolor: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.28)' }}>
              <Typography sx={{ ...etiket, color: '#67e8f9', mb: 0.4 }}>{m.capraz}</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.55 }}>
                {m.indeks}: <b>{ind.toFixed(1)}</b> → {m.kalibre}: <b>{kal}</b> · {m.temel}: <b>{aday.guvenlik}</b>
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.5, mt: 0.5 }}>{doldur(m.caprazAciklama, { rho: v.rho.toFixed(2) })}</Typography>
            </Box>
          </Kart>

          <Kart baslik={m.astrobiyoloji}>
            <Box>
              <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>{t.paleo}</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{aday.ozellik[dil]}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              {aday.mineraller[dil].map((x) => (
                <Chip key={x} size="small" label={x} sx={{ bgcolor: 'rgba(201,91,66,0.18)', color: '#fca58f', border: '1px solid rgba(201,91,66,0.45)', fontWeight: 600 }} />
              ))}
            </Box>
            <Box>
              <Typography sx={{ fontSize: 11.5, color: '#94a3b8' }}>{m.gecmisBaslik}</Typography>
              <Typography sx={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.65 }}>{aday.gecmis[dil]}</Typography>
              <Typography sx={{ fontSize: 12.5, color: '#94a3b8', mt: 0.5 }}>
                {t.bolge}: {aday.bolge[dil]}
                {aday.misyon ? ` · ${t.gorev}: ${aday.misyon}` : ''}
              </Typography>
            </Box>
          </Kart>

          <Kart baslik={m.dengeBaslik}>
            <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>{m.dengeAciklama}</Typography>
            <Typography sx={{ fontSize: 13.5, color: '#f1f5f9', lineHeight: 1.55 }}>
              {m.kazanmaAraligi}: <b>{v.aralik.length === 0 ? m.kazanmaYok : v.aralik.map((r) => `%${r.baslangic.toFixed(1)}–%${r.bitis.toFixed(1)}`).join(', ')}</b>
            </Typography>
            {v.kazanan && v.kazanan.aday.id !== aday.id && !v.s.elendi ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, textAlign: 'center' }}>
                {[
                  [t.guvenlik, dG],
                  [t.astro, dA],
                  [m.bilesik, dS],
                ].map(([ad, x]) => (
                  <Box key={ad as string} sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Typography sx={{ fontSize: 11, color: '#94a3b8' }}>{ad as string}</Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: (x as number) >= 0 ? '#10b981' : '#fb7185', fontVariantNumeric: 'tabular-nums' }}>{isaret(x as number)}</Typography>
                  </Box>
                ))}
                <Typography sx={{ gridColumn: '1 / -1', fontSize: 11.5, color: '#94a3b8' }}>
                  {m.karsilastirma}: {v.kazanan.aday.ad}
                </Typography>
              </Box>
            ) : (
              !v.s.elendi && <Typography sx={{ fontSize: 12.5, color: '#6ee7b7' }}>{m.benKazananim}</Typography>
            )}
            <Typography sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.55 }}>{tavizCumlesi}</Typography>
            <Button size="small" variant="outlined" onClick={() => onKarsilastir(aday.id)} sx={{ width: 'fit-content', textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>
              {t.karsilastirDugme}
            </Button>
          </Kart>

          {(aday.gezegenKoruma || v.yakin.length > 0) && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: aday.gezegenKoruma && v.yakin.length > 0 ? '1fr 1fr' : '1fr' }, gap: 2 }}>
              {aday.gezegenKoruma && (
                <Kart baslik={m.koruma} vurgu="rgba(250,204,21,0.45)">
                  <Typography sx={{ fontSize: 12.5, color: '#e2e8f0', lineHeight: 1.6 }}>{m.korumaMetin}</Typography>
                </Kart>
              )}
              <Kart baslik={m.yakin}>
                {v.yakin.length === 0 ? (
                  <Typography sx={{ fontSize: 12.5, color: '#94a3b8' }}>{m.yakinYok}</Typography>
                ) : (
                  v.yakin.slice(0, 4).map((y) => (
                    <Typography key={y.oge.id} sx={{ fontSize: 12.5, color: '#e2e8f0' }}>
                      <b>{y.oge.ad}</b> · {y.oge.yil} · {y.km.toFixed(0)} {t.km}
                    </Typography>
                  ))
                )}
              </Kart>
            </Box>
          )}
        </Box>

        {/* ----------------------------------------------------------------- yan sütun: neden yetmez + veri */}
        <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
          <Kart baslik={m.neden} vurgu="rgba(201,91,66,0.55)">
            <Typography sx={{ fontSize: 12.5, color: '#f1f5f9', lineHeight: 1.65 }}>{m.nedenGiris}</Typography>
            <Box component="ol" sx={{ m: 0, pl: 2.25, display: 'grid', gap: 1 }}>
              {[
                doldur(m.nedenMadde1, { ad: v.enIyiMin.ad.split(' ')[0], m: Math.min(v.enIyiMin.guvenlik, v.enIyiMin.astro), ad2: v.idealYakin.ad.split(' ')[0], d: Math.hypot(100 - v.idealYakin.guvenlik, 100 - v.idealYakin.astro).toFixed(1) }),
                doldur(m.nedenMadde2, { ad: v.dengeKazanan.ad, serit: v.seritMetni }),
                doldur(m.nedenMadde3, { n1: adaylar.length, n2: v.n2, ornek: v.ornekElenen ? doldur(m.ornekElenen, { ad: v.ornekElenen.ad, a: v.ornekElenen.astro }) : '' }),
                m.nedenMadde4,
                m.nedenMadde5,
                v.dayanikli ? doldur(m.nedenMadde6, { n: ADAYLAR.length, pareto: v.tamHavuz.map((id) => ADAYLAR.find((a) => a.id === id)!.ad.split(' ')[0]).join(', ') }) : '',
              ]
                .filter(Boolean)
                .map((metin) => (
                  <Typography key={metin} component="li" sx={{ fontSize: 12.5, color: '#cbd5e1', lineHeight: 1.6, display: 'list-item' }}>
                    {metin}
                  </Typography>
                ))}
            </Box>
          </Kart>

          <Kart baslik={m.sinirlarBaslik}>
            <Typography sx={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.55 }}>{t.formul}</Typography>
            <Typography sx={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55 }}>{t.formulAcik}</Typography>
            <Typography sx={{ fontSize: 11.5, color: '#fcd34d', lineHeight: 1.55 }}>{t.sinirlar}</Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, listStyleType: 'disc' }}>
              {VERI_KAYNAKLARI.map((k) => (
                <Typography key={k.ad} component="li" sx={{ fontSize: 11.5, color: '#cbd5e1', lineHeight: 1.5, display: 'list-item' }}>
                  <a href={k.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7dd3fc' }}>{k.ad}</a> — {k.rol[dil]}
                </Typography>
              ))}
            </Box>
            <Typography sx={{ fontSize: 11.5, color: '#94a3b8', lineHeight: 1.55 }}>{m.gelecek}</Typography>
          </Kart>
        </Box>
      </Box>

      <Box sx={{ p: 1.75, display: 'flex', justifyContent: 'flex-end', gap: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => dosyaIndir(`ares-dss-${aday.id}-${dil}.md`, raporOlustur({ dil, aday, adaylar, agirlikG, agirlikA, kisit }))}
          startIcon={<Iconify icon="solar:download-minimalistic-bold" width={18} />}
          sx={{ textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          {m.markdown}
        </Button>
        <Button size="small" variant="contained" onClick={onKapat} sx={{ textTransform: 'none' }}>
          {m.kapat}
        </Button>
      </Box>
    </Dialog>
  );
}
