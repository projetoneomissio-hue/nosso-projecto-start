import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Atividades from "./pages/Atividades";
import Alunos from "./pages/Alunos";
import Professores from "./pages/Professores";
import Financeiro from "./pages/Financeiro";
import Predio from "./pages/Predio";
import Configuracoes from "./pages/Configuracoes";
import MfaSetup from "./pages/MfaSetup";
import MfaVerify from "./pages/MfaVerify";
import NotFound from "./pages/NotFound";

// Direção
import Usuarios from "./pages/direcao/Usuarios";
import Convites from "./pages/direcao/Convites";
import Matriculas from "./pages/direcao/Matriculas";

// Coordenação
import TurmasCoordenacao from "./pages/coordenacao/Turmas";
import MatriculasPendentes from "./pages/coordenacao/MatriculasPendentes";
import Inadimplentes from "./pages/coordenacao/Inadimplentes";
import Relatorios from "./pages/coordenacao/Relatorios";

// Professores
import Turmas from "./pages/professor/Turmas";
import AlunosProfessor from "./pages/professor/Alunos";
import Presenca from "./pages/professor/Presenca";
import Observacoes from "./pages/professor/Observacoes";
import Comissoes from "./pages/professor/Comissoes";

// Responsáveis
import AtividadesMatriculadas from "./pages/responsavel/AtividadesMatriculadas";
import Pagamentos from "./pages/responsavel/Pagamentos";
import RelatoriosAluno from "./pages/responsavel/RelatoriosAluno";
import NovaMatricula from "./pages/responsavel/NovaMatricula";
import Anamnese from "./pages/responsavel/Anamnese";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/mfa-setup" element={<MfaSetup />} />
      <Route path="/mfa-verify" element={<MfaVerify />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/atividades" element={<ProtectedRoute><Atividades /></ProtectedRoute>} />
      <Route path="/alunos" element={<ProtectedRoute><Alunos /></ProtectedRoute>} />
      <Route path="/professores" element={<ProtectedRoute><Professores /></ProtectedRoute>} />
      <Route path="/financeiro" element={<ProtectedRoute><Financeiro /></ProtectedRoute>} />
      <Route path="/predio" element={<ProtectedRoute><Predio /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />

      {/* Direção */}
      <Route path="/direcao/usuarios" element={<ProtectedRoute allowedRoles={["direcao"]}><Usuarios /></ProtectedRoute>} />
      <Route path="/convites" element={<ProtectedRoute allowedRoles={["direcao"]}><Convites /></ProtectedRoute>} />
      <Route path="/direcao/matriculas" element={<ProtectedRoute allowedRoles={["direcao"]}><Matriculas /></ProtectedRoute>} />

      {/* Coordenação */}
      <Route path="/coordenacao/turmas" element={<ProtectedRoute allowedRoles={["coordenacao"]}><TurmasCoordenacao /></ProtectedRoute>} />
      <Route path="/coordenacao/matriculas-pendentes" element={<ProtectedRoute allowedRoles={["coordenacao"]}><MatriculasPendentes /></ProtectedRoute>} />
      <Route path="/coordenacao/inadimplentes" element={<ProtectedRoute allowedRoles={["coordenacao"]}><Inadimplentes /></ProtectedRoute>} />
      <Route path="/coordenacao/relatorios" element={<ProtectedRoute allowedRoles={["coordenacao"]}><Relatorios /></ProtectedRoute>} />

      {/* Professores */}
      <Route path="/professor/turmas" element={<ProtectedRoute allowedRoles={["professor"]}><Turmas /></ProtectedRoute>} />
      <Route path="/professor/alunos" element={<ProtectedRoute allowedRoles={["professor"]}><AlunosProfessor /></ProtectedRoute>} />
      <Route path="/professor/presenca" element={<ProtectedRoute allowedRoles={["professor"]}><Presenca /></ProtectedRoute>} />
      <Route path="/professor/observacoes" element={<ProtectedRoute allowedRoles={["professor"]}><Observacoes /></ProtectedRoute>} />
      <Route path="/professor/comissoes" element={<ProtectedRoute allowedRoles={["professor"]}><Comissoes /></ProtectedRoute>} />

      {/* Responsáveis */}
      <Route path="/responsavel/nova-matricula" element={<ProtectedRoute allowedRoles={["responsavel"]}><NovaMatricula /></ProtectedRoute>} />
      <Route path="/responsavel/atividades-matriculadas" element={<ProtectedRoute allowedRoles={["responsavel"]}><AtividadesMatriculadas /></ProtectedRoute>} />
      <Route path="/responsavel/pagamentos" element={<ProtectedRoute allowedRoles={["responsavel"]}><Pagamentos /></ProtectedRoute>} />
      <Route path="/responsavel/relatorios-aluno" element={<ProtectedRoute allowedRoles={["responsavel"]}><RelatoriosAluno /></ProtectedRoute>} />
      <Route path="/responsavel/anamnese" element={<ProtectedRoute allowedRoles={["responsavel"]}><Anamnese /></ProtectedRoute>} />

      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
