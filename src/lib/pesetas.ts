/**
 * LP-FEAT-016 · Precios en euros con equivalencia en pesetas
 * Tipo de conversión oficial e irrevocable: 1 EUR = 166,386 ESP (31-12-1998)
 */

export const PESETAS_PER_EURO = 166.386;

export const PESETA_DISCLAIMER = 'Equivalencia histórica · El pago se realiza en euros';

/**
 * Convierte un importe en euros a la peseta entera más cercana.
 */
export function eurosToPesetas(euros: number): number {
  if (!Number.isFinite(euros) || euros <= 0) return 0;
  return Math.round(euros * PESETAS_PER_EURO);
}

/**
 * Convierte un importe en céntimos de euro a la peseta entera más cercana.
 */
export function centsToPesetas(cents: number): number {
  if (!Number.isFinite(cents) || cents <= 0) return 0;
  return Math.round((cents / 100) * PESETAS_PER_EURO);
}

/**
 * Formatea un número entero de pesetas con separador de miles español (ej. "12.479").
 */
export function formatPesetas(pesetas: number): string {
  const rounded = Math.max(0, Math.round(pesetas));
  return new Intl.NumberFormat('es-ES', {
    useGrouping: true,
    maximumFractionDigits: 0,
  }).format(rounded);
}

/**
 * Devuelve la cadena canónica de equivalencia secundaria:
 * "≈ 12.479 ptas."
 */
export function pesetaEquivalence(eurosOrCents: number, isCents = false): string {
  const pesetas = isCents ? centsToPesetas(eurosOrCents) : eurosToPesetas(eurosOrCents);
  return `≈ ${formatPesetas(pesetas)} ptas.`;
}

export type PesetaHelpEventType = 'peseta_help_view' | 'peseta_help_click';

/**
 * Registro de analítica ligera para interacciones con la ayuda contextual de equivalencia.
 */
export function trackPesetaHelp(event: PesetaHelpEventType, details: Record<string, unknown> = {}): void {
  if (typeof window === 'undefined') return;

  try {
    window.dispatchEvent(
      new CustomEvent('lp:peseta_help', {
        detail: {
          event,
          timestamp: Date.now(),
          ...details,
        },
      })
    );

    if (typeof (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag === 'function') {
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', event, details);
    }
  } catch {
    // Ignorar fallos de telemetría no bloqueantes
  }
}
