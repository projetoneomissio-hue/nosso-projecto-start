import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Atividades from "./pages/Atividades";
import Alunos from "./pages/Alunos";
import Professores from "./pages/Professores";
import Financeiro from "./pages/Financeiro";
import Predio from "./pages/Predio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/atividades" element={<Atividades />} />
          <Route path="/alunos" element={<Alunos />} />
          <Route path="/professores" element={<Professores />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/predio" element={<Predio />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
