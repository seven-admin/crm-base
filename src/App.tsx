import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ArqoProtectedRoute } from "@/components/arqo/ArqoProtectedRoute";
import { NexaProtectedRoute } from "@/components/nexa/NexaProtectedRoute";
import { PortalIncorporadorLayout } from "@/components/portal-incorporador/PortalIncorporadorLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense, lazy } from "react";

const ArqoRoleta = lazy(() => import("./pages/arqo/ArqoRoleta"));
const ArqoLeadsKanban = lazy(() => import("./pages/arqo/ArqoLeadsKanban"));
const ArqoForecast = lazy(() => import("./pages/arqo/ArqoForecast"));
const ArqoConfig = lazy(() => import("./pages/arqo/ArqoConfig"));
const ArqoAtividades = lazy(() => import("./pages/arqo/ArqoAtividades"));
const ArqoLeadDetail = lazy(() => import("./pages/arqo/ArqoLeadDetail"));
const ArqoAdmin = lazy(() => import("./pages/arqo/ArqoAdmin"));

const NexaAtividades = lazy(() => import("./pages/nexa/NexaAtividades"));
const NexaVisitaDetalhe = lazy(() => import("./pages/nexa/NexaVisitaDetalhe"));
const NexaDisponibilidade = lazy(() => import("./pages/nexa/NexaDisponibilidade"));
const NexaContratos = lazy(() => import("./pages/nexa/NexaContratos"));
const NexaContratosVariaveis = lazy(() => import("./pages/nexa/NexaContratosVariaveis"));
const NexaContratosTemplates = lazy(() => import("./pages/nexa/NexaContratosTemplates"));
const NexaContratoTemplateEditor = lazy(() => import("./pages/nexa/NexaContratoTemplateEditor"));
const NexaContratoNovo = lazy(() => import("./pages/nexa/NexaContratoNovo"));
const NexaContratosBlocos = lazy(() => import("./pages/nexa/NexaContratosBlocos"));
const NexaRenderVithoria = lazy(() => import("./pages/nexa/NexaRenderVithoria"));

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Empreendimentos = lazy(() => import("./pages/Empreendimentos"));
const EmpreendimentoDetalhe = lazy(() => import("./pages/EmpreendimentoDetalhe"));
const MapaUnidadesPage = lazy(() => import("./pages/MapaUnidadesPage"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Incorporadoras = lazy(() => import("./pages/Incorporadoras"));
const Imobiliarias = lazy(() => import("./pages/Imobiliarias"));
const Corretores = lazy(() => import("./pages/Corretores"));

const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const TermosUso = lazy(() => import("./pages/TermosUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const SemAcesso = lazy(() => import("./pages/SemAcesso"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const DesignTest = lazy(() => import("./pages/DesignTest"));
const MeuPerfil = lazy(() => import("./pages/MeuPerfil"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));


// Portal Incorporador
const PortalIncorporadorDisponibilidade = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorDisponibilidade"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<Auth />} />
                <Route path="/termos" element={<TermosUso />} />
                <Route path="/privacidade" element={<PoliticaPrivacidade />} />
                <Route path="/sem-acesso" element={<SemAcesso />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/design-test" element={<DesignTest />} />

                {/* Protected routes */}
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/empreendimentos" element={<ProtectedRoute moduleName="empreendimentos"><Empreendimentos /></ProtectedRoute>} />
                <Route path="/empreendimentos/:id" element={<ProtectedRoute moduleName="empreendimentos"><EmpreendimentoDetalhe /></ProtectedRoute>} />
                <Route path="/mapa-unidades" element={<ProtectedRoute moduleName="unidades"><MapaUnidadesPage /></ProtectedRoute>} />
                <Route path="/clientes" element={<ProtectedRoute moduleName="clientes"><Clientes /></ProtectedRoute>} />
                <Route path="/usuarios" element={<ProtectedRoute moduleName="usuarios" adminOnly><Usuarios /></ProtectedRoute>} />
               <Route path="/incorporadoras" element={<ProtectedRoute moduleName="incorporadoras"><Incorporadoras /></ProtectedRoute>} />
               <Route path="/imobiliarias" element={<ProtectedRoute moduleName="imobiliarias"><Imobiliarias /></ProtectedRoute>} />
               <Route path="/corretores" element={<ProtectedRoute moduleName="corretores"><Corretores /></ProtectedRoute>} />
                <Route path="/auditoria" element={<ProtectedRoute moduleName="auditoria" adminOnly><Auditoria /></ProtectedRoute>} />
                <Route path="/meu-perfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />


                {/* Arqo */}
                <Route path="/arqo/roleta" element={<ArqoProtectedRoute moduleName="arqo_roleta"><ArqoRoleta /></ArqoProtectedRoute>} />
                <Route path="/arqo/leads" element={<ArqoProtectedRoute moduleName="arqo_leads"><ArqoLeadsKanban /></ArqoProtectedRoute>} />
                <Route path="/arqo/leads/:id" element={<ArqoProtectedRoute moduleName="arqo_leads"><ArqoLeadDetail /></ArqoProtectedRoute>} />
                <Route path="/arqo/forecast" element={<ArqoProtectedRoute moduleName="arqo_forecast"><ArqoForecast /></ArqoProtectedRoute>} />
                <Route path="/arqo/config" element={<ArqoProtectedRoute moduleName="arqo_config"><ArqoConfig /></ArqoProtectedRoute>} />
                <Route path="/arqo/admin" element={<ArqoProtectedRoute moduleName="arqo_admin"><ArqoAdmin /></ArqoProtectedRoute>} />
                <Route path="/arqo/atividades" element={<ArqoProtectedRoute moduleName="arqo_atividades"><ArqoAtividades /></ArqoProtectedRoute>} />

                {/* Nexa */}
                <Route path="/nexa/agenda" element={<NexaProtectedRoute moduleName="nexa_agenda"><NexaAtividades /></NexaProtectedRoute>} />
                <Route path="/nexa/visitas/:id" element={<NexaProtectedRoute moduleName="nexa_agenda"><NexaVisitaDetalhe /></NexaProtectedRoute>} />
                <Route path="/nexa/disponibilidade" element={<NexaProtectedRoute moduleName="nexa_disponibilidade"><NexaDisponibilidade /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos" element={<NexaProtectedRoute moduleName="nexa_contratos"><NexaContratos /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos/novo" element={<NexaProtectedRoute moduleName="nexa_contratos"><NexaContratoNovo /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos/variaveis" element={<NexaProtectedRoute moduleName="nexa_contratos_variaveis"><NexaContratosVariaveis /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos/blocos" element={<NexaProtectedRoute moduleName="nexa_contratos_blocos"><NexaContratosBlocos /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos/modelos" element={<NexaProtectedRoute moduleName="nexa_contratos_modelos"><NexaContratosTemplates /></NexaProtectedRoute>} />
                <Route path="/nexa/contratos/modelos/:id" element={<NexaProtectedRoute moduleName="nexa_contratos_modelos"><NexaContratoTemplateEditor /></NexaProtectedRoute>} />
                <Route path="/nexa/render-vithoria" element={<NexaProtectedRoute><NexaRenderVithoria /></NexaProtectedRoute>} />


                {/* Portal do Incorporador */}
                <Route
                  path="/portal-incorporador"
                  element={
                    <ProtectedRoute moduleName="portal_incorporador">
                      <PortalIncorporadorLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<PortalIncorporadorDisponibilidade />} />
                  <Route path="disponibilidade" element={<PortalIncorporadorDisponibilidade />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
