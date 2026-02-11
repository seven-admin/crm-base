import { Link } from 'react-router-dom';
import { useConfiguracao } from '@/hooks/useConfiguracoesSistema';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import logo from '@/assets/logo.png';

const PoliticaPrivacidade = () => {
  const { data: config, isLoading } = useConfiguracao('politica_privacidade');

  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();
      
      // Headings
      if (trimmed.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-semibold mt-6 mb-3">{trimmed.replace('## ', '')}</h2>;
      }
      if (trimmed.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-8 mb-4">{trimmed.replace('# ', '')}</h1>;
      }
      
      // List items
      if (trimmed.startsWith('- ')) {
        return <li key={index} className="ml-6 list-disc">{trimmed.replace('- ', '')}</li>;
      }
      
      // Bold text (simple replacement)
      if (trimmed.startsWith('**') && trimmed.includes(':**')) {
        const parts = trimmed.split(':**');
        const label = parts[0].replace(/\*\*/g, '');
        const rest = parts[1];
        return (
          <p key={index} className="mb-2">
            <strong>{label}:</strong>{rest}
          </p>
        );
      }
      
      // Empty line
      if (!trimmed) {
        return <br key={index} />;
      }
      
      // Regular paragraph
      return <p key={index} className="mb-2">{trimmed.replace(/\*\*/g, '')}</p>;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/auth">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
            <span className="font-semibold text-lg">Seven Group 360</span>
          </div>
        </div>

        <div className="card-elevated p-6 md:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : config?.valor ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              {renderContent(config.valor)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Política de privacidade não configurada.
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link to="/auth">
            <Button variant="outline">Voltar ao Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PoliticaPrivacidade;
