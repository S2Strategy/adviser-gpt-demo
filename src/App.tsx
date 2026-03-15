import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TourProvider } from "./contexts/TourContext";
import { TourOverlay } from "./components/tour/TourOverlay";
import Index from "./pages/Index";
import Vault from "./pages/Vault";
import NotFound from "./pages/NotFound";
import { SavedSearchesPage } from "./components/SavedSearchesPage";
import { HistoryPage } from "./components/HistoryPage";
import { SavedSearchesProvider } from "./contexts/SavedSearchesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { DraftsProvider } from "./contexts/DraftsContext";
import { SuggestedUpdates } from "./pages/SuggestedUpdates";
import { DuplicateDetail } from "./pages/DuplicateDetail";
import { ProfilePage } from "./components/ProfilePage";
import { FirmSettings } from "./pages/FirmSettings";
import { Commentary } from "./pages/Commentary";
import { Drafts } from "./pages/Drafts";
import { AddContent } from "./pages/AddContent";
import WordPluginDemo from "./pages/WordPluginDemo";
import FileUpload from "./pages/FileUpload";
import SearchResults from "./pages/SearchResults";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SavedSearchesProvider>
          <DraftsProvider>
            <TourProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <TourOverlay />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/vault/saved-searches" element={<SavedSearchesPage />} />
              <Route path="/vault/history" element={<HistoryPage />} />
              <Route path="/vault/suggested-updates" element={<SuggestedUpdates />} />
              <Route path="/vault/duplicates/:actionId" element={<DuplicateDetail />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/firm-settings" element={<FirmSettings />} />
              <Route path="/commentary" element={<Commentary />} />
              <Route path="/drafts" element={<Drafts />} />
              <Route path="/vault/add-content" element={<AddContent />} />
              <Route path="/word-plugin-demo" element={<WordPluginDemo />} />
              <Route path="/file-upload" element={<FileUpload />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </TourProvider>
          </DraftsProvider>
        </SavedSearchesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

