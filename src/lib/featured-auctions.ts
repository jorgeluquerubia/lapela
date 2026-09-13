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
  isExtended?: boolean;
};

/**
 * Determina de forma unívoca el resultado o estado de un artículo asociado a una edición.
 * - 'sold': vendido y confirmado.
 * - 'reserved': adjudicado, pendiente del flujo correspondiente (pago/entrega).
 * - 'expired': no adjudicado / venta no completada (aunque conserve pujas previas, ej: impago).
 * - 'withdrawn': retirado.
 * - 'available': en curso (o en prórroga anti-sniping si hay evidencia objetiva de ampliación respecto al cierre de la edición).
 *
 * El estado persistido en base de datos prevalece siempre sobre la inferencia temporal.
 * Una subasta terminada no se considera adjudicada únicamente por bid_count.
 */
export function getItemAuctionOutcome(
  listing: {
    status?: string;
    ends_at?: string | null;
    bid_count?: number;
    highest_bidder?: string | null;
  } | null | undefined,
  now: Date = new Date(),
  edition?: {
    reference_ends_at?: string | null;
    starts_at?: string | null;
  } | null
): AuctionItemOutcome {
  if (!listing) {
    return {
      status: 'unsold',
      label: 'Sin venta',
      detail: 'Artículo no disponible',
      isEnded: true,
    };
  }

  // 1. Estado persistido: withdrawn
  if (listing.status === 'withdrawn') {
    return {
      status: 'withdrawn',
      label: 'Retirado',
      detail: 'Retirado',
      isEnded: true,
    };
  }

  // 2. Estado persistido: sold
  if (listing.status === 'sold') {
    return {
      status: 'awarded',
      label: 'Vendido',
      detail: 'Vendido y confirmado',
      isEnded: true,
    };
  }

  // 3. Estado persistido: reserved (adjudicado, pendiente de pago / flujo correspondiente)
  if (listing.status === 'reserved') {
    return {
      status: 'awarded',
      label: 'Adjudicado',
      detail: 'Adjudicado, pendiente del flujo correspondiente',
      isEnded: true,
    };
  }

  // 4. Estado persistido: expired (no adjudicado o venta no completada, ej. ganador no paga)
  if (listing.status === 'expired') {
    const hasBids = (listing.bid_count || 0) > 0 || !!listing.highest_bidder;
    return {
      status: 'unsold',
      label: hasBids ? 'No adjudicado' : 'Sin venta',
      detail: hasBids ? 'No adjudicado / venta no completada' : 'Sin pujas suficientes',
      isEnded: true,
    };
  }

  // 5. Estado persistido: available
  const endsAtTime = listing.ends_at ? new Date(listing.ends_at).getTime() : 0;
  const isTimeRemaining = endsAtTime > now.getTime();

  if (listing.status === 'available') {
    if (isTimeRemaining) {
      // Evidencia real de prórroga anti-sniping:
      // Si la edición cuenta con reference_ends_at y el ends_at del artículo lo supera habiendo recibido pujas
      const isExtended = Boolean(
        edition?.reference_ends_at &&
        endsAtTime > new Date(edition.reference_ends_at).getTime() &&
        (listing.bid_count || 0) > 0
      );

      return {
        status: 'active',
        label: 'En curso',
        detail: isExtended ? 'En prórroga anti-sniping' : 'En curso',
        isEnded: false,
        isExtended,
      };
    }

    // Si ends_at ya venció pero aún no se ha ejecutado el proceso de cierre (lp_close_auctions),
    // el estado persistido manda: sigue en curso / pendiente de cierre, no adjudicado automáticamente.
    return {
      status: 'active',
      label: 'En curso',
      detail: 'Pendiente de cierre',
      isEnded: false,
      isExtended: false,
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
 * - Subasta activa (ends_at en el futuro respecto a now)
 * - ends_at debe ser posterior a starts_at de la edición (se rechaza si termina antes o al inicio de la edición)
 * - En el momento de la asociación, ends_at no puede superar el reference_ends_at de la edición.
 *   (Nota: La ampliación posterior por anti-sniping durante las pujas sí puede superar el cierre editorial).
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
  const endsAtTime = new Date(listing.ends_at).getTime();
  if (edition.starts_at && endsAtTime <= new Date(edition.starts_at).getTime()) {
    return { eligible: false, reason: 'La subasta debe finalizar después de la apertura de la edición.' };
  }
  if (edition.reference_ends_at && endsAtTime > new Date(edition.reference_ends_at).getTime()) {
    return { eligible: false, reason: 'El cierre previsto de la subasta no puede superar el cierre de referencia de la edición.' };
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
