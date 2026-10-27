import { eur } from "./format";

export interface AssistantContext {
  name: string | null;
  signedIn: boolean;
  balances: { name: string; balance: number; unit: string }[];
  latest: { title: string; normal: number; hacked: number; save: number; offer: string } | null;
  bookedSavings: number;
  bookings: number;
}

export function answerTripQuestion(message: string, ctx: AssistantContext): string {
  const q = message.toLowerCase().replace(/\s+/g, " ").trim();
  const who = ctx.name ? ctx.name.split(" ")[0] : null;

  if (!q) return "Ask about your miles, the last saving, transfers, or how to book.";
  if (/^(hi|hello|hey|hola)\b/.test(q)) {
    return who
      ? `Hello ${who}. You are signed in, and you can still search without staying signed in. Ask what your wallet holds, or how a booking works.`
      : "Hello. You are browsing as a guest, which is enough to search and book. Ask what the wallet holds, or how a booking works.";
  }
  if (/log\s*in|sign\s*in|google|account|oauth/.test(q)) {
    return ctx.signedIn
      ? `You are signed in${who ? ` as ${who}` : ""}. Logging out does not delete the miles or trips on this computer.`
      : "Sign-in is optional. Use your name, email, and a password from the Sign in link if you want your name on the trip. Search, the wallet, and booking all work as a guest.";
  }
  if (/card|4242|pay|checkout/.test(q)) {
    return "Cash fares are booked inside Milla. Use the demo card 4242 4242 4242 4242, any future expiry, and any CVC. Only the last four digits are stored. A live Duffel fare is paid from the Duffel test balance, so that card is not charged and is not sent to Duffel. Award seats are not charged here: you follow the steps and open the airline.";
  }
  if (/real|live|api|invent|estimate|accurate|fake/.test(q)) {
    return "When a Duffel key is set, the normal cash fare is a live Duffel price for the dates you asked for, and you can order that ticket in the app. If Duffel returns nothing, cash falls back to Milla's distance model and the result says so. Award miles, taxes, and the award month stay on public charts. I do not invent a fare.";
  }
  if (/transfer|amex|membership|bank point|1:1|1 to 1/.test(q)) {
    return "Amex Platinum and Gold earn Membership Rewards. Chase Sapphire earns Ultimate Rewards. Citi Strata Premier earns ThankYou points. Capital One Venture earns Capital One miles. Those points move to partner airlines at 1:1. The Transfers page lists the cards and the matrix. Milla only suggests a transfer at 0.8 cents per point or better.";
  }
  if (/wallet|balance|miles|avios|points do i|what do i have|how many/.test(q)) {
    if (!ctx.balances.length) return "The wallet is empty. Open Miles and load the sample wallet: Iberia, Flying Blue, Miles & More, and Amex.";
    const lines = ctx.balances.map((row) => `${row.balance.toLocaleString("en-GB")} ${row.unit} on ${row.name}`).join("; ");
    return `On this computer the wallet holds ${lines}. Awards spend those balances. If a seat needs more, the result says how short you are.`;
  }
  if (/last|recent|saving|saved|new york|madrid|this trip|my trip|result/.test(q)) {
    if (!ctx.latest) return "There is no search yet. Enter a route on the home page and the saving shows up as soon as the model finishes.";
    return `The latest trip is ${ctx.latest.title}. Normal fare ${eur(ctx.latest.normal)}, hacked fare ${eur(ctx.latest.hacked)}, so you save ${eur(ctx.latest.save)}. The leading option is “${ctx.latest.offer}”.`;
  }
  if (/book|award step|guide|confirm/.test(q)) {
    const booked = ctx.bookings
      ? ` You already have ${ctx.bookings} booking${ctx.bookings === 1 ? "" : "s"} here, worth ${eur(ctx.bookedSavings)} saved.`
      : "";
    return `Cash options use Book this fare. Award and mixed options use Booking steps, which tell you what to transfer and which airline site to open.${booked}`;
  }
  if (/alert|watch|email me/.test(q)) {
    return "On a result, Price alert stores a target on this computer. Milla marks it triggered when the saved fare is already under that number. It does not send a real email.";
  }
  if (/explore|where can|destination/.test(q)) {
    return "Explorer starts from the miles you hold, including 1:1 transfers, and keeps cities worth at least 0.8 cents per point. Open a city and it fills a search.";
  }
  if (/hotel|seat map|car rental/.test(q)) {
    return "This demo is flights only. Hotels and seat maps are not part of it.";
  }
  if (/how|what is milla|what do you do|help/.test(q)) {
    return "Enter a trip. Milla prices the normal fare against miles, nearby airports, and a smarter route, then keeps the saving on screen. You book the cash fare here, or follow the award steps. Ask about your wallet if you want the numbers.";
  }
    return "I answer from this app: your wallet, your latest search, transfers, and how booking works. I do not invent fares. Try “what miles do I have?” or “how do I book?”.";
}
