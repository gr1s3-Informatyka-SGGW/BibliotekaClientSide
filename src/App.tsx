/**
 * @file App.tsx
 * @description Komponent aplikacji odpowiedzialny za konfigurację routingu,
 * inicjalizację AuthProvider oraz ochronę tras na podstawie roli użytkownika.
 */

import { lazy, Suspense, useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute, AuthContext  } from "./server/UserAuth.tsx";

// general (public)
const AboutUs = lazy(() => import("./AboutUs"));
import { Error404, AccessDeniedError } from "./Errors";

// auth (not logged)
const Login = lazy(() => import("./Login/Login"));
const Register = lazy(() => import("./Login/Register"));

// shared (user + admin)
const CatalogView = lazy(() => import("./CatalogView/CatalogView.tsx"));

// user only
const UserProfileView = lazy(() => import("./ProfileView/UserProfileView.tsx"));

// admin only
const AdminProfileView = lazy(() => import("./ProfileView/AdminProfileView.tsx"));
const UsersListView = lazy(() => import("./UserListView/UsersListView.tsx"));
const AddBookView = lazy(() => import("./AddBookView/AddBookView.tsx"));
const RentLogView = lazy(() => import("./RentLogView/RentLogView.tsx"));

export default function App() {
  const auth = useContext(AuthContext);
  const userType = auth?.session?.access ?? null;

  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<h1>Loading...</h1>}>
          <Routes>

            {/* ===== GENERAL ===== */}
            <Route path="/about-us" element={<AboutUs />} />

            {/* ===== NOT LOGGED ===== */}
            <Route
              path="/login"
              element={
                <ProtectedRoute mode={null}>
                  <Login />
                </ProtectedRoute>
              }
            />

            <Route
              path="/register"
              element={
                <ProtectedRoute mode={null}>
                  <Register />
                </ProtectedRoute>
              }
            />

            {/* ===== ROOT REDIRECT ===== */}
            <Route
              path="/"
              element={
                !userType ? <Navigate to="/login" /> : <Navigate to="/catalog" />
              }
            />

            {/* ===== SHARED ===== */}
            <Route
              path="/catalog"
              element={
                <ProtectedRoute mode={["user", "admin"]}>
                  <CatalogView />
                </ProtectedRoute>
              }
            />

            {/* ===== PROFILE ===== */}
            <Route
              path="/profile-admin"
              element={
                <ProtectedRoute mode="admin">
                  <AdminProfileView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile-user"
              element={
                <ProtectedRoute mode="user">
                  <UserProfileView />
                </ProtectedRoute>
              }
            />

            {/* ===== ADMIN ONLY ===== */}
            <Route
              path="/users-view"
              element={
                <ProtectedRoute mode="admin">
                  <UsersListView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-book"
              element={
                <ProtectedRoute mode="admin">
                  <AddBookView />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rented-books"
              element={
                <ProtectedRoute mode="admin">
                  <RentLogView />
                </ProtectedRoute>
              }
            />

            {/* ===== ERRORS ===== */}
            <Route path="/access-denied" element={<AccessDeniedError />} />
            <Route path="*" element={<Error404 />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
