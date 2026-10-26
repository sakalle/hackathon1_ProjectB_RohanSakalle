# A Una Milla

Check a trip, see the normal fare against the hacked fare, and book it or follow the steps.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000.

The database is SQLite at `data/milla.db`. It is created on first launch.

## What it does

- Quick flight or a full multi-stop plan
- Flexible dates and nearby airports, with ground cost taken out of the saving
- Smarter connections and split tickets, with the self-connect risk written out
- Miles, points and transfer partners from a wallet you control
- Normal price, hacked price, euros and percent
- A plain-language reason on every option
- Booking inside the app for cash fares
- Step-by-step award instructions
- Saved trips, a running total, and price alerts
- Paste a Skyscanner, Kayak or Google Flights link, a sentence, or a screenshot

Fares come from Milla's pricing model: distance, season, weekday and public sweet-spot award charts. Live airline inventory is the next step. No card number is stored in full. The demo card is `4242 4242 4242 4242`.

Load the sample wallet on the Miles page before judging an award search. It holds Iberia Avios, Flying Blue, Miles & More and Amex points.
