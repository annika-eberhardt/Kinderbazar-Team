import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import { AdminRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Lists } from "./pages/Lists";
import { ListDetail } from "./pages/ListDetail";
import { Basare } from "./pages/Basare";
import { BasarDetail } from "./pages/BasarDetail";
import { AdminUsers } from "./pages/AdminUsers";
import { Impressum } from "./pages/Impressum";
import { Datenschutz } from "./pages/Datenschutz";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoginModalProvider>
          <Routes>
            {/* Old bookmarks to the login page just land on the (now public) home page. */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
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
                path="/basare"
                element={
                  <ProtectedRoute>
                    <Basare />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/basare/:id"
                element={
                  <ProtectedRoute>
                    <BasarDetail />
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
