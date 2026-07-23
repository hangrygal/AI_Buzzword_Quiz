// ===================================================================
//  Kleine, herbruikbare UI-componenten in de Generation C-huisstijl
// ===================================================================

export function Logo({ variant = 'black', className = '' }) {
  // Op donkere achtergrond de witte mark, op lichte de zwarte (brandregel).
  const src = variant === 'white' ? '/logo/mark-white.svg' : '/logo/mark-black.svg'
  return <img src={src} alt="Generation C" className={className} draggable={false} />
}

export function Pill({ children, variant = '' }) {
  const cls = variant ? `pill pill--${variant}` : 'pill'
  return <span className={cls}>{children}</span>
}

export function LevelPill({ level }) {
  // PITTIG (oranje) of EXPERT (maroon)
  return <Pill variant={level === 'EXPERT' ? 'expert' : 'pittig'}>{level}</Pill>
}

export function Spinner() {
  return <div className="spinner" aria-label="Laden" />
}
