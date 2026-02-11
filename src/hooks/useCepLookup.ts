import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface CepData {
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function useCepLookup() {
  const [isLoading, setIsLoading] = useState(false);

  const buscarCep = useCallback(async (cep: string): Promise<CepData | null> => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return null;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }

      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast({
          title: 'CEP não encontrado',
          description: 'Verifique o CEP digitado e tente novamente.',
          variant: 'destructive',
        });
        return null;
      }

      return {
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || '',
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        title: 'Erro ao buscar CEP',
        description: 'Não foi possível buscar o endereço. Tente novamente.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { buscarCep, isLoading };
}
