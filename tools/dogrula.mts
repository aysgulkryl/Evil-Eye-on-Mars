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
dogru('50/50 bileşik skor = (78+91)/2', yakin(M.bilesikSkor(jezero, 50, 50), 84.5));
dogru('ağırlık ölçeğinden bağımsız (10/10 = 50/50)', yakin(M.bilesikSkor(jezero, 10, 10), 84.5));
dogru('0/0 → NaN yok', Number.isFinite(M.bilesikSkor(jezero, 0, 0)));
dogru('renk eşikleri', M.skorRengi(70) === '#10b981' && M.skorRengi(69.99) === '#f59e0b' && M.skorRengi(49.99) === '#f43f5e');
dogru('aday ve iniş sayısı', ADAYLAR.length === 16 && INISLER.length === 16);

const sira = M.siralama(ADAYLAR, 50, 50);
dogru('50/50 ilk üç', sira.slice(0, 3).map((s) => s.aday.id).join() === 'jezero,oxia,utopia', sira.slice(0, 3).map((s) => s.aday.id).join());

const verilen = ADAYLAR.filter((a) => a.veri === 'verilen');
dogru('özgün 6: kazanan şeridi Arcadia→Oxia→Jezero', M.kazananSeridi(verilen).map((p) => p.aday.id).join() === 'arcadia,oxia,jezero');
dogru('özgün 6: Pareto', M.paretoAdaylari(verilen).map((a) => a.id).sort().join() === 'arcadia,jezero,oxia');
dogru('16 aday: Pareto cephesinde Jezero ve Oxia kalır', ['jezero', 'oxia'].every((id) => M.paretoAdaylari(ADAYLAR).some((a) => a.id === id)));

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
dogru('kısıt (eğim≤5°, kaya≤%10): 8 bölge geçer, Mawrth elenir', gecen.length === 8 && !gecen.includes('mawrth'), gecen.join());
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
  const W = { kraterGolu: 30, sulfat: 30, klorur: 20, volkanik: 20, paleogol: 0 };
  const r1 = analogEslesme({ kraterGolu: 'evet', sulfat: 'evet', klorur: 'hayir', volkanik: 'belirsiz', paleogol: 'hayir' }, W);
  dogru('Meke analog: (30+30+10+0)/100 = %70', r1.yuzde !== null && yakin(r1.yuzde, 70));
  const r2 = analogEslesme({ kraterGolu: 'evet', sulfat: null, klorur: 'hayir', volkanik: 'belirsiz', paleogol: null }, W);
  dogru('Meke analog: verisi olmayan özellik hesaba katılmaz', r2.yuzde !== null && yakin(r2.yuzde, (40 / 70) * 100) && yakin(r2.kapsam, 70));
  const r3 = analogEslesme({ kraterGolu: 'evet', sulfat: 'evet', klorur: 'evet', volkanik: 'evet', paleogol: 'evet' });
  dogru('Meke analog: ağırlık yoksa yüzde uydurulmaz', r3.yuzde === null && r3.durum === 'agirlik-bekleniyor');
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
