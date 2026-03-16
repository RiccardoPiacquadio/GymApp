# GymApp Workout Tracker

Web app mobile-first installabile come PWA per tracciare allenamenti in palestra con storage locale offline-first.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand
- IndexedDB con Dexie
- Recharts
- Zod
- vite-plugin-pwa

## Funzionalita MVP incluse

- profili locali selezionabili o creabili tramite nome
- ultimo profilo usato persistito in locale
- sessione attiva per utente
- inserimento libero degli esercizi realmente eseguiti
- esercizi canonici con alias italiano/inglese
- aggiunta, modifica ed eliminazione serie
- storico sessioni e dettaglio esercizio
- grafici base su volume, top weight e frequenza
- input vocale opzionale con preview e conferma
- seed iniziale con esercizi base palestra

## Avvio

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Struttura principale

```text
src/
  app/
    routes/
    providers/
  components/
    common/
  features/
    users/
    exercises/
    sessions/
    analytics/
    voice/
  db/
  lib/
  store/
  styles/
  types/
```

## Note implementative

- nessun backend richiesto nel MVP
- dati persistiti in IndexedDB tramite Dexie
- alias resolver e parser vocale sono deterministici, non NLP generico
- ogni sessione e ogni serie sono gia modellate con `userId`/relazioni compatibili con multiutente locale
- quando entri su un esercizio vedi l'ultimo storico disponibile per velocizzare il logging

## Pagine principali

- `ProfileSelectPage`
- `DashboardPage`
- `StartWorkoutPage`
- `ActiveWorkoutPage`
- `ExerciseSearchPage`
- `ExerciseLogPage`
- `WorkoutHistoryPage`
- `WorkoutDetailPage`
- `ExerciseDetailPage`

## Seed iniziale

Il seed include almeno:

- Bench Press
- Shoulder Press
- Squat
- Deadlift
- Lat Pulldown
- Barbell Row
- Dumbbell Curl
- Triceps Pushdown

con alias italiani e inglesi come richiesto.

## Limiti attuali

- riconoscimento vocale dipendente dal browser
- niente sync cloud o autenticazione forte
- nessun template workout obbligatorio

## Evoluzioni

Vedi [TODO.md](./TODO.md).
