import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import AuthPage from "./pages/AuthPage";
import LocationSetup from "./pages/LocationSetup";
import { useAuth } from "./_core/hooks/useAuth";
import { trpc } from "./lib/trpc";

function AppContent() {
  const { loading, isAuthenticated } = useAuth();
  const farmQuery = trpc.farm.profile.useQuery(undefined, { enabled: isAuthenticated, staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true });

  if (loading || (isAuthenticated && farmQuery.isLoading)) return <div className="auth-loading"><div className="auth-loading-mark">✦</div><p>Preparing your farm workspace…</p></div>;
  if (!isAuthenticated) return <AuthPage />;
  const needsLocation = farmQuery.data?.location === "India" || farmQuery.data?.district === "Not set";
  if (needsLocation) return <LocationSetup onComplete={() => farmQuery.refetch()} />;
  return <Home />;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AppContent /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
