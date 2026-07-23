import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, supabaseConfigured } from '../supabaseClient.js'
import { QUESTIONS, TOTAL_QUESTIONS } from '../questions.js'
import { shuffledOptions, LETTERS } from '../shuffle.js'
import { DEFAULT_DURATION_SEC } from '../scoring.js'
import { Logo, Pill, LevelPill, Spinner } from '../components/Ui.jsx'

// Genereer een 6-cijferige PIN als string.
function makePin() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export default function Host() {
  const [game, setGame] = useState(null) // rij uit de games-tabel (lokaal, host is autoritatief)
  const [players, setPlayers] = useState([])
  const [answeredIds, setAnsweredIds] = useState(() => new Set())
  const [duration, setDuration] = useState(DEFAULT_DURATION_SEC)
  const [stats, setStats] = useState(null) // { counts:[n,n,n,n], total }
  const [leaderboard, setLeaderboard] = useState([])
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)

  const gameRef = useRef(null)
  gameRef.current = game

  // Tikkende klok voor de afteltimer
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200)
    return () => clearInterval(t)
  }, [])

  // ---- Realtime subscriptions (spelers die joinen + antwoorden) ----
  useEffect(() => {
    if (!game?.id) return
    const channel = supabase
      .channel(`host-${game.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` },
        (payload) => {
          setPlayers((prev) =>
            prev.some((p) => p.id === payload.new.id) ? prev : [...prev, payload.new]
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers', filter: `game_id=eq.${game.id}` },
        (payload) => {
          const g = gameRef.current
          if (g && payload.new.question_index === g.current_question) {
            setAnsweredIds((prev) => new Set(prev).add(payload.new.player_id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game?.id])

  const remainingMs = useMemo(() => {
    if (!game || game.status !== 'question' || !game.question_started_at) return 0
    const end = Date.parse(game.question_started_at) + game.question_duration * 1000
    return Math.max(0, end - now)
  }, [game, now])

  const remainingSec = Math.ceil(remainingMs / 1000)

  // Auto naar reveal wanneer de tijd op is of iedereen heeft geantwoord.
  useEffect(() => {
    if (!game || game.status !== 'question') return
    const everyoneAnswered = players.length > 0 && answeredIds.size >= players.length
    const timeUp = game.question_started_at && remainingMs <= 0
    if (everyoneAnswered || timeUp) {
      goReveal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingMs, answeredIds, players.length, game?.status])

  // -------------------------- Acties --------------------------------
  async function createGame() {
    setBusy(true)
    // Probeer een unieke PIN (kleine kans op botsing; retry max 5x).
    let created = null
    for (let i = 0; i < 5 && !created; i++) {
      const pin = makePin()
      const seed = Math.floor(Math.random() * 2_000_000_000)
      const { data, error } = await supabase
        .from('games')
        .insert({
          pin,
          seed,
          status: 'lobby',
          current_question: 0,
          question_duration: duration,
        })
        .select()
        .single()
      if (!error) created = data
      else if (error.code !== '23505') {
        // 23505 = unique_violation (PIN al in gebruik) -> opnieuw proberen
        console.error(error)
        break
      }
    }
    setBusy(false)
    if (created) {
      setGame(created)
      setPlayers([])
    } else {
      alert('Kon geen spel aanmaken. Check je Supabase-verbinding (zie console).')
    }
  }

  async function patchGame(patch) {
    const { data, error } = await supabase
      .from('games')
      .update(patch)
      .eq('id', game.id)
      .select()
      .single()
    if (error) {
      console.error(error)
      return
    }
    setGame(data)
    return data
  }

  async function startGame() {
    setAnsweredIds(new Set())
    await patchGame({
      status: 'question',
      current_question: 0,
      question_started_at: new Date().toISOString(),
      question_duration: duration,
    })
  }

  async function goReveal() {
    // Haal alle antwoorden voor deze vraag op en tel per keuze.
    const qi = game.current_question
    const { data } = await supabase
      .from('answers')
      .select('choice')
      .eq('game_id', game.id)
      .eq('question_index', qi)
    const counts = [0, 0, 0, 0]
    ;(data || []).forEach((a) => {
      if (a.choice >= 0 && a.choice < 4) counts[a.choice]++
    })
    setStats({ counts, total: (data || []).length })
    await patchGame({ status: 'reveal' })
  }

  async function goScoreboard() {
    await refreshLeaderboard()
    await patchGame({ status: 'scoreboard' })
  }

  async function refreshLeaderboard() {
    const { data } = await supabase
      .from('players')
      .select('id, nickname, score')
      .eq('game_id', game.id)
      .order('score', { ascending: false })
    setLeaderboard(data || [])
    return data || []
  }

  async function nextQuestion() {
    const next = game.current_question + 1
    if (next < TOTAL_QUESTIONS) {
      setAnsweredIds(new Set())
      setStats(null)
      await patchGame({
        status: 'question',
        current_question: next,
        question_started_at: new Date().toISOString(),
        question_duration: duration,
      })
    } else {
      await refreshLeaderboard()
      await patchGame({ status: 'ended' })
    }
  }

  // ------------------------- Weergave -------------------------------
  if (!supabaseConfigured) {
    return <ConfigError />
  }

  if (!game) {
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col">
          <Pill variant="yellow">VRIJMIBO &gt; AI-EDITIE</Pill>
          <h1 style={{ fontSize: 'clamp(2.4rem,7vw,4.5rem)', textAlign: 'center' }}>
            AI-Buzzword Quiz
          </h1>
          <p className="muted tc" style={{ maxWidth: 460 }}>
            Structure from the scattered. 15 vragen, oplopend in moeilijkheid.
            Start het spel en laat iedereen inloggen met hun telefoon.
          </p>

          <div className="card full" style={{ maxWidth: 420 }}>
            <label className="lbl mono" style={{ display: 'block', marginBottom: 8, opacity: 0.7 }}>
              TIJD PER VRAAG (SECONDEN)
            </label>
            <div className="row">
              <input
                type="number"
                min={5}
                max={120}
                className="input"
                value={duration}
                onChange={(e) => setDuration(Math.max(5, Math.min(120, Number(e.target.value) || DEFAULT_DURATION_SEC)))}
              />
              <span className="mono muted">sec</span>
            </div>
          </div>

          <button className="btn btn--primary btn--lg" onClick={createGame} disabled={busy}>
            {busy ? 'BEZIG…' : 'SPEL AANMAKEN →'}
          </button>
        </div>
      </div>
    )
  }

  const joinUrl = `${window.location.origin}/?pin=${game.pin}`

  // ---- LOBBY ----
  if (game.status === 'lobby') {
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col" style={{ maxWidth: 900 }}>
          <Pill variant="yellow">VRIJMIBO &gt; AI-EDITIE</Pill>
          <h1 style={{ fontSize: 'clamp(1.6rem,4vw,2.6rem)' }}>Doe mee op je telefoon</h1>

          <div className="row" style={{ gap: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="stack tc">
              <span className="mono muted">GA NAAR</span>
              <div className="mono" style={{ fontSize: '1.4rem' }}>
                {window.location.host}
              </div>
              <span className="mono muted" style={{ marginTop: 12 }}>GAME-PIN</span>
              <div className="pin-display">{game.pin}</div>
            </div>
            <div className="qr-box">
              <QRCodeSVG value={joinUrl} size={230} bgColor="#ffffff" fgColor="#232323" />
            </div>
          </div>

          <div className="spread full" style={{ maxWidth: 720, marginTop: 10 }}>
            <span className="mono">
              DEELNEMERS <span className="count-badge" style={{ color: 'var(--yellow)' }}>{players.length}</span>
            </span>
            <button
              className="btn btn--primary btn--lg"
              onClick={startGame}
              disabled={players.length === 0}
            >
              START →
            </button>
          </div>

          <div className="chips">
            {players.map((p) => (
              <span className="chip" key={p.id}>{p.nickname}</span>
            ))}
            {players.length === 0 && <span className="muted">Wachten op deelnemers…</span>}
          </div>
        </div>
      </div>
    )
  }

  const qi = game.current_question
  const question = QUESTIONS[qi]
  const { options, correctIndex } = shuffledOptions(game.seed, qi)

  // ---- VRAAG ----
  if (game.status === 'question') {
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col" style={{ maxWidth: 1000, justifyContent: 'flex-start', paddingTop: 40 }}>
          <div className="spread full">
            <LevelPill level={question.level} />
            <span className="progress-line mono">VRAAG {qi + 1} / {TOTAL_QUESTIONS}</span>
            <span className="timer-ring" style={{ color: remainingSec <= 5 ? 'var(--orange)' : 'var(--yellow)' }}>
              {remainingSec}
            </span>
          </div>

          <h1 className="big-term tc" style={{ margin: '24px 0' }}>{question.term}</h1>

          <div className="host-answers">
            {options.map((opt, i) => (
              <div key={i} className={`host-answer answer--${['a', 'b', 'c', 'd'][i]}`}>
                <span className="badge">{LETTERS[i]}</span>
                <span>{opt.text}</span>
              </div>
            ))}
          </div>

          <div className="spread full" style={{ marginTop: 24 }}>
            <span className="mono">
              GEANTWOORD <span className="count-badge" style={{ color: 'var(--yellow)' }}>{answeredIds.size}</span>
              <span className="muted"> / {players.length}</span>
            </span>
            <button className="btn btn--ghost" style={{ color: 'var(--white)' }} onClick={goReveal}>
              TOON ANTWOORD →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- REVEAL (juist antwoord + uitleg + percentages) ----
  if (game.status === 'reveal') {
    const total = stats?.total || 0
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col" style={{ maxWidth: 1000, justifyContent: 'flex-start', paddingTop: 40 }}>
          <div className="spread full">
            <LevelPill level={question.level} />
            <span className="progress-line mono">VRAAG {qi + 1} / {TOTAL_QUESTIONS}</span>
          </div>

          <h1 className="big-term tc" style={{ margin: '18px 0' }}>{question.term}</h1>

          <div className="host-answers">
            {options.map((opt, i) => {
              const isCorrect = i === correctIndex
              const c = stats?.counts?.[i] || 0
              const pct = total ? Math.round((c / total) * 100) : 0
              return (
                <div
                  key={i}
                  className={`host-answer answer--${['a', 'b', 'c', 'd'][i]} ${isCorrect ? 'is-correct' : 'is-wrong'}`}
                >
                  <span className="badge">{LETTERS[i]}</span>
                  <span>{opt.text}</span>
                  <span className="pct">{isCorrect ? '✓ ' : ''}{pct}%</span>
                </div>
              )
            })}
          </div>

          <div className="card full" style={{ marginTop: 20, background: 'var(--yellow)', color: 'var(--black)' }}>
            <span className="pill" style={{ background: 'var(--black)', color: 'var(--white)' }}>UITLEG</span>
            <p style={{ margin: '12px 0 0', fontSize: '1.25rem', fontWeight: 500 }}>{question.explanation}</p>
          </div>

          <button className="btn btn--primary btn--lg" onClick={goScoreboard} style={{ marginTop: 22 }}>
            TUSSENSTAND →
          </button>
        </div>
      </div>
    )
  }

  // ---- SCOREBOARD (top 5) ----
  if (game.status === 'scoreboard') {
    const top5 = leaderboard.slice(0, 5)
    const isLast = qi + 1 >= TOTAL_QUESTIONS
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col" style={{ maxWidth: 720 }}>
          <Pill variant="yellow">TUSSENSTAND</Pill>
          <h1 style={{ fontSize: 'clamp(1.8rem,5vw,3rem)' }}>Top 5</h1>
          <div className="leaderboard">
            {top5.map((p, i) => (
              <div className="lb-row" key={p.id}>
                <span className="rank">{i + 1}</span>
                <span className="name">{p.nickname}</span>
                <span className="pts">{p.score}</span>
              </div>
            ))}
            {top5.length === 0 && <p className="muted tc">Nog geen punten.</p>}
          </div>
          <button className="btn btn--primary btn--lg" onClick={nextQuestion}>
            {isLast ? 'EINDSTAND →' : 'VOLGENDE VRAAG →'}
          </button>
        </div>
      </div>
    )
  }

  // ---- EINDPODIUM ----
  if (game.status === 'ended') {
    const [p1, p2, p3, ...rest] = leaderboard
    return (
      <div className="screen dark">
        <Logo variant="white" className="corner-logo" />
        <div className="center-col" style={{ maxWidth: 760, justifyContent: 'flex-start', paddingTop: 40 }}>
          <Pill variant="yellow">EINDSTAND</Pill>
          <h1 style={{ fontSize: 'clamp(2rem,6vw,3.4rem)' }}>🏆 Winnaars</h1>

          <div className="podium" style={{ marginTop: 10 }}>
            {p2 && (
              <div className="stand p2">
                <div className="pos">2</div>
                <div className="who">{p2.nickname}</div>
                <div className="sc">{p2.score}</div>
              </div>
            )}
            {p1 && (
              <div className="stand p1">
                <div className="pos">1</div>
                <div className="who">{p1.nickname}</div>
                <div className="sc">{p1.score}</div>
              </div>
            )}
            {p3 && (
              <div className="stand p3">
                <div className="pos">3</div>
                <div className="who">{p3.nickname}</div>
                <div className="sc">{p3.score}</div>
              </div>
            )}
          </div>

          {rest.length > 0 && (
            <div className="leaderboard" style={{ marginTop: 28 }}>
              {rest.map((p, i) => (
                <div className="lb-row" key={p.id}>
                  <span className="rank">{i + 4}</span>
                  <span className="name">{p.nickname}</span>
                  <span className="pts">{p.score}</span>
                </div>
              ))}
            </div>
          )}

          <p className="muted tc" style={{ marginTop: 24 }}>
            Iedereen ziet z'n persoonlijke overzicht op de eigen telefoon. Proost! 🍻
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen dark">
      <div className="center-col"><Spinner /></div>
    </div>
  )
}

function ConfigError() {
  return (
    <div className="screen dark">
      <div className="center-col">
        <Pill variant="yellow">CONFIGURATIE</Pill>
        <h1 className="tc">Supabase-sleutels ontbreken</h1>
        <p className="muted tc" style={{ maxWidth: 460 }}>
          Zet <span className="mono">VITE_SUPABASE_URL</span> en{' '}
          <span className="mono">VITE_SUPABASE_ANON_KEY</span> in je <span className="mono">.env</span>{' '}
          (lokaal) of in de Vercel environment variables. Zie de README, stap 3 en 4.
        </p>
      </div>
    </div>
  )
}
