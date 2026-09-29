import { useEffect, useState, type FormEvent } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";
import { friendlyAuthError } from "../lib/authErrors";
import logo from "../assets/logo.png";

export function LoginModal() {
  const { isOpen, close } = useLoginModal();
  const { firebaseUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Close automatically once sign-in succeeds.
  useEffect(() => {
    if (firebaseUser && isOpen) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser]);

  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setPassword("");
      setError(null);
      setInfo(null);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Bitte gib zuerst deine E-Mail-Adresse ein.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfo("Wir haben dir eine E-Mail zum Zurücksetzen des Passworts geschickt.");
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Anmelden"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl bg-white p-8 shadow-lg shadow-brand-900/10 ring-1 ring-brand-100"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Schließen"
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-600"
        >
          ✕
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-[22%] bg-brand-500 p-2">
            <img src={logo} alt="Kinderbazar-Team Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-neutral-800">Kinderbazar Team</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Melde dich mit deinem Team-Konto an.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-neutral-700">
              E-Mail
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-neutral-700">
              Passwort
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-xl bg-brand-500 px-4 py-2 font-medium text-white transition active:scale-95 hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? "Anmelden…" : "Anmelden"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-brand-600 hover:underline"
          >
            Passwort vergessen?
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Neue Konten werden ausschließlich von Admin-Mitgliedern angelegt.
        </p>
      </div>
    </div>
  );
}
