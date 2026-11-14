import { VERI_KAYNAKLARI } from '../data/adaylar';
import { METINLER, doldur } from '../data/metinler';
import { kalibreGuvenlik, muhendislikIndeksi } from './guvenlikModeli';
import { yakinInisler } from './nokta';
import {
  astroPayi,
  baskinAday,
  bilesikSkor,
  birinciAraliklari,
  etkinAgirlik,
  kazananSeridi,
  kisitDurumu,
  paretoAdaylari,
  siralama,
} from './mcda';

import type { Aday, Dil } from '../data/adaylar';
import type { Kisit } from './mcda';

type Girdi = { dil: Dil; aday: Aday; adaylar: Aday[]; agirlikG: number; agirlikA: number; kisit: Kisit; tarih?: Date };

/** Seçilen bölge için karar raporu (Markdown): tercih, değerlendirme, ödünleşim, gerekçe, sınırlar. */
export function raporOlustur({ dil, aday, adaylar, agirlikG, agirlikA, kisit, tarih = new Date() }: Girdi): string {
  const t = METINLER[dil];
  const tr = dil === 'tr';
  const e = etkinAgirlik(agirlikG, agirlikA);
  const sira = siralama(adaylar, agirlikG, agirlikA, kisit);
  const s = sira.find((x) => x.aday.id === aday.id)!;
  const kazanan = sira.find((x) => !x.elendi);
  const uygun = adaylar.filter((a) => (kisit.acik ? kisitDurumu(a, kisit).gecer : true));
  const aralik = birinciAraliklari(aday, uygun);
  const baskin = baskinAday(aday, adaylar);
  const pareto = paretoAdaylari(adaylar);
  const serit = kazananSeridi(adaylar);
  const kd = kisitDurumu(aday, kisit);
  const yakin = yakinInisler(aday.enlem, aday.boylam);

  const L: string[] = [];
  L.push(`# Evil Eye on Mars — ${aday.ad}`);
  L.push('');
  L.push(`${tr ? 'Tarih' : 'Date'}: ${tarih.toISOString().slice(0, 16).replace('T', ' ')} UTC`);
  L.push('');
  L.push(`## ${tr ? 'Karar özeti' : 'Decision summary'}`);
  if (s.elendi) {
    const neden = s.ihlaller.map((i) => doldur(i.tip === 'egim' ? t.ihlalEgim : t.ihlalKaya, { d: i.deger, s: i.sinir })).join(', ');
    L.push(doldur(t.analiz.noGoOzet, { ad: aday.ad, neden, a: aday.astro }));
  } else {
    L.push(doldur(t.analiz.siraOzet, { ad: aday.ad, n: uygun.length, sira: s.sira, skor: s.skor.toFixed(1) }));
  }
  if (kazanan) L.push(`${tr ? 'Mevcut tercihte önerilen bölge' : 'Recommended region under the current preference'}: **${kazanan.aday.ad}** (${kazanan.skor.toFixed(1)}).`);
  L.push('');
  L.push(`## ${tr ? 'Tercih' : 'Preference'}`);
  L.push(`- ${t.guvenlikEtiket}: **${agirlikG}%**`);
  L.push(`- ${t.astroEtiket}: **${agirlikA}%**`);
  L.push(`- ${tr ? 'Astrobiyoloji payı' : 'Astrobiology share'}: ${(astroPayi(agirlikG, agirlikA) * 100).toFixed(1)}%${e.sifir ? ` (${t.sifirAgirlik})` : ''}`);
  L.push(`- ${tr ? 'Mühendislik kısıtları' : 'Engineering constraints'}: ${kisit.acik ? `${tr ? 'açık' : 'on'} (${tr ? 'eğim' : 'slope'} ≤ ${kisit.egim}°, ${tr ? 'kaya' : 'rocks'} ≤ ${kisit.kaya}%)` : tr ? 'kapalı' : 'off'}`);
  L.push(`- ${tr ? 'Formül' : 'Formula'}: \`${t.formul}\``);
  L.push('');
  L.push(`## ${t.analiz.muhendislik}`);
  L.push(`| ${t.analiz.parametre} | ${t.analiz.deger} | ${t.analiz.esik} | ${t.analiz.sonuc} |`);
  L.push('|---|---|---|---|');
  L.push(`| ${t.egim} | ${aday.egim}° | ≤ ${kisit.egim}° | ${aday.egim <= kisit.egim ? t.analiz.gecer : t.analiz.asar} |`);
  L.push(`| ${t.kaya} | ${aday.kaya}% | ≤ ${kisit.kaya}% | ${aday.kaya <= kisit.kaya ? t.analiz.gecer : t.analiz.asar} |`);
  L.push(`| ${t.rakim} | ${aday.rakim} km | — | ${t.rakimNotu} |`);
  L.push(`| ${t.guvenlik} | ${aday.guvenlik}/100 | — | ${aday.veri === 'taslak' ? t.taslakRozet : t.verilenRozet} |`);
  L.push(`| ${t.astro} | ${aday.astro}/100 | — | |`);
  L.push(
    `| ${t.analiz.capraz} | ${muhendislikIndeksi(aday.egim, aday.kaya, aday.rakim).toFixed(1)} → ${kalibreGuvenlik(aday.egim, aday.kaya, aday.rakim)} | ${t.analiz.temel}: ${aday.guvenlik} | |`
  );
  L.push('');
  L.push(`${tr ? 'Kısıt durumu' : 'Constraint status'}: ${kd.gecer ? t.analiz.gecer : t.noGo}.`);
  L.push('');
  L.push(`## ${t.analiz.astrobiyoloji}`);
  L.push(`- ${t.paleo}: ${aday.ozellik[dil]}`);
  L.push(`- ${t.mineraller}: ${aday.mineraller[dil].join(', ')}`);
  L.push(`- ${t.bolge}: ${aday.bolge[dil]}`);
  L.push(`- ${t.gecmis}: ${aday.gecmis[dil]}`);
  if (aday.misyon) L.push(`- ${t.gorev}: ${aday.misyon}`);
  L.push('');
  L.push(`## ${t.analiz.dengeBaslik}`);
  L.push(
    `${t.analiz.kazanmaAraligi}: ${aralik.length === 0 ? t.analiz.kazanmaYok : aralik.map((r) => `${r.baslangic.toFixed(1)}%–${r.bitis.toFixed(1)}%`).join(', ')}`
  );
  if (baskin) L.push(`- ${doldur(t.baskinNotu, { x: baskin.ad })}`);
  else if (pareto.some((p) => p.id === aday.id)) L.push(`- ${t.paretoNotu}`);
  if (kazanan && kazanan.aday.id !== aday.id) {
    L.push(
      `- ${t.analiz.karsilastirma}: ${kazanan.aday.ad} — ${t.guvenlik} ${aday.guvenlik - kazanan.aday.guvenlik >= 0 ? '+' : ''}${aday.guvenlik - kazanan.aday.guvenlik}, ${t.astro} ${aday.astro - kazanan.aday.astro >= 0 ? '+' : ''}${aday.astro - kazanan.aday.astro}, ${t.analiz.bilesik} ${(bilesikSkor(aday, agirlikG, agirlikA) - kazanan.skor).toFixed(1)}`
    );
  }
  L.push('');
  L.push(`${tr ? 'Tercih ekseni boyunca 1. olan bölgeler' : 'Winner along the preference axis'}:`);
  serit.forEach((p) => L.push(`- ${p.baslangic.toFixed(1)}%–${p.bitis.toFixed(1)}%: **${p.aday.ad}**`));
  L.push('');
  if (aday.gezegenKoruma) {
    L.push(`## ${t.analiz.koruma}`);
    L.push(t.analiz.korumaMetin);
    L.push('');
  }
  L.push(`## ${t.analiz.yakin}`);
  if (yakin.length === 0) L.push(t.analiz.yakinYok);
  yakin.forEach((y) => L.push(`- ${y.oge.ad} (${y.oge.kurum}, ${y.oge.yil}) — ${y.km.toFixed(0)} ${t.km}: ${y.oge.not[dil]}`));
  L.push('');
  L.push(`## ${t.analiz.sinirlarBaslik}`);
  L.push(t.formulAcik);
  L.push(t.esikler);
  L.push('');
  L.push(`> ${t.sinirlar}`);
  L.push('');
  L.push(`## ${t.kaynaklar}`);
  VERI_KAYNAKLARI.forEach((k) => L.push(`- [${k.ad}](${k.url}) — ${k.rol[dil]}`));
  L.push('');
  return L.join('\n');
}

/** Metni dosya olarak indirir (tarayıcı). */
export function dosyaIndir(ad: string, icerik: string, tur = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([icerik], { type: tur }));
  const a = document.createElement('a');
  a.href = url;
  a.download = ad;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

