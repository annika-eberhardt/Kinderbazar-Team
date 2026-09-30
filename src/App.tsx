import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Lists } from "./pages/Lists";
import { ListDetail } from "./pages/ListDetail";
import { Nummernvergabe } from "./pages/Nummernvergabe";
import { AdminUsers } from "./pages/AdminUsers";
import { Account } from "./pages/Account";
import { Impressum } from "./pages/Impressum";
import { Datenschutz } from "./pages/Datenschutz";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoginModalProvider>
          <Routes>
            {/* Old bookmarks to the login page just land on the (now public) home page. */}
            <Route path="/login" element={<Navigate to="/events" replace />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route
                path="/lists"
                element={
                  <ProtectedRoute>
                    <Lists />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/lists/:id"
                element={
                  <ProtectedRoute>
                    <ListDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nummernvergabe"
                element={
                  <ProtectedRoute>
                    <Nummernvergabe />
                  </ProtectedRoute>
                }
              />
              {/* Old Basar list/detail bookmarks land on the new, Termin-independent page. */}
              <Route path="/basare" element={<Navigate to="/nummernvergabe" replace />} />
              <Route path="/basare/:id" element={<Navigate to="/nummernvergabe" replace />} />
              <Route
                path="/konto"
                element={
                  <ProtectedRoute>
                    <Account />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </LoginModalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
