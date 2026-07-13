export default function NexaRenderVithoria() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      <div className="px-4 md:px-6 py-3 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">Render Vithória</h1>
      </div>
      <iframe
        src="https://render.sistemasvn.com.br/empreendimento/vithoria-do-sol"
        title="Render Vithória"
        className="flex-1 w-full border-0"
        allow="fullscreen; autoplay; clipboard-read; clipboard-write"
        allowFullScreen
      />
    </div>
  );
}
