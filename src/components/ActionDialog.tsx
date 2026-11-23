'use client';

import {useEffect, useRef, type KeyboardEvent, type ReactNode} from 'react';

export default function ActionDialog({labelledBy, onClose, children}: {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (dialog && !dialog.open) dialog.showModal?.();
    dialog?.querySelector<HTMLElement>('[data-dialog-focus]')?.focus();
    return () => {
      if (dialog?.open) dialog.close?.();
      trigger?.focus({preventScroll: true});
    };
  }, []);

  function keepFocusInside(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;
    event.preventDefault();

    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex]'
    )).filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length > 0);
    if (!focusable.length) return;

    const current = focusable.findIndex(element => element === document.activeElement);
    const direction = event.shiftKey ? -1 : 1;
    const next = current < 0
      ? (event.shiftKey ? focusable.length - 1 : 0)
      : (current + direction + focusable.length) % focusable.length;
    focusable[next].focus();
  }

  return (
    <dialog ref={ref} className="action-dialog" aria-labelledby={labelledBy}
      onKeyDown={keepFocusInside}
      onCancel={event => {event.preventDefault(); onClose();}}>
      {children}
    </dialog>
  );
}
