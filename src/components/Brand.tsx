import Link from 'next/link';

export default function Brand(){
  return (
    <Link className="brand" href="/" aria-label="La Pela · Inicio">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 56 56" role="presentation">
          <circle className="brand-coin-shadow" cx="28" cy="29" r="22" />
          <circle className="brand-coin-face" cx="28" cy="27" r="22" />
          <circle className="brand-coin-ring" cx="28" cy="27" r="17.5" />
          <path className="brand-coin-spark" d="M28 12v4M28 38v4M13 27h4M39 27h4" />
          <text x="28" y="31.5" textAnchor="middle">lp</text>
          <text className="brand-coin-value" x="28" y="20.5" textAnchor="middle">1 P</text>
        </svg>
      </span>
      <span className="brand-wordmark">la pela<span className="brand-dot">.</span></span>
    </Link>
  );
}
