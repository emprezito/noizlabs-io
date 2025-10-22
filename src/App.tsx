import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import Landing from "./pages/Landing";
import Arena from "./pages/Arena";
import CreateCategory from "./pages/CreateCategory";
import Launchpad from "./pages/Launchpad";
import Marketplace from "./pages/Marketplace";
import Staking from "./pages/Staking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/create-category" element={<CreateCategory />} />
          <Route path="/launchpad" element={<Launchpad />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/staking" element={<Staking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
