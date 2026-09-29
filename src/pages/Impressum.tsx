export function Impressum() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-800">Impressum</h1>

      <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200 print:hidden">
        <strong>Platzhalter-Seite:</strong> Die Angaben unten sind Beispiele und müssen vor dem
        dauerhaften Betrieb der Seite durch eure echten Daten ersetzt werden. Lasst die
        Pflichtangaben im Zweifel von einer sachkundigen Stelle (z. B. Vereinsberatung oder
        Rechtsanwalt/-anwältin) prüfen.
      </div>

      <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Angaben gemäß § 5 DDG</h2>
          <p className="text-neutral-600">
            [Platzhalter: Name des Vereins/der Organisation]
            <br />
            [Platzhalter: Straße und Hausnummer]
            <br />
            [Platzhalter: Postleitzahl und Ort]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Vertreten durch</h2>
          <p className="text-neutral-600">[Platzhalter: Name der/des Vorsitzenden oder Ansprechperson]</p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Kontakt</h2>
          <p className="text-neutral-600">
            Telefon: [Platzhalter]
            <br />
            E-Mail: [Platzhalter]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Registereintrag</h2>
          <p className="text-neutral-600">
            [Platzhalter: falls als Verein eingetragen — Registergericht und Registernummer,
            sonst diesen Abschnitt entfernen]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">
            Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
          </h2>
          <p className="text-neutral-600">
            [Platzhalter: Name und Anschrift der inhaltlich verantwortlichen Person]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">Haftungshinweis</h2>
          <p className="text-neutral-600">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
            externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren
            Betreiber verantwortlich.
          </p>
        </section>
      </div>
    </div>
  );
}
