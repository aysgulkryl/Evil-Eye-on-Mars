// Evil Eye on Mars hesaplama motoru doğrulaması: npx tsx tools/dogrula.mts
import { gunzipSync } from 'node:zlib';
import { existsSync, readFileSync } from 'node:fs';

import { ADAYLAR, VARSAYILAN_KISIT } from '../src/data/adaylar';
import { INISLER } from '../src/data/inisler';
import { spearman, muhendislikIndeksi } from '../src/utils/guvenlikModeli';
import * as M from '../src/utils/mcda';
import * as N from '../src/utils/nokta';
import { analogEslesme } from '../src/utils/analog';
import { ANALOG_GOZLEMLER } from '../src/data/analogGozlemler';
import { MEKE_VERILERI } from '../src/data/meke';
import { puanlayiciVita, vitaPuani, type VitaKriter, type KriterPuanlari } from '../src/data/vita';

let hata = 0;
const dogru = (ad: string, kosul: boolean, ayrinti = '') => {
  if (!kosul) hata += 1;
  console.log(kosul ? 'OK  ' : 'HATA', ad, ayrinti);
};
const yakin = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

const jezero = ADAYLAR.find((a) => a.id === 'jezero')!;
const ort = (jezero.guvenlik + jezero.astro) / 2;
dogru('50/50 bileşik skor = (G+A)/2', yakin(M.bilesikSkor(jezero, 50, 50), ort));
dogru('ağırlık ölçeğinden bağımsız (10/10 = 50/50)', yakin(M.bilesikSkor(jezero, 10, 10), ort));
dogru('Vita: Jezero rubrik puanı (biyolog) = 67', jezero.astro === 67 && jezero.astroKaynak === 'rubrik', String(jezero.astro));
dogru('0/0 → NaN yok', Number.isFinite(M.bilesikSkor(jezero, 0, 0)));
dogru('renk eşikleri', M.skorRengi(70) === '#10b981' && M.skorRengi(69.99) === '#f59e0b' && M.skorRengi(49.99) === '#f43f5e');
dogru('aday ve iniş sayısı', ADAYLAR.length === 16 && INISLER.length === 16);

const sira = M.siralama(ADAYLAR, 50, 50);
dogru('50/50 ilk üç', sira.slice(0, 3).map((s) => s.aday.id).join() === 'oxia,meridiani,jezero', sira.slice(0, 3).map((s) => s.aday.id).join());

const verilen = ADAYLAR.filter((a) => a.veri === 'verilen');
dogru('özgün 6: kazanan şeridi Arcadia→Oxia', M.kazananSeridi(verilen).map((p) => p.aday.id).join() === 'arcadia,oxia');
dogru('özgün 6: Pareto', M.paretoAdaylari(verilen).map((a) => a.id).sort().join() === 'arcadia,oxia');
dogru('16 aday: Pareto cephesi Oxia ve Hellas', M.paretoAdaylari(ADAYLAR).map((a) => a.id).sort().join() === 'hellas,oxia');

// şerit ↔ kaba kuvvet tutarlılığı (401 nokta)
const serit = M.kazananSeridi(ADAYLAR);
let yanlis = 0;
for (let p = 0; p <= 100; p += 0.25) {
  const kazanan = M.siralama(ADAYLAR, 100 - p, p)[0].aday.id;
  const idler = serit.filter((s) => p >= s.baslangic - 1e-9 && p <= s.bitis + 1e-9).map((s) => s.aday.id);
  if (!idler.includes(kazanan)) yanlis += 1;
}
dogru('kazanan şeridi kaba kuvvetle uyumlu', yanlis === 0, `(yanlış: ${yanlis})`);

const kisit = { acik: true, ...VARSAYILAN_KISIT };
const gecen = ADAYLAR.filter((a) => M.kisitDurumu(a, kisit).gecer).map((a) => a.id);
dogru('eğim No-Go: MOLA p90 ≤ 20° (MSL), 16 bölgenin hepsi geçer (Gale 16,2°)', ADAYLAR.every((a) => !M.kisitDurumu(a, kisit).ihlaller.some((i) => i.tip === 'egim')));
dogru('eğim No-Go MOLA bölgesel değeri kullanır', M.nogoEgim(ADAYLAR.find((a) => a.id === 'gale')!) === 16.16);
dogru('kısıt (eğim≤20°, kaya≤%10): 10 bölge geçer, Gale geçer, Mawrth elenir', gecen.length === 10 && gecen.includes('gale') && !gecen.includes('mawrth'), gecen.join());
const sk = M.siralama(ADAYLAR, 50, 50, kisit);
dogru('elenenler sonda ve sıra=0', sk.filter((s) => s.elendi).every((s) => s.sira === 0) && sk.slice(0, 8).every((s) => !s.elendi));

const idx = verilen.map((a) => muhendislikIndeksi(a.egim, a.kaya, a.rakim));
dogru('bağımsız indeks sıralaması = ekip puanları (Spearman 1)', yakin(spearman(idx, verilen.map((a) => a.guvenlik)), 1));

for (const a of ADAYLAR) {
  const k = M.vektordenKonum(...M.konumVektoru(a.enlem, a.boylam));
  if (!yakin(k.enlem, a.enlem, 1e-9) || !yakin(k.boylam, a.boylam, 1e-9)) dogru(`koordinat gidiş-dönüş ${a.id}`, false);
}
dogru('koordinat gidiş-dönüşü', true);
dogru('açısal mesafe 0° ve 90°', yakin(M.acisalMesafe(0, 0, 0, 0), 0, 1e-9) && yakin(M.acisalMesafe(0, 0, 0, 90), 90, 1e-9));

const yol = 'public/assets/mars-konumlama/mola-4ppd.bin.gz';
if (existsSync(yol)) {
  const g = gunzipSync(readFileSync(yol));
  const n = 1440 * 720;
  const grid = new Int16Array(n);
  for (let i = 0; i < n; i += 1) grid[i] = ((g[i] << 8) | g[n + i]) - 8500;
  const v = N.noktaVerisi(grid, 18.38, 77.58);
  dogru('MOLA: Jezero rakımı ≈ -2,6 km', Math.abs(v.rakimKm + 2.6) < 0.15, v.rakimKm.toFixed(2));
  dogru('MOLA: Olympus Mons ≈ +20 km', Math.abs(N.noktaVerisi(grid, 18.65, -133.8).rakimKm - 20) < 1.2);
  dogru('her iniş yeri ve aday bir bölgeye düşer', [...ADAYLAR, ...INISLER].every((o) => N.bolgeBul(o.enlem, o.boylam).ana !== null));
} else {
  console.log('(MOLA dosyası yok: önce `npm run varliklar` çalıştırın; bu denetimler atlandı)');
}
// Meke analog benzerlik hesabı (ağırlıklar burada yalnızca TEST girdisidir, gerçek ağırlıklar ekipten gelecek)
{
  const W = { kraterGolu: 30, sulfat: 30, klorur: 20, volkanik: 20, paleogol: 0, suKimyasi: 0 };
  const r1 = analogEslesme({ kraterGolu: 'evet', sulfat: 'evet', klorur: 'hayir', volkanik: 'belirsiz', paleogol: 'hayir', suKimyasi: null }, W);
  dogru('Meke analog: (30+30+10+0)/100 = %70', r1.yuzde !== null && yakin(r1.yuzde, 70));
  const r2 = analogEslesme({ kraterGolu: 'evet', sulfat: null, klorur: 'hayir', volkanik: 'belirsiz', paleogol: null, suKimyasi: null }, W);
  dogru('Meke analog: verisi olmayan özellik hesaba katılmaz', r2.yuzde !== null && yakin(r2.yuzde, (40 / 70) * 100) && yakin(r2.kapsam, 70));
  // Aralık (Hasan): r2 = krater Var(30), klorür Yok(20), volkanik Belirsiz(20); sülfat(30) boş. Toplam 100.
  dogru('Meke aralık: alt sınır = boşlar Yok (40/100 = %40)', r2.alt !== null && yakin(r2.alt, 40));
  dogru('Meke aralık: üst sınır = boşlar Var ((40+30)/100 = %70)', r2.ust !== null && yakin(r2.ust, 70));
  dogru('Meke aralık: veri tamken alt = üst = yüzde', r1.alt !== null && yakin(r1.alt, 70) && r1.ust !== null && yakin(r1.ust, 70));
  const r4 = analogEslesme({ kraterGolu: 'evet', sulfat: null, klorur: null, volkanik: null, paleogol: null, suKimyasi: null }, W);
  dogru('Meke analog: ağırlığın yarısından azı veriliyse (%30) yüzde yok, "yetersiz veri"', r4.yuzde === null && r4.durum === 'yetersiz-veri' && yakin(r4.kapsam, 30));
  const r5 = analogEslesme({ kraterGolu: 'evet', sulfat: null, klorur: null, volkanik: 'hayir', paleogol: null, suKimyasi: null }, W);
  dogru('Meke analog: tam %50 veriliyse yüzde hesaplanır (30/50 = %60)', r5.yuzde !== null && yakin(r5.kapsam, 50) && yakin(r5.yuzde, 60));
  const BOS_W = { kraterGolu: null, sulfat: null, klorur: null, volkanik: null, paleogol: null, suKimyasi: null };
  const r3 = analogEslesme({ kraterGolu: 'evet', sulfat: 'evet', klorur: 'evet', volkanik: 'evet', paleogol: 'evet', suKimyasi: 'evet' }, BOS_W);
  dogru('Meke analog: ağırlık yoksa yüzde uydurulmaz', r3.yuzde === null && r3.durum === 'agirlik-bekleniyor');
  // Gerçek veri: Hasan'ın tablosundaki elle hesaplanmış aralıklarla birebir (Meke_analog_tablo_ve_agirliklar.xlsx > Aralık hesabı)
  const HASAN: Record<string, [number, number, number] | 'yetersiz'> = {
    jezero: [75, 75, 100], oxia: [50, 20, 70], mawrth: [75, 35, 60], gale: [90, 90, 100], arcadia: 'yetersiz',
    eberswalde: [50, 50, 100], columbia: [75, 50, 75], holden: [50, 50, 100], nili: [60, 30, 70], meridiani: [90, 47.5, 57.5],
    aram: [65, 35, 70], deut: [50, 25, 75], hellas: [55, 20, 65], melas: [65, 35, 70], utopia: [65, 22.5, 57.5], amazonis: [50, 20, 70],
  };
  const uymayan = Object.entries(HASAN).filter(([id, h]) => {
    const r = analogEslesme(ANALOG_GOZLEMLER[id]);
    if (h === 'yetersiz') return r.durum !== 'yetersiz-veri';
    return !(yakin(r.kapsam, h[0]) && r.alt !== null && yakin(r.alt, h[1]) && r.ust !== null && yakin(r.ust, h[2]));
  });
  dogru('Meke analog: 16 bölgenin aralığı Hasan\'ın elle hesabıyla birebir', uymayan.length === 0, uymayan.map(([id]) => id).join());
  dogru('her adayın analog gözlem kaydı var', ADAYLAR.every((a) => a.id in ANALOG_GOZLEMLER));
  dogru('her adayın MOLA bölgesel değerleri var', ADAYLAR.every((a) => a.bolgeselEgimMedyan !== undefined && a.puruzluluk !== undefined));
  dogru('Meke: id\'ler benzersiz', new Set(MEKE_VERILERI.map((m) => m.id)).size === MEKE_VERILERI.length);
  dogru('Meke: bulunan her değerin kaynağı var', MEKE_VERILERI.every((m) => m.deger === null || m.kaynak !== null));
}

// Vita rubriği (ağırlıklar ve puanlar burada yalnızca TEST girdisidir)
{
  const K: VitaKriter[] = [20, 20, 20, 20, 20].map((w, i) => ({ id: `k${i + 1}`, ad: { tr: '', en: '' }, agirlik: w }));
  const tam: KriterPuanlari = [3, 3, 3, 3, 3];
  const yarim: KriterPuanlari = [3, 3, 0, 0, 3];
  dogru('Vita: hepsi 3 puan = 100', yakin(puanlayiciVita(tam, K).puan ?? -1, 100));
  dogru('Vita: (3+3+0+0+3)×20 / (3×100) = 60', yakin(puanlayiciVita(yarim, K).puan ?? -1, 60));
  const eksik1 = puanlayiciVita([3, null, 3, 0, 3], K);
  dogru('Vita: boş kriter 0 sayılmaz, hesaba katılmaz (9/12 = 75)', yakin(eksik1.puan ?? -1, 75) && eksik1.dolu === 4 && yakin(eksik1.kapsam, 80));
  const eksik2 = puanlayiciVita([3, null, null, 3, 3], K);
  dogru('Vita: 4/5 kriterden azı doluysa yetersiz veri', eksik2.puan === null && eksik2.dolu === 3);
  const v = vitaPuani('x', { x: { jeolog: tam, biyolog: yarim } }, K);
  dogru('Vita: iki puanlayıcının ortalaması ve farkı', yakin(v.puan ?? -1, 80) && yakin(v.fark ?? -1, 40));
  dogru('Vita: rubrik yokken uzman tahmini korunur', ADAYLAR.every((a) => a.astroKaynak === 'uzman' || a.astroKaynak === 'rubrik'));
}

console.log(hata === 0 ? '\nTüm doğrulamalar geçti' : `\n${hata} HATA`);
process.exit(hata === 0 ? 0 : 1);
