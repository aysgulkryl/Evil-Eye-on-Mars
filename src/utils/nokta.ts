import { BOLGELER, DONEM_ACIKLAMA } from '../data/bolgeler';
import { ADAYLAR } from '../data/adaylar';
import { INISLER } from '../data/inisler';
import { acisalMesafe, dereceKm, MARS_KM_DERECE } from './mcda';

import type { Bolge, Donem } from '../data/bolgeler';
import type { Aday } from '../data/adaylar';
import type { Inis } from '../data/inisler';

// ---------------------------------------------------------------- MOLA rakım ızgarası (4 piksel/derece, 1440×720)
// Kaynak: MGS MOLA MEGDR 16 ppd, 4×4 ortalama. Dosya bayt düzlemli (önce tüm yüksek baytlar, sonra düşük baytlar), gzip'li.
const MOLA_URL = '/assets/mars-konumlama/mola-4ppd.bin.gz';
const GW = 1440;
const GH = 720;
const OFSET = 8500;

let yukleme: Promise<Int16Array | null> | null = null;

/** Rakım ızgarasını (metre) ilk kullanımda yükler; tarayıcı desteklemiyorsa null döner. */
export function molaYukle(): Promise<Int16Array | null> {
  if (!yukleme) {
    yukleme = (async () => {
      try {
        const yanit = await fetch(MOLA_URL);
        if (!yanit.ok) return null;
        let u8 = new Uint8Array(await yanit.arrayBuffer());
        // Sunucu dosyayı kendisi açmış olabilir (Content-Encoding: gzip). gzip imzası (1f 8b) varsa biz açarız.
        if (u8[0] === 0x1f && u8[1] === 0x8b) {
          if (typeof DecompressionStream === 'undefined') return null;
          const acik = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'));
          u8 = new Uint8Array(await new Response(acik).arrayBuffer());
        }
        const n = GW * GH;
        if (u8.length < n * 2) return null;
        const grid = new Int16Array(n);
        for (let i = 0; i < n; i += 1) grid[i] = ((u8[i] << 8) | u8[n + i]) - OFSET;
        return grid;
      } catch {
        return null;
      }
    })().then((grid) => {
      if (!grid) yukleme = null; // başarısızsa sonraki tıklamada yeniden denensin
      return grid;
    });
  }
  return yukleme;
}

/** Çift doğrusal örnekleme: rakım (metre). Boylam −180…180 ya da 0…360 olabilir. */
export function rakimOrnekle(grid: Int16Array, enlem: number, boylam: number): number {
  const x = ((((boylam % 360) + 360) % 360) / 360) * GW - 0.5;
  const y = Math.max(0, Math.min(GH - 1, ((90 - enlem) / 180) * GH - 0.5));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const g = (xx: number, yy: number) => grid[Math.min(GH - 1, Math.max(0, yy)) * GW + (((xx % GW) + GW) % GW)];
  return (g(x0, y0) * (1 - fx) + g(x0 + 1, y0) * fx) * (1 - fy) + (g(x0, y0 + 1) * (1 - fx) + g(x0 + 1, y0 + 1) * fx) * fy;
}

export type YuzeyTipi = 'cokDuz' | 'duz' | 'egimli' | 'engebeli';

export type NoktaVerisi = {
  rakimKm: number;
  egim: number; // °, bölgesel (≈30 km taban)
  tabanKm: number;
  rolyefKm: number; // ±~45 km penceresinde en yüksek − en düşük rakım
  yuzey: YuzeyTipi;
};

/** Bir noktanın gerçek MOLA verisinden rakım, bölgesel eğim ve rölyef değerleri. */
export function noktaVerisi(grid: Int16Array, enlem: number, boylam: number): NoktaVerisi {
  const adim = 0.25; // °
  const cosLat = Math.max(0.05, Math.cos((enlem * Math.PI) / 180));
  const dxM = 2 * adim * MARS_KM_DERECE * cosLat * 1000;
  const dyM = 2 * adim * MARS_KM_DERECE * 1000;
  const dzx = rakimOrnekle(grid, enlem, boylam + adim / cosLat) - rakimOrnekle(grid, enlem, boylam - adim / cosLat);
  const dzy = rakimOrnekle(grid, Math.min(90, enlem + adim), boylam) - rakimOrnekle(grid, Math.max(-90, enlem - adim), boylam);
  const egim = (Math.atan(Math.hypot(dzx / dxM, dzy / dyM)) * 180) / Math.PI;
  let min = Infinity;
  let max = -Infinity;
  for (let i = -3; i <= 3; i += 1) {
    for (let j = -3; j <= 3; j += 1) {
      const z = rakimOrnekle(grid, Math.max(-90, Math.min(90, enlem + i * 0.25)), boylam + (j * 0.25) / cosLat);
      if (z < min) min = z;
      if (z > max) max = z;
    }
  }
  return {
    rakimKm: rakimOrnekle(grid, enlem, boylam) / 1000,
    egim,
    tabanKm: dyM / 1000,
    rolyefKm: (max - min) / 1000,
    yuzey: egim < 0.5 ? 'cokDuz' : egim < 1.5 ? 'duz' : egim < 4 ? 'egimli' : 'engebeli',
  };
}

// ---------------------------------------------------------------- bölge, dönem ve yakın görevler

export type BolgeSonucu = { ana: Bolge | null; ust: Bolge | null; donem: Donem };

/** Noktayı içeren en küçük bölge (ana) ve onu da içeren daha geniş bölge (üst). Hiçbiri yoksa rakıma göre genel sınıf. */
export function bolgeBul(enlem: number, boylam: number, rakimKm?: number): BolgeSonucu {
  const icinde = BOLGELER.filter((b) => acisalMesafe(enlem, boylam, b.enlem, b.boylam) <= b.yaricap).sort(
    (a, b) => a.yaricap - b.yaricap
  );
  const ana = icinde[0] ?? null;
  const ust = icinde[1] ?? null;
  let donem: Donem;
  if (ana) donem = ana.donem;
  else if (enlem < -55) donem = 'Noachian';
  else if (rakimKm !== undefined && rakimKm < -2.5 && enlem > -10) donem = 'Hesperian';
  else donem = 'Noachian';
  return { ana, ust, donem };
}

export const donemMetni = (donem: Donem, dil: 'tr' | 'en') => DONEM_ACIKLAMA[donem][dil];

export type Yakin<T> = { oge: T; km: number };

export function enYakinlar(enlem: number, boylam: number): { aday: Yakin<Aday>; inis: Yakin<Inis> } {
  const sec = <T extends { enlem: number; boylam: number }>(liste: T[]): Yakin<T> =>
    liste
      .map((oge) => ({ oge, km: dereceKm(acisalMesafe(enlem, boylam, oge.enlem, oge.boylam)) }))
      .sort((a, b) => a.km - b.km)[0];
  return { aday: sec(ADAYLAR), inis: sec(INISLER) };
}

/** Bir noktanın çevresindeki (varsayılan 800 km) iniş yerleri. */
export function yakinInisler(enlem: number, boylam: number, azamiKm = 800): Yakin<Inis>[] {
  return INISLER.map((oge) => ({ oge, km: dereceKm(acisalMesafe(enlem, boylam, oge.enlem, oge.boylam)) }))
    .filter((y) => y.km <= azamiKm)
    .sort((a, b) => a.km - b.km);
}
