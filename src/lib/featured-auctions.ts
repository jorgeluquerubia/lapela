export type TemporalStatus = 'upcoming' | 'active' | 'ended';

/**
 * Calcula el estado temporal de una edición editorial según la ventana horaria.
 * - 'upcoming': antes de starts_at (próximamente)
 * - 'active': entre starts_at y reference_ends_at (en curso)
 * - 'ended': tras reference_ends_at (finalizada)
 */
export function getEditionTemporalStatus(
  startsAt: string | Date,
  referenceEndsAt: string | Date,
  now: Date = new Date()
): TemporalStatus {
  const starts = new Date(startsAt).getTime();
  const ends = new Date(referenceEndsAt).getTime();
  const current = now.getTime();

  if (current < starts) return 'upcoming';
  if (current >= ends) return 'ended';
  return 'active';
}

/**
 * Genera una representación textual y accesible del tiempo restante hasta una fecha objetivo.
 * RNF-03: Alternativa textual accesible sin depender exclusivamente de animaciones.
 */
export function formatCountdown(targetDate: string | Date, now: Date = new Date()): string {
  const diffMs = new Date(targetDate).getTime() - now.getTime();
  if (diffMs <= 0) return 'Finalizada';

  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} ${days === 1 ? 'día' : 'días'}${hours > 0 ? ` y ${hours} ${hours === 1 ? 'hora' : 'horas'}` : ''}`;
  }
  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}${minutes > 0 ? ` y ${minutes} min` : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} min${seconds > 0 ? ` y ${seconds} s` : ''}`;
  }
  return `${seconds} s`;
}

export type AuctionItemOutcome = {
  status: 'active' | 'awarded' | 'unsold' | 'withdrawn';
  label: string;
  detail: string;
  isEnded: boolean;
};

/**
 * Determina de forma unívoca el resultado o estado de un artículo asociado a una edición.
 * AC-03, AC-04, AC-05: Reconoce 'reserved' y 'sold' como adjudicados, artículos en prórroga
 * anti-sniping como activos, y 'expired' o sin pujas como sin venta.
 */
export function getItemAuctionOutcome(
  listing: {
    status?: string;
    ends_at?: string | null;
    bid_count?: number;
    highest_bidder?: string | null;
  } | null | undefined,
  now: Date = new Date()
): AuctionItemOutcome {
  if (!listing) {
    return {
      status: 'unsold',
      label: 'Sin venta',
      detail: 'Artículo no disponible',
      isEnded: true,
    };
  }

  if (listing.status === 'withdrawn') {
    return {
      status: 'withdrawn',
      label: 'Retirado',
      detail: 'Retirado de la subasta',
      isEnded: true,
    };
  }

  const endsAtTime = listing.ends_at ? new Date(listing.ends_at).getTime() : 0;
  const isTimeRemaining = endsAtTime > now.getTime();

  if (listing.status === 'available' && isTimeRemaining) {
    return {
      status: 'active',
      label: 'En curso',
      detail: 'En prórroga anti-sniping',
      isEnded: false,
    };
  }

  const hasBids = (listing.bid_count || 0) > 0 || !!listing.highest_bidder;
  if (['reserved', 'sold'].includes(listing.status || '') || (!isTimeRemaining && hasBids)) {
    return {
      status: 'awarded',
      label: 'Adjudicado',
      detail: listing.status === 'sold' ? 'Vendido y confirmado' : 'Adjudicado al mejor postor',
      isEnded: true,
    };
  }

  return {
    status: 'unsold',
    label: 'Sin venta',
    detail: 'Sin pujas suficientes',
    isEnded: true,
  };
}

/**
 * Criterios de elegibilidad (AC-01, RN-01):
 * - Modalidad subasta
 * - Disponible
 * - Mismo entorno (sandbox/live)
 * - Subasta activa (ends_at en el futuro)
 */
export function validateAuctionEligibility(
  listing: {
    mode?: string;
    status?: string;
    environment?: string;
    ends_at?: string | null;
  } | null | undefined,
  edition: {
    environment?: string;
    reference_ends_at?: string;
    starts_at?: string;
  },
  now: Date = new Date()
): { eligible: boolean; reason?: string } {
  if (!listing) {
    return { eligible: false, reason: 'El artículo no existe.' };
  }
  if (listing.mode !== 'auction') {
    return { eligible: false, reason: 'Solo se pueden asociar artículos en modalidad de subasta.' };
  }
  if (listing.status !== 'available') {
    return { eligible: false, reason: 'El artículo debe estar disponible.' };
  }
  if (edition.environment && listing.environment !== edition.environment) {
    return { eligible: false, reason: 'El artículo no pertenece al mismo entorno de la edición.' };
  }
  if (!listing.ends_at || new Date(listing.ends_at).getTime() <= now.getTime()) {
    return { eligible: false, reason: 'No se pueden asociar subastas ya finalizadas.' };
  }

  return { eligible: true };
}

/**
 * Verifica si el usuario actual tiene permisos de operación para gestionar ediciones.
 * RNF-01, AC-06: Verificación de rol operativo explícito.
 */
export async function isOperatorUser(
  user: { id: string; email?: string | null } | null | undefined,
  db?: any
): Promise<boolean> {
  if (!user) return false;

  const configuredEmails = (process.env.OPERATOR_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (user.email && configuredEmails.includes(user.email.toLowerCase())) {
    return true;
  }

  const configuredIds = (process.env.OPERATOR_USER_IDS || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);
  if (configuredIds.includes(user.id)) {
    return true;
  }

  if (db && typeof db.from === 'function') {
    try {
      const { data } = await db
        .from('lp_operators')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) return true;
    } catch {
      // Si la tabla no está disponible o falla, depende de variables de entorno
    }
  }

  return false;
}
