import {pesetaEquivalence} from '@/lib/pesetas';

export function socialPesetaEquivalence(priceCents: number) {
  return pesetaEquivalence(priceCents, true).replace(/^≈\s*/, 'aprox. ');
}
