'use client';

interface BrandSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export default function BrandSpinner({
  size = 'md',
  label = 'Cargando…',
  className = '',
}: BrandSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`brand-spinner ${className}`}
    >
      <div className={`brand-spinner-coin brand-spinner-${size}`} aria-hidden="true">
        <span className="brand-spinner-lp">lp</span>
        <span className="brand-spinner-arrow">↗</span>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
