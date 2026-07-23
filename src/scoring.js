// ===================================================================
//  Scoring — Kahoot-achtig met snelheidsbonus
// ===================================================================
//  - Fout antwoord            -> 0 punten
//  - Geen antwoord (te laat)  -> 0 punten
//  - Goed antwoord            -> basispunten + snelheidsbonus
//
//  De formule schaalt LINEAIR af binnen de timer:
//     * direct antwoorden (t = 0)                -> MAX_POINTS (1000)
//     * antwoorden op de valreep (t = duur)      -> MIN_POINTS (500)
//
//     punten = MIN + (MAX - MIN) * (1 - t / duur)
//
//  waarbij t = reactietijd in ms, geklemd tussen 0 en de timerduur.
// ===================================================================

export const DEFAULT_DURATION_SEC = 20 // standaard afteltimer (instelbaar op hostscherm)
export const MAX_POINTS = 1000 // maximaal bij direct correct antwoord
export const MIN_POINTS = 500 // minimaal bij correct antwoord op de valreep

/**
 * Bereken de punten voor een antwoord.
 * @param {boolean} isCorrect  - was het antwoord juist?
 * @param {number} elapsedMs   - reactietijd sinds het tonen van de vraag (ms)
 * @param {number} durationMs  - totale beschikbare tijd voor de vraag (ms)
 * @returns {number} punten (geheel getal)
 */
export function computePoints(isCorrect, elapsedMs, durationMs) {
  if (!isCorrect) return 0
  const clamped = Math.max(0, Math.min(elapsedMs, durationMs))
  const speedFraction = 1 - clamped / durationMs // 1.0 bij t=0, 0.0 op de valreep
  return Math.round(MIN_POINTS + (MAX_POINTS - MIN_POINTS) * speedFraction)
}
