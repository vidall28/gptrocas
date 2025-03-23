
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { AppLayout } from "@/components/Layout/AppLayout";

// Pages
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import RecordExchange from "@/pages/record-exchange";
import History from "@/pages/history";
import Approvals from "@/pages/approvals";
import Products from "@/pages/products";
import Users from "@/pages/users";
import Reports from "@/pages/reports";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Redirect root to login */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              
              {/* Protected Routes */}
              <Route path="/" element={<AppLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="record" element={<RecordExchange />} />
                <Route path="history" element={<History />} />
                <Route path="approvals" element={<Approvals />} />
                <Route path="products" element={<Products />} />
                <Route path="users" element={<Users />} />
                <Route path="reports" element={<Reports />} />
              </Route>
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
