import { ImportStudio } from "@/components/ImportStudio";

export default function ImportPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-4 py-10 md:px-6 md:py-14">
      <div>
        <p className="eyebrow">Paste a trip</p>
        <h1 className="mt-3 font-serif text-5xl">Start from a link, a sentence, or a screenshot.</h1>
        <p className="mt-3 text-mute">
          Skyscanner, Kayak and Google Flights links are read when the airports are in the address. A screenshot is read in the browser, then you confirm the cities before anything is priced.
        </p>
      </div>
      <ImportStudio />
    </main>
  );
}
