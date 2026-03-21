# CLAUDE.md — CalleGymApp (Gym Tracker)

Questo file e' il documento di contesto principale del progetto.
Tutti gli agenti devono leggerlo prima di iniziare e aggiornarlo dopo aver completato il proprio lavoro.

---

## Descrizione del Progetto

**Nome app:** CalleGymApp
**Scopo:** Workout tracker mobile-first, offline-first, voice-first per registrare allenamenti in palestra con comandi vocali in italiano.

**Stack:**
- React 18 + TypeScript strict + Vite + SWC
- Dexie.js (IndexedDB ORM) — database locale offline-first
- Zustand — state management globale (solo profilo attivo)
- Recharts — grafici analytics
- Tailwind CSS — styling con design tokens custom
- vite-plugin-pwa — Progressive Web App con service worker
- Web Speech API — riconoscimento vocale
- Zod — validazione (disponibile, non ancora usato ovunque)

**Deploy:** PWA installabile (Vercel opzionale)
**Database:** Dexie.js (IndexedDB) — NO Supabase. Architettura offline-first.

---

## Funzionalita'

| Funzionalita' | Stato |
|---|---|
| Profili utente locali (multi-utente) | ✅ Completo |
| Registrazione esercizi (serie, reps, peso) | ✅ Completo |
| Voice-first logging (NLP italiano/inglese) | ✅ Completo |
| Hands-free mode (wake word "GYM" + AirPods) | ✅ Completo |
| Multi-set vocale ("70x8, 50x7, 90x5") | ✅ Completo |
| Correzioni vocali (peso/reps) | ✅ Completo |
| Fuzzy matching esercizi (Levenshtein + alias) | ✅ Completo |
| Session pause/resume con timer | ✅ Completo |
| Storico allenamenti | ✅ Completo |
| Grafici: volume, top weight, frequenza | ✅ Completo |
| PWA offline-first | ✅ Completo |
| Swipe navigation | ✅ Completo |
| Error boundary voice panel | ✅ Completo |
| Seed 75 esercizi con alias IT/EN | ✅ Completo |
| Dashboard con stats reali | ✅ Completo |
| Personal Record badge | ✅ Completo |
| Custom confirm modal | ✅ Completo |
| Code splitting (lazy routes) | ✅ Completo |
| Icone nav bar | ✅ Completo |
| Flash visivo + haptic | ✅ Completo |
| Pannello vocale collassabile | ✅ Completo |
| Debounce ricerca esercizi | ✅ Completo |
| Deploy Vercel | ❌ Non configurato |

---

## Struttura Cartelle Attuale

```
src/
├── app/
│   ├── providers/AppProviders.tsx
│   └── routes/
│       ├── ActiveWorkoutPage.tsx
│       ├── DashboardPage.tsx
│       ├── ExerciseDetailPage.tsx
│       ├── ExerciseLogPage.tsx
│       ├── ExerciseSearchPage.tsx
│       ├── ProfileSelectPage.tsx
│       ├── WorkoutDetailPage.tsx
│       └── WorkoutHistoryPage.tsx
├── components/common/
│   ├── AppShell.tsx
│   ├── ConfirmModal.tsx
│   ├── SectionTitle.tsx
│   └── VoiceErrorBoundary.tsx
├── db/
│   ├── index.ts
│   ├── schema.ts
│   ├── seed.ts
│   └── seedExercises.ts
├── features/
│   ├── analytics/
│   │   ├── components/ (VolumeChart, TopWeightChart, FrequencyChart, PRBadge)
│   │   ├── services/analyticsService.ts
│   │   └── types/analytics.ts
│   ├── exercises/
│   │   ├── components/ (ExerciseList, ExerciseSearchInput)
│   │   └── services/ (exerciseRepository, aliasResolver, aliasResolverConstants)
│   ├── sessions/
│   │   ├── components/ (SessionTimer, SessionSummaryCard, SetEntryForm, SetEntryTable)
│   │   └── services/sessionRepository.ts
│   ├── users/
│   │   ├── components/ (ProfileCard, CreateProfileForm)
│   │   ├── hooks/ (useActiveProfile, useAppBoot)
│   │   └── services/userRepository.ts
│   └── voice/
│       ├── components/ (VoiceCaptureButton, VoiceParsePreview)
│       ├── hooks/useVoiceSession.ts
│       ├── services/ (voiceCommandProcessor, intentHandlers, voiceParser, speechCapture, handsFreeService, voiceConversationStore, voiceFeedback)
│       └── types/voice.ts
├── hooks/ (useSwipeNavigation, useDebounce, useConfirm)
├── lib/ (dates, ids, math, normalize)
├── store/appStore.ts
├── styles/index.css
├── types/ (domain.ts, index.ts, speech-recognition.d.ts)
├── App.tsx
└── main.tsx
```

---

## Schema Database (Dexie/IndexedDB)

```typescript
// Version 2
userProfiles:    "id, displayName, normalizedDisplayName"
exerciseCanonicals: "id, canonicalName, slug"
exerciseAliases: "id, canonicalExerciseId, alias, normalizedAlias, lang"
workoutSessions: "id, userId, status, startedAt"
sessionExercises: "id, sessionId, canonicalExerciseId, exerciseOrder"
setEntries:      "id, sessionExerciseId, setNumber"
appSettings:     "key"
```

---

## Dipendenze Installate

Tutte le dipendenze necessarie sono gia' presenti. **Non serve Supabase.**

```
react, react-dom, react-router-dom, dexie, dexie-react-hooks,
zustand, recharts, zod, tailwindcss, vite-plugin-pwa, vitest
```

---

## Stato Attuale del Progetto

> Aggiornato: 2026-03-21 — App completata al 100% (escluso deploy)

### Completato — Tutte le priorita'
- [x] Database Dexie con 7 tabelle + seed 75 esercizi
- [x] Repository pattern (user, session, exercise, analytics)
- [x] Profili utente multi-utente con CRUD + cascade delete
- [x] State management (Zustand + useReducer + useLiveQuery)
- [x] Workout session CRUD con pause/resume/timer
- [x] Set entry CRUD con rinumerazione automatica
- [x] Voice-first: NLP parser, command processor (11 handler pipeline)
- [x] Hands-free mode con wake word + AirPods MediaSession
- [x] Alias resolver con Levenshtein + cache in-memory
- [x] Analytics service con query indicizzate (no full scan)
- [x] 3 grafici Recharts (Volume, TopWeight, Frequency)
- [x] 9 route con React Router + protezione profilo
- [x] PWA con service worker
- [x] Tailwind CSS con design tokens custom
- [x] VoiceErrorBoundary
- [x] 25 test con vitest
- [x] **P1: Tipi SpeechRecognition unificati** in `src/types/speech-recognition.d.ts`
- [x] **P1: Magic numbers estratti** in `aliasResolverConstants.ts` + costanti in `handsFreeService.ts`
- [x] **P1: PROFILE_MANAGER dinamico** — ora basato su appSettings (primo profilo = manager)
- [x] **P1: db rimosso dalle route** — aggiunti `getAllAliases`, `getSessionExerciseDetail` ai repository
- [x] **P1: quickIntent calcolato una volta** in CommandContext
- [x] **P2: Stringhe feedback unificate** in `voiceFeedback.ts` (40+ stringhe centralizzate)
- [x] **P2: Voice handler estratti** in `intentHandlers.ts` (testabili indipendentemente)
- [x] **P2: useLiveQuery standardizzato** — rimossi async/await inutili ovunque
- [x] **P2: Rendering condizionale standardizzato** — ternario + null ovunque
- [x] **P3: Dashboard con stats reali** (sessioni, volume totale, media esercizi)
- [x] **P3: StartWorkoutPage eliminata** — workout si avvia direttamente da Dashboard
- [x] **P3: Code splitting** — WorkoutHistory, WorkoutDetail, ExerciseDetail lazy-loaded
- [x] **P3: Volume formattato come kg/t** in tutti i punti
- [x] **P3: ActiveWorkoutPage riordinata** — azioni in alto, pannello vocale collassabile
- [x] **P3: VoiceParsePreview compatto** — layout a riga singola con dettagli inline
- [x] **P3: Icone nav bar** — SVG inline (grid, dumbbell, clock, user)
- [x] **P3: Custom confirm modal** — ConfirmModal + useConfirm hook, niente piu' window.confirm
- [x] **P3: Flash visivo + haptic** — animazione verde + vibrazione dopo save vocale
- [x] **P4: Cache generateSilentWav** — computato una volta a livello modulo
- [x] **P4: AudioContext riusato** — singolo sharedAudioCtx per tutti i beep
- [x] **P4: Debounce ricerca esercizi** — 200ms con useDebounce hook
- [x] **P4: PRBadge** — badge personal record con stella dorata su ExerciseLogPage

### Non implementato (scelta consapevole)
- [ ] **Branded type IsoDateTime** — basso impatto, puo' essere aggiunto in futuro
- [ ] **Deploy Vercel** — l'utente non ha richiesto deploy

---

## Note degli Agenti

### Orchestratore (2026-03-21)
L'app e' gia' funzionante all'85%. L'architettura e' solida (feature-based, repository pattern, offline-first con Dexie). NON serve migrare a Supabase — l'approccio IndexedDB e' superiore per questo caso d'uso (gym app usata offline in palestra).

### Architetto + Backend + Frontend + QA (2026-03-21)
Completati tutti i task P1, P2 (feedback strings), P3 principali:
- Tipi SpeechRecognition unificati, magic numbers estratti, PROFILE_MANAGER dinamico
- db rimosso dalle route, quickIntent calcolato una volta, feedback centralizzati
- Dashboard ridisegnata con stats reali, StartWorkoutPage eliminata
- Code splitting attivo, volume in kg ovunque, subtitles accorciati
- QA: typecheck clean, 25/25 test, build 768 KB (220 KB gzip)

### Completamento finale (2026-03-21)
Completati tutti i task rimanenti P2/P3/P4:
- Intent handler estratti in file separato per testabilita'
- useLiveQuery standardizzato (no async/await), rendering condizionale uniformato
- ActiveWorkoutPage riordinata: azioni in alto, pannello vocale collassabile
- VoiceParsePreview compattato, icone SVG nav bar, custom confirm modal
- Flash + haptic dopo voice save, debounce ricerca, PRBadge personal record
- Audio: cache silentWav, AudioContext condiviso
- QA finale: typecheck clean, 25/25 test, build 750 KB (222 KB gzip), 3 lazy chunks

---

## Bug Noti / Problemi Aperti

Nessun bug noto.

---

## Flusso Utente Principale

```
1. Utente seleziona/crea profilo locale
2. Dalla Dashboard, avvia nuovo workout o continua quello attivo
3. Aggiunge esercizi tramite ricerca o comando vocale
4. Per ogni esercizio: aggiunge serie via voce ("panca 80 per 8") o manualmente
5. Puo' correggere via voce ("no 7", "correggi peso 75")
6. Puo' usare multi-set ("70x8, 50x7, 90x5")
7. Chiude sessione (anche via voce: "chiudi sessione")
8. Nello Storico vede tutti i workout completati
9. Nel dettaglio esercizio vede grafici progressione + badge PR
```
