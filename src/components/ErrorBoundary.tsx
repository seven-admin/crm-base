import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Ocorreu um erro inesperado. Por favor, tente novamente ou volte para a página inicial.
          </p>
          {this.state.error && (
            <details className="mb-6 text-left max-w-lg">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-3">
            <Button onClick={this.handleRetry} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
            <Button onClick={this.handleGoHome}>
              <Home className="mr-2 h-4 w-4" />
              Página inicial
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
