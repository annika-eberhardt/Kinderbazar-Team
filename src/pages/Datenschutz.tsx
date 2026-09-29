export function Datenschutz() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-neutral-800">Datenschutzerklärung</h1>

      <div className="mb-6 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200 print:hidden">
        <strong>Platzhalter-Seite:</strong> Der Text unten ist ein allgemeines Gerüst und muss vor
        dem dauerhaften Betrieb der Seite durch eure echten Angaben ergänzt werden. Lasst ihn im
        Zweifel von einer sachkundigen Stelle (z. B. Vereinsberatung oder Rechtsanwalt/-anwältin)
        prüfen.
      </div>

      <div className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 text-neutral-600">
        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:
            <br />
            [Platzhalter: Name des Vereins/der Organisation]
            <br />
            [Platzhalter: Straße, Hausnummer, PLZ, Ort]
            <br />
            E-Mail: [Platzhalter]
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">2. Allgemeines zur Datenverarbeitung</h2>
          <p>
            Wir verarbeiten personenbezogene Daten unserer Nutzer:innen grundsätzlich nur, soweit
            dies zur Bereitstellung einer funktionsfähigen Website sowie unserer Inhalte und
            Leistungen erforderlich ist. Rechtsgrundlage ist, je nach Zweck, Art. 6 Abs. 1 lit. a
            (Einwilligung), lit. b (Vertragserfüllung bzw. vorvertragliche Maßnahmen) oder lit. f
            DSGVO (berechtigtes Interesse an der Organisation des Kinderbasars).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">
            3. Bereitstellung der Website (Hosting)
          </h2>
          <p>
            Diese Website wird über Firebase Hosting, einen Dienst der Google Ireland Limited bzw.
            Google LLC, bereitgestellt. Dabei werden automatisch technische Verbindungsdaten
            (u. a. IP-Adresse, Zeitpunkt des Zugriffs, aufgerufene Seite) in sogenannten Server-Logs
            erfasst, die zum Betrieb der Website erforderlich sind. Mit Google besteht ein
            Auftragsverarbeitungsvertrag. [Platzhalter: Serverstandort/Region ergänzen, sofern
            bekannt — aktuell konfiguriert für die Region eur3 (Europa)].
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">
            4. Nutzerkonten und Anmeldung (Firebase Authentication)
          </h2>
          <p>
            Für Team-Mitglieder gibt es einen geschützten Bereich, der eine Anmeldung mit E-Mail-
            Adresse und Passwort erfordert (Firebase Authentication, ebenfalls ein Dienst von
            Google). Passwörter werden dabei nicht im Klartext, sondern ausschließlich verschlüsselt
            gespeichert. Konten werden ausschließlich durch Administrator:innen angelegt.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">
            5. Daten im Rahmen der Basar-Organisation
          </h2>
          <p>
            Angemeldete Mitglieder können sich in Listen eintragen und Verkäufernummern
            registrieren. Dabei werden Name sowie ggf. Kontaktdaten (z. B. Telefonnummer oder
            E-Mail-Adresse) gespeichert und für andere angemeldete Team-Mitglieder sichtbar, soweit
            dies zur Organisation des Basars notwendig ist. Öffentlich ohne Anmeldung einsehbar sind
            ausschließlich allgemeine Termine (Titel, Datum, Ort, Beschreibung), keine
            personenbezogenen Daten von Mitgliedern.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">
            6. Cookies und lokale Speicherung
          </h2>
          <p>
            Diese Website verwendet keine Tracking- oder Werbe-Cookies. Zur Erkennung, ob ihr
            angemeldet seid, sowie zum Offline-Betrieb (Progressive Web App) werden technisch
            notwendige Daten im lokalen Speicher (Local Storage) eures Browsers abgelegt. Dazu
            gehört auch ein Zähler fehlgeschlagener Anmeldeversuche, der eine kurzzeitige Sperre der
            Anmeldung nach mehreren Fehlversuchen ermöglicht. Diese Daten werden nicht an uns
            übertragen und verbleiben ausschließlich in eurem Browser.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">7. Speicherdauer</h2>
          <p>
            Personenbezogene Daten werden gelöscht, sobald sie für die genannten Zwecke nicht mehr
            erforderlich sind, z. B. wenn ein Konto durch Administrator:innen entfernt wird oder ein
            Termin/eine Liste/eine Verkäufernummer nicht mehr benötigt wird. [Platzhalter: konkrete
            Löschfristen ergänzen, falls vorhanden].
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">8. Eure Rechte</h2>
          <p>
            Ihr habt jederzeit das Recht auf Auskunft über eure gespeicherten Daten sowie auf
            Berichtigung, Löschung oder Einschränkung der Verarbeitung, das Recht auf
            Datenübertragbarkeit sowie ein Widerspruchsrecht gegen die Verarbeitung, soweit sie auf
            einem berechtigten Interesse beruht. Wendet euch dazu an die oben genannte
            verantwortliche Stelle.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">9. Beschwerderecht</h2>
          <p>
            Ihr habt das Recht, euch bei einer Datenschutzaufsichtsbehörde über die Verarbeitung
            eurer personenbezogenen Daten zu beschweren. [Platzhalter: zuständige Aufsichtsbehörde
            eures Bundeslandes ergänzen].
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-neutral-800">10. Aktualität dieser Erklärung</h2>
          <p>
            Diese Datenschutzerklärung kann bei Änderungen der Website oder der rechtlichen
            Vorgaben angepasst werden. Stand: [Platzhalter: Datum].
          </p>
        </section>
      </div>
    </div>
  );
}
