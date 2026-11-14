import { doldur } from '../data/metinler';

import type { Metin } from '../data/metinler';
import type { Taviz } from './mcda';

/** Taviz göstergesinin cümlesi (sayfada ve analiz modalında aynı). */
export function tavizMetni(t: Metin, tv: Taviz): string {
  if (!tv.kazanan || !tv.referans) return t.tavizYok;
  if (tv.yon === 'ayni') return doldur(t.tavizAyni, { ad: tv.kazanan.ad });
  const oranG = tv.oran !== null ? doldur(t.tavizOranGuvenlik, { o: tv.oran.toFixed(1) }) : '';
  const oranB = tv.oran !== null ? doldur(t.tavizOranBilim, { o: tv.oran.toFixed(1) }) : '';
  return tv.yon === 'guvenlik'
    ? doldur(t.tavizGuvenlik, { ref: tv.referans.ad, g: tv.dGuvenlik, a: tv.dAstro, oran: oranG })
    : doldur(t.tavizBilim, { ref: tv.referans.ad, g: tv.dGuvenlik, a: tv.dAstro, oran: oranB });
}
