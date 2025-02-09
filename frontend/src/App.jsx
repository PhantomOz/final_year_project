import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NotificationProvider } from "./context/NotificationContext";
import { store, persistor } from "./store";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import UserManagement from "./pages/UserManagement";
import TransactionHistory from "./pages/TransactionHistory";
import { PWAInstallButton } from "./components/PWAInstallButton";

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Admin-only routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Products />
                  </PrivateRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <Analytics />
                  </PrivateRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <PrivateRoute requireAdmin={true}>
                    <UserManagement />
                  </PrivateRoute>
                }
              />

              {/* Cashier-accessible routes */}
              <Route
                path="/transactions"
                element={
                  <PrivateRoute requireAdmin={false}>
                    <Transactions />
                  </PrivateRoute>
                }
              />

              {/* Add TransactionHistory route */}
              <Route
                path="/transaction-history"
                element={
                  <PrivateRoute requireAdmin={false}>
                    <TransactionHistory />
                  </PrivateRoute>
                }
              />

              {/* Redirect root to appropriate page based on role */}
              <Route
                path="/"
                element={
                  <PrivateRoute requireAdmin={false}>
                    <Navigate to="/transactions" replace />
                  </PrivateRoute>
                }
              />
            </Routes>
            <PWAInstallButton />
          </BrowserRouter>
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
