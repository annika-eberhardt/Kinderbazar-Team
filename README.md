# Kinderbazar Team App

Web-App fürs Kinderbazar-Team: Termine anlegen, Listen zum Eintragen
(z. B. Kuchenliste, Dienste), Mitgliederverwaltung mit Rollen
(Admin/Mitglied). Neue Konten können ausschließlich von Admins angelegt
werden – es gibt keine offene Selbstregistrierung.

**Kostenlos, komplett online:**

- Frontend: React + Vite + TypeScript + Tailwind CSS, gehostet kostenlos
  auf **Firebase Hosting**
- Backend: **Firebase** (Authentication + Firestore), kostenloser
  Spark-Tarif – **keine Kreditkarte nötig**
- CI/CD: **GitHub Actions**, deployt automatisch bei jedem Push auf `main`

Für ~30 Mitglieder liegt die Nutzung weit unter den Gratis-Kontingenten
von Firebase (u. a. 50.000 Lesezugriffe / 20.000 Schreibzugriffe pro Tag,
1 GB Datenbank, 10 GB Hosting-Speicher).

## 1. Firebase-Projekt einrichten

1. Auf [console.firebase.google.com](https://console.firebase.google.com)
   ein neues Projekt anlegen (Google-Analytics kann deaktiviert bleiben).
2. **Authentication** → *Sign-in method* → Anbieter **E-Mail/Passwort**
   aktivieren.
3. **Firestore Database** → Datenbank erstellen → Produktivmodus, Region
   z. B. `eur3 (europe-west)`.
4. **Projekteinstellungen** (Zahnrad) → *Allgemein* → runterscrollen zu
   "Meine Apps" → Web-App (`</>`) hinzufügen, Namen vergeben. Firebase
   zeigt dir danach ein Konfigurationsobjekt (`apiKey`, `authDomain`, …) –
   das brauchst du im nächsten Schritt.

## 2. Lokale Konfiguration

```bash
cp .env.example .env
```

Trage in `.env` die Werte aus dem Firebase-Konfigurationsobjekt ein
(`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, …). Diese Datei
wird nicht eingecheckt (`.gitignore`).

```bash
npm install
npm run dev
```

Die App läuft dann unter `http://localhost:5173`.

## 3. Firestore-Regeln veröffentlichen

Die Berechtigungslogik (wer was lesen/schreiben darf) steckt in
`firestore.rules` und muss auf Firebase deployt werden, sonst greifen
nur die (sehr restriktiven) Standardregeln.

```bash
npm install -g firebase-tools   # einmalig
firebase login
firebase use --add              # eigenes Projekt auswählen
firebase deploy --only firestore:rules
```

## 4. Ersten Admin-Account anlegen (einmalig, manuell)

Neue Konten können in der App nur von Admins angelegt werden – für den
allerersten Admin gibt es aber noch niemanden, der das tun könnte. Diesen
einen Account daher einmalig direkt in der Firebase-Konsole anlegen:

1. **Authentication** → *Users* → *Add user* → E-Mail + Passwort eingeben.
2. Die dabei erzeugte **User UID** kopieren.
3. **Firestore Database** → Sammlung `users` anlegen → Dokument-ID =
   genau diese UID → Felder:
   - `name` (string): z. B. `"Admin"`
   - `email` (string): dieselbe E-Mail wie in Schritt 1
   - `role` (string): `"admin"`
   - `active` (boolean): `true`
   - `createdAt` (timestamp): aktueller Zeitpunkt

Danach kannst du dich in der App mit diesem Konto anmelden und unter
**Verwaltung** alle weiteren Mitglieder-Konten bequem über die
Oberfläche anlegen (Name, E-Mail, Anfangspasswort, Rolle).

## 5. Deployment über GitHub Actions

Der Workflow `.github/workflows/deploy.yml` baut die App bei jedem Push
auf `main` und deployt sie auf Firebase Hosting. Dafür einmalig
einrichten:

```bash
firebase init hosting:github
```

Das richtet automatisch den nötigen Service-Account und das GitHub
Secret `FIREBASE_SERVICE_ACCOUNT` ein. Zusätzlich im GitHub-Repo unter
*Settings → Secrets and variables → Actions* die sechs `VITE_FIREBASE_*`
Werte aus deiner `.env` als Secrets hinterlegen (gleiche Namen).

Alternativ manuell deployen:

```bash
npm run build
firebase deploy --only hosting
```

## Sicherheitshinweis zur Konto-Erstellung

Firebase Authentication kennt serverseitig keine "nur Admins dürfen
Konten anlegen"-Regel – das wird in dieser App über die Weboberfläche
durchgesetzt (nur im Verwaltungsbereich für Admins erreichbar). Der
öffentliche Firebase-`apiKey` ist kein Geheimnis, verhindert also
technisch nicht, dass jemand die Firebase-Auth-API direkt anspricht.
Für ein internes Team-Tool ist dieses Restrisiko vertretbar; wer es
weiter einschränken möchte, kann in der Google Cloud Console unter
*APIs & Services → Credentials* den Browser-`apiKey` auf die eigene
Domain (HTTP-Referrer) einschränken.

## Datenmodell (Firestore)

- `users/{uid}`: `name`, `email`, `role` (`admin`|`member`), `active`,
  `createdAt`
- `events/{id}`: `title`, `description`, `date`, `location`,
  `createdBy`, `createdAt`
- `lists/{id}`: `title`, `description`, `eventId`,
  `allowMemberAddItems`, `items[]` (`label`, `capacity`, `signups[]`),
  `createdBy`, `createdAt`

## Design anpassen

Die Pink-Akzentfarben stehen als Tailwind-Theme in `src/index.css`
(`--color-brand-*`) und lassen sich dort zentral anpassen.
