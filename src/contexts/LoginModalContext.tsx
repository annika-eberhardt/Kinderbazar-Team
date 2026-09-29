import { createContext, useContext, useState, type ReactNode } from "react";

interface LoginModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const LoginModalContext = createContext<LoginModalContextValue | undefined>(undefined);

export function LoginModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value: LoginModalContextValue = {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };

  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>;
}

export function useLoginModal() {
  const ctx = useContext(LoginModalContext);
  if (!ctx) throw new Error("useLoginModal must be used within LoginModalProvider");
  return ctx;
}
