// ===================================================================
//  Deterministisch husselen van antwoordopties
// ===================================================================
//  De 4 opties worden PER SESSIE (per spel) gehusseld, maar host én
//  álle telefoons moeten exact dezelfde volgorde zien. Daarom gebruiken
//  we een seed (opgeslagen in de games-tabel) + het vraagnummer als
//  invoer voor een deterministische pseudo-random shuffle.
//
//  Zo krijgt elk spel een andere volgorde, maar binnen één spel zien
//  alle schermen dezelfde A/B/C/D.
// ===================================================================

import { QUESTIONS } from './questions.js'

// Kleine, snelle seeded PRNG (mulberry32).
function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Geef de gehusselde opties voor één vraag terug.
 * @param {number} seed        - sessie-seed uit de games-tabel
 * @param {number} qIndex      - index van de vraag (0-based)
 * @returns {{ options: Array<{text:string, correct?:boolean, joke?:boolean, orig:number}>, correctIndex: number }}
 */
export function shuffledOptions(seed, qIndex) {
  const question = QUESTIONS[qIndex]
  const rng = mulberry32((seed || 1) + qIndex * 101 + 7)
  const arr = question.options.map((o, i) => ({ ...o, orig: i }))

  // Fisher-Yates met de seeded rng
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  const correctIndex = arr.findIndex((o) => o.correct)
  return { options: arr, correctIndex }
}

export const LETTERS = ['A', 'B', 'C', 'D']
