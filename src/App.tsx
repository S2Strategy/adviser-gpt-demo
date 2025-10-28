import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vault from "./pages/Vault";
import NotFound from "./pages/NotFound";
import { SavedSearchesPage } from "./components/SavedSearchesPage";
import { HistoryPage } from "./components/HistoryPage";
import { SavedSearchesProvider } from "./contexts/SavedSearchesContext";
import { SuggestedUpdates } from "./pages/SuggestedUpdates";
import { DuplicateDetail } from "./pages/DuplicateDetail";
import { ProfilePage } from "./components/ProfilePage";
import { FirmSettings } from "./pages/FirmSettings";
import { RIAOutreach } from "./pages/RIAOutreach";
import { Commentary } from "./pages/Commentary";
import { Insights } from "./pages/Insights";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SavedSearchesProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/vault/saved-searches" element={<SavedSearchesPage />} />
            <Route path="/vault/history" element={<HistoryPage />} />
            <Route path="/vault/suggested-updates" element={<SuggestedUpdates />} />
            <Route path="/vault/duplicates/:actionId" element={<DuplicateDetail />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/firm-settings" element={<FirmSettings />} />
            <Route path="/outreach" element={<RIAOutreach />} />
            <Route path="/commentary" element={<Commentary />} />
            <Route path="/insights" element={<Insights />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SavedSearchesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
