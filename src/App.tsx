import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { PortalIncorporadorLayout } from "@/components/portal-incorporador/PortalIncorporadorLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import React, { Suspense, lazy } from "react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Empreendimentos = lazy(() => import("./pages/Empreendimentos"));
const EmpreendimentoDetalhe = lazy(() => import("./pages/EmpreendimentoDetalhe"));
const MapaUnidadesPage = lazy(() => import("./pages/MapaUnidadesPage"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Usuarios = lazy(() => import("./pages/Usuarios"));
const Imobiliarias = lazy(() => import("./pages/Imobiliarias"));
const Incorporadoras = lazy(() => import("./pages/Incorporadoras"));
const Corretores = lazy(() => import("./pages/Corretores"));

const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Atividades = lazy(() => import("./pages/Atividades"));
const Forecast = lazy(() => import("./pages/Forecast"));
const Negociacoes = lazy(() => import("./pages/Negociacoes"));
const Propostas = lazy(() => import("./pages/Propostas"));
const Contratos = lazy(() => import("./pages/Contratos"));
const Comissoes = lazy(() => import("./pages/Comissoes"));
const PortalDashboard = lazy(() => import("./pages/PortalDashboard"));
const PortalEmpreendimentos = lazy(() => import("./pages/PortalEmpreendimentos"));
const PortalEmpreendimentoDetalhe = lazy(() => import("./pages/PortalEmpreendimentoDetalhe"));
const PortalSolicitacoes = lazy(() => import("./pages/PortalSolicitacoes"));
const ConfiguracaoNegociacoes = lazy(() => import("./pages/ConfiguracaoNegociacoes"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Marketing = lazy(() => import("./pages/Marketing"));
const MarketingCalendario = lazy(() => import("./pages/MarketingCalendario"));
const MarketingDetalhe = lazy(() => import("./pages/MarketingDetalhe"));
const EtapasTickets = lazy(() => import("./pages/EtapasTickets"));
const Eventos = lazy(() => import("./pages/Eventos"));
const EventoDetalhe = lazy(() => import("./pages/EventoDetalhe"));
const EventosCalendarioPage = lazy(() => import("./pages/EventosCalendario"));
const EventoTemplates = lazy(() => import("./pages/EventoTemplates"));
const Briefings = lazy(() => import("./pages/Briefings"));
const Financeiro = lazy(() => import("./pages/Financeiro"));
const Bonificacoes = lazy(() => import("./pages/Bonificacoes"));
const DRE = lazy(() => import("./pages/DRE"));
const MetasComerciais = lazy(() => import("./pages/MetasComerciais"));
const TiposParcela = lazy(() => import("./pages/TiposParcela"));
const AssinarContrato = lazy(() => import("./pages/AssinarContrato"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));
const DashboardMarketing = lazy(() => import("./pages/DashboardMarketing"));
const EquipeMarketing = lazy(() => import("./pages/EquipeMarketing"));
const TermosUso = lazy(() => import("./pages/TermosUso"));
const PoliticaPrivacidade = lazy(() => import("./pages/PoliticaPrivacidade"));
const PortalClientes = lazy(() => import("./pages/PortalClientes"));
const NovaPropostaComercial = lazy(() => import("./pages/NovaPropostaComercial"));
const SemAcesso = lazy(() => import("./pages/SemAcesso"));
const Planejamento = lazy(() => import("./pages/Planejamento"));
const PlanejamentoConfiguracoes = lazy(() => import("./pages/PlanejamentoConfiguracoes"));
const PortalCorretoresGestao = lazy(() => import("./pages/portal/PortalCorretoresGestao"));
const PortalMinhaImobiliaria = lazy(() => import("./pages/portal/PortalMinhaImobiliaria"));

// Portal Incorporador pages
const PortalIncorporadorDashboard = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorDashboard"));
const PortalIncorporadorExecutivo = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorExecutivo"));
const PortalIncorporadorForecast = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorForecast"));
const PortalIncorporadorMarketing = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorMarketing"));
const PortalIncorporadorPlanejamento = lazy(() => import("./pages/portal-incorporador/PortalIncorporadorPlanejamento"));

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
            <Route path="/assinar/:token" element={<AssinarContrato />} />
            <Route path="/termos" element={<TermosUso />} />
            <Route path="/privacidade" element={<PoliticaPrivacidade />} />
            <Route path="/sem-acesso" element={<SemAcesso />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/dashboard-executivo" element={
              <ProtectedRoute moduleName="dashboard" adminOnly>
                <DashboardExecutivo />
              </ProtectedRoute>
            } />
            <Route path="/empreendimentos" element={
              <ProtectedRoute moduleName="empreendimentos">
                <Empreendimentos />
              </ProtectedRoute>
            } />
            <Route path="/empreendimentos/:id" element={
              <ProtectedRoute moduleName="empreendimentos">
                <EmpreendimentoDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/mapa-unidades" element={
              <ProtectedRoute moduleName="unidades">
                <MapaUnidadesPage />
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute moduleName="clientes">
                <Clientes />
              </ProtectedRoute>
            } />
            <Route path="/atividades" element={
              <ProtectedRoute moduleName="atividades">
                <Atividades />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes" element={
              <ProtectedRoute moduleName="configuracoes">
                <Configuracoes />
              </ProtectedRoute>
            } />
            <Route path="/configuracoes/negociacoes" element={
              <ProtectedRoute moduleName="negociacoes_config">
                <ConfiguracaoNegociacoes />
              </ProtectedRoute>
            } />
            
            <Route path="/usuarios" element={
              <ProtectedRoute moduleName="usuarios" adminOnly>
                <Usuarios />
              </ProtectedRoute>
            } />
            <Route path="/imobiliarias" element={
              <ProtectedRoute moduleName="imobiliarias">
                <Imobiliarias />
              </ProtectedRoute>
            } />
            <Route path="/incorporadoras" element={
              <ProtectedRoute moduleName="incorporadoras">
                <Incorporadoras />
              </ProtectedRoute>
            } />
            <Route path="/corretores" element={
              <ProtectedRoute moduleName="corretores">
                <Corretores />
              </ProtectedRoute>
            } />
            <Route path="/forecast" element={
              <ProtectedRoute moduleName="forecast">
                <Forecast />
              </ProtectedRoute>
            } />
            <Route path="/metas-comerciais" element={
              <ProtectedRoute moduleName="forecast">
                <MetasComerciais />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes" element={
              <ProtectedRoute moduleName="negociacoes">
                <Negociacoes />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes/nova" element={
              <ProtectedRoute moduleName="negociacoes">
                <NovaPropostaComercial />
              </ProtectedRoute>
            } />
            <Route path="/negociacoes/editar/:id" element={
              <ProtectedRoute moduleName="negociacoes">
                <NovaPropostaComercial />
              </ProtectedRoute>
            } />
            {/* Redirect old /propostas to /negociacoes */}
            <Route path="/propostas" element={<Navigate to="/negociacoes" replace />} />
            <Route path="/solicitacoes" element={
              <ProtectedRoute moduleName="solicitacoes" adminOnly>
                <Solicitacoes />
              </ProtectedRoute>
            } />
            
            <Route path="/contratos" element={
              <ProtectedRoute 
                moduleName="contratos" 
                alternativeModules={['contratos_templates', 'contratos_variaveis']}
              >
                <Contratos />
              </ProtectedRoute>
            } />
            <Route path="/tipos-parcela" element={
              <ProtectedRoute moduleName="contratos_tipos_parcela">
                <TiposParcela />
              </ProtectedRoute>
            } />
            <Route path="/comissoes" element={
              <ProtectedRoute moduleName="comissoes">
                <Comissoes />
              </ProtectedRoute>
            } />
            <Route path="/financeiro" element={
              <ProtectedRoute moduleName="financeiro_fluxo">
                <Financeiro />
              </ProtectedRoute>
            } />
            <Route path="/bonificacoes" element={
              <ProtectedRoute moduleName="bonificacoes">
                <Bonificacoes />
              </ProtectedRoute>
            } />
            <Route path="/dre" element={
              <ProtectedRoute moduleName="financeiro_dre">
                <DRE />
              </ProtectedRoute>
            } />
            <Route path="/relatorios" element={
              <ProtectedRoute moduleName="relatorios">
                <Relatorios />
              </ProtectedRoute>
            } />
            <Route path="/auditoria" element={
              <ProtectedRoute moduleName="auditoria" adminOnly>
                <Auditoria />
              </ProtectedRoute>
            } />
            {/* Marketing e Criação */}
            <Route path="/marketing/dashboard" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <DashboardMarketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <Marketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing/equipe" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <EquipeMarketing />
              </ProtectedRoute>
            } />
            <Route path="/marketing/etapas" element={
              <ProtectedRoute moduleName="projetos_marketing_config" adminOnly>
                <EtapasTickets />
              </ProtectedRoute>
            } />
            <Route path="/marketing/calendario" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <MarketingCalendario />
              </ProtectedRoute>
            } />
            <Route path="/marketing/:id" element={
              <ProtectedRoute moduleName="projetos_marketing">
                <MarketingDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/marketing/briefings" element={
              <ProtectedRoute moduleName="briefings">
                <Briefings />
              </ProtectedRoute>
            } />
            
            {/* Planejamento */}
            <Route path="/planejamento" element={
              <ProtectedRoute moduleName="planejamento">
                <Planejamento />
              </ProtectedRoute>
            } />
            <Route path="/planejamento/configuracoes" element={
              <ProtectedRoute moduleName="planejamento_config" adminOnly>
                <PlanejamentoConfiguracoes />
              </ProtectedRoute>
            } />
            <Route path="/eventos" element={
              <ProtectedRoute moduleName="eventos">
                <Eventos />
              </ProtectedRoute>
            } />
            <Route path="/eventos/calendario" element={
              <ProtectedRoute moduleName="eventos">
                <EventosCalendarioPage />
              </ProtectedRoute>
            } />
            <Route path="/eventos/:id" element={
              <ProtectedRoute moduleName="eventos">
                <EventoDetalhe />
              </ProtectedRoute>
            } />
            <Route path="/eventos/templates" element={
              <ProtectedRoute moduleName="eventos_templates" adminOnly>
                <EventoTemplates />
              </ProtectedRoute>
            } />

            {/* Portal do Corretor - Layout aninhado */}
            <Route 
              path="/portal-corretor" 
              element={
                <ProtectedRoute moduleName="portal_corretor">
                  <PortalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalDashboard />} />
              <Route path="empreendimentos" element={<PortalEmpreendimentos />} />
              <Route path="empreendimentos/:id" element={<PortalEmpreendimentoDetalhe />} />
              <Route path="solicitacoes" element={<PortalSolicitacoes />} />
              <Route path="clientes" element={<PortalClientes />} />
              <Route path="corretores" element={<PortalCorretoresGestao />} />
              <Route path="minha-imobiliaria" element={<PortalMinhaImobiliaria />} />
            </Route>

            {/* Portal do Incorporador - Layout aninhado */}
            <Route 
              path="/portal-incorporador" 
              element={
                <ProtectedRoute moduleName="portal_incorporador">
                  <PortalIncorporadorLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PortalIncorporadorDashboard />} />
              <Route path="executivo" element={<PortalIncorporadorExecutivo />} />
              <Route path="forecast" element={<PortalIncorporadorForecast />} />
              <Route path="marketing" element={<PortalIncorporadorMarketing />} />
              <Route path="planejamento" element={<PortalIncorporadorPlanejamento />} />
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
