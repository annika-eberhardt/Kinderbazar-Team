import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLoginModal } from "../contexts/LoginModalContext";

/** Shown in place of a member-only page when nobody is signed in. */
function SignInPrompt() {
  const { open } = useLoginModal();
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-lg font-semibold text-neutral-700">
        Dieser Bereich ist nur für angemeldete Mitglieder.
      </p>
      <p className="text-neutral-500">Melde dich an, um fortzufahren.</p>
      <button
        onClick={open}
        className="mt-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white transition active:scale-95 hover:bg-brand-600"
      >
        Anmelden
      </button>
    </div>
  );
}

/** Wraps pages that require a signed-in, activated account. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-brand-500">
        Lädt…
      </div>
    );
  }

  if (!firebaseUser) {
    return <SignInPrompt />;
  }

  if (!profile || !profile.active) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-lg font-semibold text-neutral-700">
          Dein Konto ist noch nicht freigeschaltet.
        </p>
        <p className="text-neutral-500">
          Bitte wende dich an ein Admin-Mitglied im Team.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();

  return (
    <ProtectedRoute>
      {loading ? null : isAdmin ? (
        <>{children}</>
      ) : (
        <Navigate to="/events" replace />
      )}
    </ProtectedRoute>
  );
}
