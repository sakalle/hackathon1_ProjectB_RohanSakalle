# A Una Milla

Same trip, much less money. Enter a route, see the normal fare against the hacked fare, then book the cash ticket in the app or follow the award steps.

Fares come from Milla's model: distance, season, weekday, and public sweet-spot award charts. They are not live airline inventory. No card number is stored in full. The demo card is `4242 4242 4242 4242`.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. SQLite is created at `data/milla.db` on first launch, with a sample wallet: Iberia Avios, Flying Blue, Miles & More, and Amex Membership Rewards.

## What a judge can click

- **Search** (`/` and `/fly`) — one route, cash week, award month, and all 10 airline programs
- **Full plan** (`/plan`) — up to six stops
- **Paste** (`/import`) — a Skyscanner, Kayak, or Google Flights link, a sentence, or a screenshot
- **Results** — savings banner, outbound award heatmap (tap a day to reprice), program board with transfer partners, filters for cash / miles / routes, book, guide, save, price alert
- **Explorer** (`/explore`) — cities the wallet can actually book, including 1:1 bank transfers
- **Transfers** (`/transfers`) — bank to airline matrix
- **Miles** (`/wallet`) and **Trips** (`/trips`) — balances, saved options, bookings, running total
- **Sign in** (`/login`) — optional Google account. Guests can search and book
- **Ask Milla** — the button on every page. It answers from the wallet, the latest search, and how booking works

Cash tickets confirm inside the app. Award tickets open a step list with the airline's site.

## Demo in three minutes

Start on the home page. The sample wallet is already loaded. Leave flexible dates and nearby airports on.

| Time | Do this | Say this |
| --- | --- | --- |
| 0:00 | Home. Madrid → New York is filled in. Point at the cream page, the brown savings language, and the cabin pills. | "Same trip. We price the normal fare and the hacked fare before anyone books." |
| 0:20 | Press **Show the saving**. | "Ten programs, a cash week, and the award month. The model is distance and public charts, so this stays instant." |
| 0:40 | On results, read the brown **You save** number out loud. | "The saving stays on screen. That is the product." |
| 0:55 | Point at **Cheapest award this month**, then tap that day. | "Darker days are fewer miles. Tapping reprices the whole trip on that departure." |
| 1:20 | Scroll the program board. Point at **best value** and a transfer line. | "Every program, taxes, cents per point, and which bank points can move in 1:1." |
| 1:40 | Filter **Miles**. Open the top award and press **Follow the steps**. | "Awards are a guide: transfer if needed, then search the airline. We do not pretend to hold the seat." |
| 2:05 | Go back. Filter **Cash**. Book with `4242 4242 4242 4242`, any future expiry, any CVC. | "Cash is booked in the app. The card is a demo. The reference lands on Trips." |
| 2:30 | Open **Explorer**, then **Transfers**. | "The wallet also answers the other question: where can these miles go, and which card feeds which airline." |
| 2:50 | Open **Trips** and read the saved total in the header. | "The running total is what you walk out with." |

If the room is slow, skip Explorer and end on the booking reference.

## Google sign-in

The login page asks for a Google ID, such as `name@gmail.com`, and stores that account with a session cookie. It does not replace the sample wallet. A Google account popup is also available when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env.local`. The redirect URI for that popup is `http://localhost:3000/api/auth/callback`.

## Backend

SQLite at `data/milla.db` already stores the trip side: `profile`, `loyalty`, `searches`, `saved_trips`, `alerts`, `bookings`. Accounts add `users`, `sessions`, and `chat_messages`.

Routes: `/api/search`, `/api/wallet`, `/api/bookings`, `/api/saved`, `/api/alerts`, `/api/parse`, `/api/auth/google`, `/api/auth/callback`, `/api/auth/logout`, `/api/chat`.

Prices are calculated in the app, then saved. A card is checked and only the last four digits are kept. Alerts are stored here. They are not emailed. One computer shares one wallet, so a guest and a signed-in person see the same miles on this machine.

## Honest limits

- Prices are estimates from the model, labelled as such on every result.
- The award calendar is the outbound month only, across all 10 programs, with no extra date-shift scan. That scan is what made an earlier full calendar take minutes.
- Live seat maps, hotels, and real card charges are out of scope.
