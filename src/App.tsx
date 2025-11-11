import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import Incoming from "./pages/Incoming";
import Sent from "./pages/Sent";
import Outgoing from "./pages/Outgoing";
import NewCorrespondence from "./pages/NewCorrespondence";
import CorrespondenceDetail from "./pages/CorrespondenceDetail";
import SearchPage from "./pages/SearchPage";
import ArchivePage from "./pages/ArchivePage";
import ImportCorrespondence from "./pages/ImportCorrespondence";
import NotFound from "./pages/NotFound";
import UsersManagement from "@/pages/UsersManagement";
import AdvancedSearchPage from "@/pages/AdvancedSearchPage";
import ReportsPage from "@/pages/ReportsPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="claude" themes={["claude", "dark"]}>
        <BrowserRouter>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route
                path="/incoming"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <Incoming />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sent"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <Sent />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/outgoing"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <Outgoing />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <NewCorrespondence />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit/:id"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <NewCorrespondence />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/correspondence/:id"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <CorrespondenceDetail />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/search"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <SearchPage />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/advanced-search"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <AdvancedSearchPage />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/archive"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <ArchivePage />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/import"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <ImportCorrespondence />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <UsersManagement />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <div className="flex min-h-screen" dir="rtl">
                      <div className="print:hidden">
                        <Sidebar />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="print:hidden">
                          <TopBar />
                        </div>
                        <main className="flex-1 p-8 overflow-auto bg-background print:p-0 print:overflow-visible">
                          <ReportsPage />
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </TooltipProvider>
      </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
