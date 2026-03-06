import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import OrdensServico from "./pages/OrdensServico";
import Equipamentos from "./pages/Equipamentos";
import Veiculos from "./pages/Veiculos";
import Empresas from "./pages/Empresas";
import Tecnicos from "./pages/Tecnicos";
import Assistente from "./pages/Assistente";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ordens" element={<OrdensServico />} />
              <Route path="/equipamentos" element={<Equipamentos />} />
              <Route path="/veiculos" element={<Veiculos />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/tecnicos" element={<Tecnicos />} />
              <Route path="/assistente" element={<Assistente />} />
              <Route path="/acompanhamento" element={<PlaceholderPage />} />
              <Route path="/estoque" element={<PlaceholderPage />} />
              <Route path="/pedidos" element={<PlaceholderPage />} />
              <Route path="/manutencoes" element={<PlaceholderPage />} />
              <Route path="/consulta-veiculos" element={<PlaceholderPage />} />
              <Route path="/contrasenha" element={<PlaceholderPage />} />
              <Route path="/jammer" element={<PlaceholderPage />} />
              <Route path="/produtos" element={<PlaceholderPage />} />
              <Route path="/categorias-tecnicos" element={<PlaceholderPage />} />
              <Route path="/usuarios" element={<PlaceholderPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
