import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Vault from "./pages/Vault";
import NotFound from "./pages/NotFound";
import { SavedSearchesPage } from "./components/SavedSearchesPage";
import { SavedSearchesProvider } from "./contexts/SavedSearchesContext";
import { SuggestedUpdates } from "./pages/SuggestedUpdates";
import { DuplicateDetail } from "./pages/DuplicateDetail";

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
            <Route path="/vault/search" element={<Vault />} />
            <Route path="/vault/file" element={<Vault />} />
            <Route path="/vault/saved-searches" element={<SavedSearchesPage />} />
            <Route path="/vault/suggested-updates" element={<SuggestedUpdates />} />
            <Route path="/vault/duplicates/:actionId" element={<DuplicateDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SavedSearchesProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
