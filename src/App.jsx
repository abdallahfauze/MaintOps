import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ThemeProvider from './lib/ThemeProvider';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import RequesterNew from './pages/RequesterNew';
import AppLayout from './components/shared/AppLayout';
import PendingApproval from './pages/PendingApproval';
import PostSignup from './pages/PostSignup';
import RequestAccess from './pages/RequestAccess';
import Login from './pages/Login';
import { lazy, Suspense } from 'react';

const Reporting = lazy(() => import('./pages/Reporting'));
const Stores = lazy(() => import('./pages/Stores'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, user } = useAuth();

  if (isLoadingAuth) {
    return <PageLoader />;
  }

  const role = user?.role || "";
  const isPending = role.startsWith("pending_");

  if (user && isPending) {
    return <PendingApproval />;
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/login" element={<Login />} />
      <Route path="/post-signup" element={<PostSignup />} />
      <Route element={<AppLayout />}>
        {role && !role.startsWith("pending_") && (
          <Route path="/dashboard" element={<Dashboard />} />
        )}
        {(role === "admin" || role === "requester" || role === "leadership" || role === "coordinator") && (
          <Route path="/requester/new" element={<RequesterNew />} />
        )}
        {(role === "admin" || role === "leadership" || role === "coordinator") && (
          <>
            <Route path="/reporting" element={<Suspense fallback={<PageLoader />}><Reporting /></Suspense>} />
            <Route path="/stores" element={<Suspense fallback={<PageLoader />}><Stores /></Suspense>} />
          </>
        )}
        {role === "requester" && (
          <Route path="/stores" element={<Suspense fallback={<PageLoader />}><Stores /></Suspense>} />
        )}
        {role === "admin" && (
          <Route path="/admin-users" element={<Suspense fallback={<PageLoader />}><AdminUsers /></Suspense>} />
        )}
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
