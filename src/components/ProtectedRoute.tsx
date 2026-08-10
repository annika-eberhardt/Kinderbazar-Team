import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

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
    return <Navigate to="/login" replace />;
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
        <Navigate to="/" replace />
      )}
    </ProtectedRoute>
  );
}
