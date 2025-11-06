import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import NotificationBar from "./components/NotificationBar";
import AdvancedSearchBar from "./components/AdvancedSearchBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Incoming from "./pages/Incoming";
import Outgoing from "./pages/Outgoing";
import NewCorrespondence from "./pages/NewCorrespondence";
import CorrespondenceDetail from "./pages/CorrespondenceDetail";
import SearchPage from "./pages/SearchPage";
import ArchivePage from "./pages/ArchivePage";
import ImportCorrespondence from "./pages/ImportCorrespondence";
import NotFound from "./pages/NotFound";
import UsersManagement from "@/pages/UsersManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex min-h-screen" dir="rtl">
                  <div className="print:hidden">
                    <Sidebar />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="sticky top-0 z-40 bg-card border-b border-border py-4 print:hidden">
                      <h1 className="text-2xl font-bold text-center text-primary">مراسلات</h1>
                    </div>
                    <div className="print:hidden">
                      <NotificationBar />
                      <AdvancedSearchBar />
                    </div>
                    <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                      <Routes>
                        <Route path="/" element={<Incoming />} />
                        <Route path="/incoming" element={<Incoming />} />
                        <Route path="/outgoing" element={<Outgoing />} />
                        <Route path="/new" element={<NewCorrespondence />} />
                        <Route path="/edit/:id" element={<NewCorrespondence />} />
                        <Route path="/correspondence/:id" element={<CorrespondenceDetail />} />
                        <Route path="/search" element={<SearchPage />} />
                  <Route path="/archive" element={<ArchivePage />} />
                  <Route path="/import" element={<ImportCorrespondence />} />
                  <Route path="/settings" element={<Navigate to="/users" replace />} />
                  <Route path="/users" element={<UsersManagement />} />
                  <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
