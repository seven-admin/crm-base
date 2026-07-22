import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="login-canvas relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0c0a] p-6">
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/50 bg-[#f7f3ed]/95 p-8 text-center shadow-popover backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <MapPinned className="h-7 w-7" />
        </div>
        <p className="text-sm font-semibold text-primary">Erro 404</p>
        <h1 className="mt-2 text-2xl font-semibold">Página não encontrada</h1>
        <p className="mb-6 mt-2 text-sm leading-relaxed text-muted-foreground">
          O endereço acessado não existe ou não está mais disponível.
        </p>
        <Button asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4" />Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
