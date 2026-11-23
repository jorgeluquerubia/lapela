'use client';

import {useEffect, useRef, type ReactNode} from 'react';

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

  return (
    <dialog ref={ref} className="action-dialog" aria-labelledby={labelledBy}
      onCancel={event => {event.preventDefault(); onClose();}}>
      {children}
    </dialog>
  );
}
