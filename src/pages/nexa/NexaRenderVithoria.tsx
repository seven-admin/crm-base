import { MainLayout } from '@/components/layout/MainLayout';

export default function NexaRenderVithoria() {
  return (
    <MainLayout title="Render Vithória" subtitle="Visualização interativa do empreendimento" fluid contentClassName="p-0 md:p-0 lg:p-0">
      <div className="mx-4 mb-4 mt-4 flex h-[calc(100vh-13rem)] min-h-[560px] flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-card md:mx-6 lg:mx-8">
      <iframe
        src="https://render.sistemasvn.com.br/empreendimento/vithoria-do-sol"
        title="Render Vithória"
        className="flex-1 w-full border-0"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        allowFullScreen
      />
      </div>
    </MainLayout>
  );
}
