import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, ProtectedRoute } from "../public/UserAuth";

// general (public)
const AboutUs = lazy(() => import("./AboutUs"));
import { Error404, AccessDeniedError } from "./Errors";

// auth (not logged)
const Login = lazy(() => import("./login/Login"));
const PasswordReset = lazy(() => import("./login/PasswordReset"));
const Register = lazy(() => import("./login/Register"));

// shared (user + admin)
const CatalogView = lazy(() => import("./general_elements/CatalogView"));

// user only
const UserProfileView = lazy(() => import("./elements_user/UserProfileView"));

// admin only
const AdminProfileView = lazy(() => import("./elements_admin/AdminProfileView"));
const UsersListView = lazy(() => import("./elements_admin/UsersListView"));
const AddBookView = lazy(() => import("./elements_admin/AddBookView"));
const RentedBooksListView = lazy(() => import("./elements_admin/RentedBooksListView"));

export default function App() {
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
              path="/reset-password"
              element={
                <ProtectedRoute mode={null}>
                  <PasswordReset />
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

            <Route path="/" element={<Navigate to="/login" />} />

            {/* ===== SHARED ===== */}
            <Route
              path="/catalog"
              element={
                <ProtectedRoute mode="user">
                  <CatalogView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/catalog"
              element={
                <ProtectedRoute mode="admin">
                  <CatalogView />
                </ProtectedRoute>
              }
            />

            {/* ===== USER ONLY ===== */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute mode="user" reroute_path="/catalog">
                  <UserProfileView />
                </ProtectedRoute>
              }
            />

            {/* ===== ADMIN ONLY ===== */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute mode="admin" reroute_path="/catalog">
                  <AdminProfileView />
                </ProtectedRoute>
              }
            />

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
                  <RentedBooksListView />
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
