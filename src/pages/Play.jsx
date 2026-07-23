import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../supabaseClient.js'
import { QUESTIONS, TOTAL_QUESTIONS } from '../questions.js'
import { shuffledOptions, LETTERS } from '../shuffle.js'
import { computePoints } from '../scoring.js'
import { Logo, Pill, LevelPill, Spinner } from '../components/Ui.jsx'

const LS_KEY = 'gcq:last' // onthoudt de sessie voor herverbinden na refresh/wegvallen

export default function Play() {
  const [searchParams] = useSearchParams()
  const [phase, setPhase] = useState('boot') // boot | join | in-game
  const [pin, setPin] = useState(searchParams.get('pin') || '')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [game, setGame] = useState(null)
  const [player, setPlayer] = useState(null)
  const [answers, setAnswers] = useState({}) // { [qi]: { choice, is_correct, points } }
  const [rank, setRank] = useState(null) // { pos, total, score }
  const [now, setNow] = useState(Date.now())

  const gameRef = useRef(null)
  gameRef.current = game

  // Tikkende klok voor de afteltimer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [])

  // ---- Herverbinden bij opstart (localStorage) ----
  useEffect(() => {
    if (!supabaseConfigured) return
    let saved = null
    try {
      saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null')
    } catch {
      saved = null
    }
    if (saved?.gameId && saved?.playerId) {
      resumeSession(saved)
    } else {
      setPhase('join')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function resumeSession(saved) {
    const { data: g } = await supabase.from('games').select('*').eq('id', saved.gameId).maybeSingle()
    const { data: p } = await supabase.from('players').select('*').eq('id', saved.playerId).maybeSingle()
    if (g && p && g.status !== 'ended') {
      setGame(g)
      setPlayer(p)
      setNickname(p.nickname)
      await loadMyAnswers(g.id, p.id)
      setPhase('in-game')
    } else if (g && p && g.status === 'ended') {
      // Spel al afgelopen -> toon eindoverzicht.
      setGame(g)
      setPlayer(p)
      await loadMyAnswers(g.id, p.id)
      setPhase('in-game')
    } else {
      localStorage.removeItem(LS_KEY)
      setPhase('join')
    }
  }

  async function loadMyAnswers(gameId, playerId) {
    const { data } = await supabase
      .from('answers')
      .select('question_index, choice, is_correct, points')
      .eq('game_id', gameId)
      .eq('player_id', playerId)
    const map = {}
    ;(data || []).forEach((a) => {
      map[a.question_index] = { choice: a.choice, is_correct: a.is_correct, points: a.points }
    })
    setAnswers(map)
  }

  // ---- Realtime: volg de games-rij (status/vraag) ----
  useEffect(() => {
    if (!game?.id) return
    const channel = supabase
      .channel(`play-${game.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` },
        (payload) => {
          const prev = gameRef.current
          setGame(payload.new)
          // Bij binnenkomst van een reveal: haal mijn rang op.
          if (payload.new.status === 'reveal' || payload.new.status === 'scoreboard') {
            refreshRank(payload.new.id)
          }
          if (payload.new.status === 'ended') {
            loadMyAnswers(payload.new.id, player?.id)
          }
          // Nieuwe vraag gestart -> niets extra's nodig; render volgt game.status.
          void prev
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, player?.id])

  async function refreshRank(gameId) {
    const { data } = await supabase
      .from('players')
      .select('id, score')
      .eq('game_id', gameId)
      .order('score', { ascending: false })
    if (!data) return
    const idx = data.findIndex((p) => p.id === player?.id)
    if (idx >= 0) setRank({ pos: idx + 1, total: data.length, score: data[idx].score })
  }

  // -------------------------- Join ----------------------------------
  async function join(e) {
    e?.preventDefault()
    setError('')
    const cleanPin = pin.trim()
    const cleanNick = nickname.trim().slice(0, 20)
    if (!/^\d{6}$/.test(cleanPin)) return setError('Vul een geldige 6-cijferige PIN in.')
    if (cleanNick.length < 2) return setError('Kies een bijnaam van minstens 2 tekens.')

    setBusy(true)
    const { data: g, error: gErr } = await supabase
      .from('games')
      .select('*')
      .eq('pin', cleanPin)
      .neq('status', 'ended')
      .maybeSingle()

    if (gErr || !g) {
      setBusy(false)
      return setError('Geen actief spel gevonden met deze PIN.')
    }

    // Bestaat deze bijnaam al in dit spel? -> herverbinden (score blijft behouden).
    const { data: existing } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', g.id)
      .eq('nickname', cleanNick)
      .maybeSingle()

    let me = existing
    if (!me) {
      const { data: created, error: cErr } = await supabase
        .from('players')
        .insert({ game_id: g.id, nickname: cleanNick })
        .select()
        .single()
      if (cErr) {
        // Race op unieke bijnaam -> haal bestaande op.
        const { data: again } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', g.id)
          .eq('nickname', cleanNick)
          .maybeSingle()
        me = again
      } else {
        me = created
      }
    }

    setBusy(false)
    if (!me) return setError('Kon niet deelnemen. Probeer een andere bijnaam.')

    localStorage.setItem(LS_KEY, JSON.stringify({ pin: cleanPin, gameId: g.id, playerId: me.id }))
    setGame(g)
    setPlayer(me)
    await loadMyAnswers(g.id, me.id)
    setPhase('in-game')
  }

  // ------------------------- Antwoorden -----------------------------
  async function submitAnswer(choiceIdx, correctIndex, durationSec, startedAt) {
    const qi = game.current_question
    if (answers[qi] != null) return // al beantwoord (vergrendeld)

    const elapsed = startedAt ? Date.now() - Date.parse(startedAt) : durationSec * 1000
    const isCorrect = choiceIdx === correctIndex
    const points = computePoints(isCorrect, elapsed, durationSec * 1000)
    const responseMs = Math.max(0, Math.min(elapsed, durationSec * 1000))

    // Lokaal direct vergrendelen (optimistic).
    setAnswers((prev) => ({ ...prev, [qi]: { choice: choiceIdx, is_correct: isCorrect, points } }))

    const { error: insErr } = await supabase.from('answers').insert({
      game_id: game.id,
      player_id: player.id,
      question_index: qi,
      choice: choiceIdx,
      is_correct: isCorrect,
      points,
      response_ms: responseMs,
    })

    // Alleen score bijtellen als de insert lukte (unieke constraint voorkomt dubbel).
    if (!insErr && points > 0) {
      await supabase.rpc('increment_score', { p_player: player.id, p_points: points })
    }
  }

  // ------------------------- Weergave -------------------------------
  if (!supabaseConfigured) return <ConfigError />
  if (phase === 'boot') {
    return (
      <div className="screen">
        <div className="center-col"><Spinner /></div>
      </div>
    )
  }

  // ---- JOIN-scherm ----
  if (phase === 'join') {
    return (
      <div className="screen">
        <Logo variant="black" className="corner-logo" />
        <div className="center-col">
          <Pill variant="yellow">VRIJMIBO &gt; AI-EDITIE</Pill>
          <h1 style={{ fontSize: 'clamp(2rem,9vw,3rem)', textAlign: 'center' }}>Doe mee!</h1>
          <p className="muted tc">AI-buzzword quiz. Kies bij elke term de juiste definitie.</p>

          <form className="stack full" onSubmit={join}>
            <div>
              <label className="lbl mono" style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>GAME-PIN</label>
              <input
                className="input input--pin"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <div>
              <label className="lbl mono" style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>BIJNAAM</label>
              <input
                className="input"
                maxLength={20}
                placeholder="Bijv. Sanne, DJ Robot…"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            {error && <p style={{ color: 'var(--maroon)', fontWeight: 600, margin: 0 }}>{error}</p>}
            <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={busy}>
              {busy ? 'BEZIG…' : 'MEEDOEN →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ==================== IN-GAME ====================
  const status = game.status
  const qi = game.current_question
  const question = QUESTIONS[qi]
  const { options, correctIndex } = shuffledOptions(game.seed, qi)
  const myAnswer = answers[qi]

  // ---- Wachten op start ----
  if (status === 'lobby') {
    return (
      <PlayerShell>
        <Pill variant="yellow">JE DOET MEE</Pill>
        <h1 className="tc">Hoi {player.nickname} 👋</h1>
        <div className="row"><Spinner /><span className="muted">Wachten tot de host start…</span></div>
      </PlayerShell>
    )
  }

  // ---- Vraag: 4 antwoordknoppen ----
  if (status === 'question') {
    const remaining =
      game.question_started_at
        ? Math.max(0, Math.ceil((Date.parse(game.question_started_at) + game.question_duration * 1000 - now) / 1000))
        : game.question_duration

    if (myAnswer != null) {
      return (
        <PlayerShell>
          <LevelPill level={question.level} />
          <h2 className="tc">{question.term}</h2>
          <div className="banner" style={{ background: 'var(--black)', color: 'var(--white)' }}>
            <div className="big">Vergrendeld ✓</div>
            <p className="muted" style={{ marginBottom: 0 }}>Wachten op de andere spelers…</p>
          </div>
        </PlayerShell>
      )
    }

    return (
      <div className="screen">
        <div className="center-col" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
          <div className="spread full">
            <LevelPill level={question.level} />
            <span className="progress-line mono">{qi + 1}/{TOTAL_QUESTIONS}</span>
            <span className="timer-ring" style={{ fontSize: '1.6rem', color: remaining <= 5 ? 'var(--orange)' : 'var(--black)' }}>{remaining}</span>
          </div>
          <h2 className="tc" style={{ fontSize: 'clamp(1.4rem,6vw,2rem)', margin: '6px 0 12px' }}>{question.term}</h2>
          <div className="answers-grid">
            {options.map((opt, i) => (
              <button
                key={i}
                className={`answer answer--${['a', 'b', 'c', 'd'][i]}`}
                onClick={() => submitAnswer(i, correctIndex, game.question_duration, game.question_started_at)}
              >
                <span className="badge">{LETTERS[i]}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ---- Reveal: goed/fout + eigen positie ----
  if (status === 'reveal') {
    const answered = myAnswer != null
    const good = answered && myAnswer.is_correct
    return (
      <PlayerShell>
        <LevelPill level={question.level} />
        <h2 className="tc">{question.term}</h2>
        {!answered ? (
          <div className="banner banner--bad">
            <div className="big">Geen antwoord ⏱</div>
            <p style={{ marginBottom: 0 }}>0 punten deze ronde.</p>
          </div>
        ) : (
          <div className={`banner ${good ? 'banner--good' : 'banner--bad'}`}>
            <div className="big">{good ? 'Goed! 🎉' : 'Helaas ❌'}</div>
            <p style={{ marginBottom: 0 }}>
              {good ? `+${myAnswer.points} punten` : 'Fout gekozen — 0 punten'}
            </p>
          </div>
        )}
        <div className="card full">
          <span className="pill pill--yellow">JUISTE ANTWOORD</span>
          <p style={{ fontWeight: 600, margin: '10px 0 0' }}>
            {LETTERS[correctIndex]}. {options[correctIndex].text}
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>{question.explanation}</p>
        </div>
        {rank && (
          <Pill>JE STAAT #{rank.pos} VAN {rank.total} · {rank.score} PT</Pill>
        )}
      </PlayerShell>
    )
  }

  // ---- Scoreboard: eigen positie, wachten op host ----
  if (status === 'scoreboard') {
    return (
      <PlayerShell>
        <Pill variant="yellow">TUSSENSTAND</Pill>
        {rank ? (
          <>
            <h1 className="tc" style={{ fontSize: 'clamp(2.4rem,10vw,3.6rem)' }}>#{rank.pos}</h1>
            <p className="muted tc">van {rank.total} spelers · {rank.score} punten</p>
          </>
        ) : (
          <Spinner />
        )}
        <p className="muted tc">Kijk naar de beamer 📺 — host klikt door naar de volgende vraag.</p>
      </PlayerShell>
    )
  }

  // ---- Eindscherm: volledige persoonlijke samenvatting ----
  if (status === 'ended') {
    const totalScore = Object.values(answers).reduce((s, a) => s + (a?.points || 0), 0)
    const correctCount = Object.values(answers).filter((a) => a?.is_correct).length
    return (
      <div className="screen">
        <Logo variant="black" className="corner-logo" />
        <div className="center-col" style={{ justifyContent: 'flex-start', paddingTop: 30, maxWidth: 640 }}>
          <Pill variant="yellow">EINDRESULTAAT</Pill>
          <h1 className="tc" style={{ fontSize: 'clamp(2rem,9vw,3rem)' }}>{player.nickname}</h1>
          <div className="card full tc" style={{ background: 'var(--black)', color: 'var(--white)' }}>
            <div className="mono muted">EINDSCORE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '3.2rem', color: 'var(--yellow)' }}>
              {totalScore}
            </div>
            <div className="mono">{correctCount} / {TOTAL_QUESTIONS} GOED</div>
          </div>

          <h2 style={{ alignSelf: 'flex-start', marginTop: 10 }}>Jouw antwoorden</h2>
          <div className="stack full">
            {QUESTIONS.map((q, i) => {
              const a = answers[i]
              const { options: opts, correctIndex: ci } = shuffledOptions(game.seed, i)
              const good = a?.is_correct
              return (
                <div key={i} className={`summary-item ${good ? '' : 'wrong'}`}>
                  <div className="spread">
                    <span className="q-term">{i + 1}. {q.term}</span>
                    <span className="mono" style={{ color: good ? 'var(--green)' : 'var(--maroon)', fontWeight: 700 }}>
                      {good ? `✓ +${a.points}` : '✗ 0'}
                    </span>
                  </div>
                  <div className="lbl">JOUW KEUZE</div>
                  <div>
                    {a != null
                      ? `${LETTERS[a.choice]}. ${opts[a.choice].text}`
                      : '— (niet op tijd geantwoord)'}
                  </div>
                  {!good && (
                    <>
                      <div className="lbl">JUISTE ANTWOORD</div>
                      <div style={{ fontWeight: 600 }}>{LETTERS[ci]}. {opts[ci].text}</div>
                    </>
                  )}
                  <div className="lbl">UITLEG</div>
                  <div className="muted">{q.explanation}</div>
                </div>
              )
            })}
          </div>
          <button
            className="btn btn--dark"
            style={{ marginTop: 16 }}
            onClick={() => {
              localStorage.removeItem(LS_KEY)
              window.location.href = '/'
            }}
          >
            OPNIEUW MEEDOEN →
          </button>
        </div>
      </div>
    )
  }

  return <PlayerShell><Spinner /></PlayerShell>
}

// Gedeelde mobiel-first wrapper voor de wacht-/feedbackschermen.
function PlayerShell({ children }) {
  return (
    <div className="screen">
      <Logo variant="black" className="corner-logo" />
      <div className="center-col">{children}</div>
    </div>
  )
}

function ConfigError() {
  return (
    <div className="screen">
      <div className="center-col">
        <Pill variant="yellow">CONFIGURATIE</Pill>
        <h1 className="tc">Even opzetten</h1>
        <p className="muted tc" style={{ maxWidth: 420 }}>
          De Supabase-sleutels zijn nog niet ingesteld. Zie de README (stap 3 en 4).
        </p>
      </div>
    </div>
  )
}
