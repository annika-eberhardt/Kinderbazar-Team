import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { friendlyAuthError } from "../lib/authErrors";

export function Login() {
  const { firebaseUser, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && firebaseUser) {
    return <Navigate to="/" replace />;
  }

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
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-900/5 ring-1 ring-brand-100">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-2xl">
            🎪
          </div>
          <h1 className="text-xl font-bold text-neutral-800">Kinderbazar Team</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Melde dich mit deinem Team-Konto an.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
          {info && (
            <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition hover:bg-brand-600 disabled:opacity-60"
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
