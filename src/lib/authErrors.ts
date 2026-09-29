import { FirebaseError } from "firebase/app";

/** True for errors that mean "wrong email/password", as opposed to network/format errors. */
export function isCredentialError(err: unknown): boolean {
  return (
    err instanceof FirebaseError &&
    (err.code === "auth/invalid-credential" ||
      err.code === "auth/wrong-password" ||
      err.code === "auth/user-not-found")
  );
}

export function friendlyAuthError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "Die E-Mail-Adresse ist ungültig.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-Mail oder Passwort ist falsch.";
      case "auth/too-many-requests":
        return "Zu viele Versuche. Bitte warte einen Moment und versuche es erneut.";
      case "auth/email-already-in-use":
        return "Diese E-Mail-Adresse wird bereits verwendet.";
      case "auth/weak-password":
        return "Das Passwort muss mindestens 6 Zeichen lang sein.";
      case "auth/network-request-failed":
        return "Netzwerkfehler. Bitte prüfe deine Internetverbindung.";
      default:
        return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
    }
  }
  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
