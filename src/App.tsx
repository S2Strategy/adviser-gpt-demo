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
import { AuthProvider } from "./contexts/AuthContext";
import { SuggestedUpdates } from "./pages/SuggestedUpdates";
import { DuplicateDetail } from "./pages/DuplicateDetail";
import { ProfilePage } from "./components/ProfilePage";
import { FirmSettings } from "./pages/FirmSettings";
import { RIAOutreach } from "./pages/RIAOutreach";
import { Commentary } from "./pages/Commentary";
import { Drafts } from "./pages/Drafts";
import { AddContent } from "./pages/AddContent";
import FileUpload from "./pages/FileUpload";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SavedSearchesProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes - no authentication required */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes - authentication required */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/vault" element={<ProtectedRoute><Vault /></ProtectedRoute>} />
              <Route path="/vault/saved-searches" element={<ProtectedRoute><SavedSearchesPage /></ProtectedRoute>} />
              <Route path="/vault/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/vault/suggested-updates" element={<ProtectedRoute><SuggestedUpdates /></ProtectedRoute>} />
              <Route path="/vault/duplicates/:actionId" element={<ProtectedRoute><DuplicateDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/firm-settings" element={<ProtectedRoute><FirmSettings /></ProtectedRoute>} />
              <Route path="/outreach" element={<ProtectedRoute><RIAOutreach /></ProtectedRoute>} />
              <Route path="/commentary" element={<ProtectedRoute><Commentary /></ProtectedRoute>} />
              <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
              <Route path="/vault/add-content" element={<ProtectedRoute><AddContent /></ProtectedRoute>} />
              <Route path="/file-upload" element={<ProtectedRoute><FileUpload /></ProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SavedSearchesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
