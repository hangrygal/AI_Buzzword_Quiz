# Generation C · AI-Buzzword Quiz 🟡

Een live, multiplayer quiz in Kahoot-stijl voor de vrijmibo. Deelnemers doen mee
op hun eigen telefoon (geen installatie), het hostscherm draait op de beamer, en
er is een live-ranglijst. Aan het eind ziet elke deelnemer op de eigen telefoon
een persoonlijk overzicht met eindscore + alle vragen (goed/fout, juist antwoord
en uitleg).

- **Frontend:** React + Vite
- **Realtime + database:** Supabase (gratis tier)
- **Hosting:** Vercel
- **Taal:** Nederlands · **Thema:** AI-buzzwords (7× PITTIG, 8× EXPERT)

Je hoeft niet te kunnen programmeren. Volg gewoon de stappen hieronder. Reken op
ongeveer 20–30 minuten voor de eerste keer.

---

## Wat ga je doen? (in het kort)

1. Een gratis **Supabase**-project aanmaken.
2. De meegeleverde **SQL** plakken en uitvoeren (maakt de tabellen + zet realtime aan).
3. De **project-URL** en **anon key** ophalen.
4. De code op **Vercel** zetten en die twee sleutels invullen.
5. Spel starten 🎉

---

## Stap 1 — Gratis Supabase-project aanmaken

1. Ga naar **https://supabase.com** en klik op **Start your project** / **Sign in**.
   Inloggen met GitHub of e-mail kan allebei.
2. Klik op **New project**.
3. Vul in:
   - **Name:** bijv. `genc-quiz`
   - **Database Password:** kies een sterk wachtwoord (je hebt dit verder niet
     nodig voor de app, maar bewaar het toch even).
   - **Region:** kies **Frankfurt (eu-central-1)** — dichtbij = snel.
4. Klik **Create new project** en wacht ~1–2 minuten tot het project klaar is.

---

## Stap 2 — Tabellen + Realtime aanzetten (SQL plakken)

1. Open in het linkermenu **SQL Editor**.
2. Klik **+ New query**.
3. Open het bestand **`supabase.sql`** uit dit project, kopieer **alles** en plak
   het in de editor.
4. Klik rechtsonder op **Run** (of Ctrl/Cmd + Enter).
5. Je hoort **"Success. No rows returned"** te zien. Klaar — de tabellen `games`,
   `players` en `answers` staan er, RLS-policies zijn ingesteld en Realtime staat aan.

> Je mag dit script gerust opnieuw draaien (bijv. om schoon te beginnen). Het
> ruimt eerst oude versies op.

---

## Stap 3 — Project-URL en anon key ophalen

1. Ga in Supabase naar **Project Settings** (tandwiel, linksonder) → **API**.
2. Noteer twee dingen:
   - **Project URL** — iets als `https://abcdefghijklmno.supabase.co`
   - **Project API keys → `anon` `public`** — een lange sleutel.
     > Gebruik **alleen** de `anon` (public) key. Deel of gebruik **nooit** de
     > `service_role` key aan de client-kant.

Bewaar deze twee even; je vult ze in stap 4 in.

---

## Stap 4 — Deployen op Vercel

Je hebt twee opties. **Optie A (via GitHub)** is het makkelijkst en aanbevolen.

### Optie A — via GitHub (aanbevolen)

1. Maak een gratis account op **https://github.com** (als je die nog niet hebt).
2. Maak een **nieuwe repository** en upload de inhoud van deze projectmap
   (of gebruik GitHub Desktop / de "upload files"-knop op github.com).
3. Ga naar **https://vercel.com** en log in met GitHub.
4. Klik **Add New… → Project**, kies je repository en klik **Import**.
5. Vercel herkent automatisch **Vite**. Laat de build-instellingen staan:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Klap **Environment Variables** open en voeg **exact** deze twee toe:

   | Name                     | Value                                  |
   | ------------------------ | -------------------------------------- |
   | `VITE_SUPABASE_URL`      | jouw Project URL uit stap 3            |
   | `VITE_SUPABASE_ANON_KEY` | jouw anon public key uit stap 3        |

7. Klik **Deploy**. Na ~1 minuut krijg je een URL zoals
   `https://genc-quiz.vercel.app`.

> **Sleutels vergeten of aangepast?** Vercel → je project → **Settings →
> Environment Variables**. Na een wijziging: **Deployments → ⋯ → Redeploy**.

### Optie B — via de Vercel CLI (voor de terminal-liefhebber)

```bash
npm i -g vercel
vercel                 # volg de prompts
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

---

## Stap 5 — Spelen! 🎉

- **Host (beamer/laptop):** open `https://<jouw-app>.vercel.app/host`
  1. Stel eventueel de tijd per vraag in en klik **Spel aanmaken**.
  2. De **game-PIN** + **QR-code** verschijnen groot in beeld.
  3. Zodra er spelers binnen zijn, klik **Start**.
  4. Per vraag: term + 4 definities + timer → **Toon antwoord** (of automatisch
     als de tijd op is/iedereen klaar is) → **Tussenstand** → **Volgende vraag**.
  5. Na vraag 15: het **eindpodium** op de beamer.

- **Deelnemers (telefoon):** open `https://<jouw-app>.vercel.app` (of scan de QR),
  typ de **PIN** + een **bijnaam**, en spelen maar. Aan het eind zien ze hun eigen
  score + volledige samenvatting.

Tip: laat de QR-code + de tekst "ga naar `<jouw-app>.vercel.app`" groot op de
beamer staan tijdens de lobby.

---

## Lokaal draaien (optioneel, om eerst te testen)

```bash
npm install
cp .env.example .env      # vul VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in
npm run dev               # open de getoonde http://localhost:5173
```

Host-scherm op `http://localhost:5173/host`, spelers op `http://localhost:5173`.
Wil je op je telefoon testen op hetzelfde wifi-netwerk? Start met
`npm run dev -- --host` en gebruik het "Network"-adres dat Vite toont.

---

## Je eigen huisstijl-assets toevoegen

- **Logo:** vervang `public/logo/mark-black.svg` (zwarte versie, voor lichte
  achtergrond) en `public/logo/mark-white.svg` (witte versie, voor het donkere
  hostscherm) door het echte Generation C-logo. Bestandsnamen gelijk houden —
  dan hoef je niets in de code te wijzigen.
- **Uncut Sans:** leg `UncutSans-Book.woff2` en `UncutSans-Semibold.woff2` in
  `public/fonts/`. De app pakt ze dan automatisch op; ontbreken ze, dan valt
  hij netjes terug op Inter. Zie `public/fonts/README.txt`.
- **Geist Mono** wordt al gratis via Google Fonts geladen (labels/knoppen).

Kleuren en vormtaal staan centraal in `src/index.css` (variabelen bovenaan).

---

## Hoe werkt de scoring?

Zie `src/scoring.js`. Kort:

- Fout of te laat = **0 punten**.
- Goed = **500–1000 punten**, lineair afhankelijk van je snelheid:
  direct antwoorden = 1000, op de valreep = 500.
  Formule: `punten = 500 + 500 × (1 − reactietijd / timerduur)`.
- De ranglijst is de som van alle punten (`players.score`, atomair opgehoogd via
  de `increment_score`-RPC).

Randgevallen die zijn afgevangen: laat binnenkomen (je doet mee vanaf de volgende
vraag), niet op tijd antwoorden (0 punten), en herverbinden na wegvallen (je
sessie wordt onthouden op PIN + bijnaam, dus je score blijft staan).

---

## Bestandsoverzicht

```
generation-c-quiz/
├─ index.html                 # entry + fonts (Geist Mono, Inter)
├─ vite.config.js             # standaard Vite + React
├─ vercel.json                # SPA-rewrites voor Vercel
├─ .env.example               # sjabloon voor je Supabase-sleutels
├─ supabase.sql               # ▶ plak dit in de Supabase SQL-editor
├─ public/
│  ├─ logo/                   # mark-black.svg / mark-white.svg (vervang door echte)
│  └─ fonts/                  # (optioneel) Uncut Sans .woff2
└─ src/
   ├─ main.jsx                # React-entry + router
   ├─ App.jsx                 # routes: "/" speler, "/host" beamer
   ├─ index.css               # complete Generation C-huisstijl
   ├─ supabaseClient.js       # leest VITE_SUPABASE_URL / _ANON_KEY
   ├─ questions.js            # de 15 vragen (NL)
   ├─ scoring.js              # puntenformule met snelheidsbonus
   ├─ shuffle.js              # husselt opties per sessie (deterministisch)
   ├─ components/Ui.jsx       # Logo, Pill, LevelPill, Spinner
   └─ pages/
      ├─ Host.jsx             # beamer: lobby, vraag, reveal, tussenstand, podium
      └─ Play.jsx             # telefoon: join, spelen, feedback, eindoverzicht
```

---

## Problemen oplossen

- **"Supabase-sleutels ontbreken"** in beeld → environment variables niet (goed)
  ingevuld op Vercel. Check stap 4.6 en doe daarna een **Redeploy**.
- **Spelers zien de vraag niet wisselen** → Realtime niet aan. Draai `supabase.sql`
  opnieuw; die zet de tabellen in de `supabase_realtime`-publicatie.
- **"Geen actief spel gevonden met deze PIN"** → de host heeft nog geen spel
  aangemaakt, of het spel is al afgelopen. Maak op `/host` een nieuw spel aan.
- **PIN al in gebruik** → zeldzaam; maak simpelweg een nieuw spel aan.
```
