export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      atividade_comentarios: {
        Row: {
          atividade_id: string
          comentario: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          atividade_id: string
          comentario: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          atividade_id?: string
          comentario?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividade_comentarios_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividade_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          categoria: string
          cliente_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string
          data_followup: string | null
          data_inicio: string
          deadline_date: string | null
          empreendimento_id: string | null
          gestor_id: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          imobiliaria_id: string | null
          motivo_cancelamento: string | null
          observacoes: string | null
          requer_followup: boolean | null
          resultado: string | null
          status: string
          temperatura_cliente: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          cliente_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim: string
          data_followup?: string | null
          data_inicio: string
          deadline_date?: string | null
          empreendimento_id?: string | null
          gestor_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          imobiliaria_id?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          requer_followup?: boolean | null
          resultado?: string | null
          status?: string
          temperatura_cliente?: string | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string
          data_followup?: string | null
          data_inicio?: string
          deadline_date?: string | null
          empreendimento_id?: string | null
          gestor_id?: string | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          imobiliaria_id?: string | null
          motivo_cancelamento?: string | null
          observacoes?: string | null
          requer_followup?: boolean | null
          resultado?: string | null
          status?: string
          temperatura_cliente?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocos: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          is_active: boolean
          nome: string
          total_andares: number | null
          unidades_por_andar: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          is_active?: boolean
          nome: string
          total_andares?: number | null
          unidades_por_andar?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          is_active?: boolean
          nome?: string
          total_andares?: number | null
          unidades_por_andar?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      bonificacoes: {
        Row: {
          created_at: string | null
          data_pagamento: string | null
          empreendimento_id: string
          id: string
          meta_unidades: number | null
          nf_numero: string | null
          nf_quitada: boolean | null
          observacoes: string | null
          percentual_atingimento: number | null
          periodo_fim: string
          periodo_inicio: string
          status: string | null
          tipo: string
          unidades_vendidas: number | null
          updated_at: string | null
          user_id: string
          valor_bonificacao: number | null
        }
        Insert: {
          created_at?: string | null
          data_pagamento?: string | null
          empreendimento_id: string
          id?: string
          meta_unidades?: number | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          observacoes?: string | null
          percentual_atingimento?: number | null
          periodo_fim: string
          periodo_inicio: string
          status?: string | null
          tipo: string
          unidades_vendidas?: number | null
          updated_at?: string | null
          user_id: string
          valor_bonificacao?: number | null
        }
        Update: {
          created_at?: string | null
          data_pagamento?: string | null
          empreendimento_id?: string
          id?: string
          meta_unidades?: number | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          observacoes?: string | null
          percentual_atingimento?: number | null
          periodo_fim?: string
          periodo_inicio?: string
          status?: string | null
          tipo?: string
          unidades_vendidas?: number | null
          updated_at?: string | null
          user_id?: string
          valor_bonificacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bonificacoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          bloco_id: string | null
          coberto: boolean
          created_at: string | null
          empreendimento_id: string
          id: string
          is_active: boolean
          numero: string
          observacoes: string | null
          status: string
          tipo: string
          unidade_id: string | null
          updated_at: string | null
          valor: number | null
        }
        Insert: {
          bloco_id?: string | null
          coberto?: boolean
          created_at?: string | null
          empreendimento_id: string
          id?: string
          is_active?: boolean
          numero: string
          observacoes?: string | null
          status?: string
          tipo?: string
          unidade_id?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Update: {
          bloco_id?: string | null
          coberto?: boolean
          created_at?: string | null
          empreendimento_id?: string
          id?: string
          is_active?: boolean
          numero?: string
          observacoes?: string | null
          status?: string
          tipo?: string
          unidade_id?: string | null
          updated_at?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "boxes_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      briefing_referencias: {
        Row: {
          briefing_id: string
          created_at: string | null
          id: string
          tipo: string
          titulo: string | null
          url: string
        }
        Insert: {
          briefing_id: string
          created_at?: string | null
          id?: string
          tipo: string
          titulo?: string | null
          url: string
        }
        Update: {
          briefing_id?: string
          created_at?: string | null
          id?: string
          tipo?: string
          titulo?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefing_referencias_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
        ]
      }
      briefings: {
        Row: {
          cliente: string
          codigo: string
          composicao: string | null
          created_at: string
          criado_por: string | null
          data_entrega: string | null
          data_triagem: string | null
          diretrizes_visuais: string | null
          empreendimento_id: string | null
          estilo_visual: string | null
          formato_peca: string | null
          head_titulo: string | null
          id: string
          importante: string | null
          is_active: boolean | null
          mensagem_chave: string | null
          objetivo: string | null
          observacoes: string | null
          referencia: string | null
          referencia_imagem_url: string | null
          status: Database["public"]["Enums"]["briefing_status"]
          sub_complemento: string | null
          tema: string
          tom_comunicacao: string | null
          triado_por: string | null
          updated_at: string
        }
        Insert: {
          cliente: string
          codigo: string
          composicao?: string | null
          created_at?: string
          criado_por?: string | null
          data_entrega?: string | null
          data_triagem?: string | null
          diretrizes_visuais?: string | null
          empreendimento_id?: string | null
          estilo_visual?: string | null
          formato_peca?: string | null
          head_titulo?: string | null
          id?: string
          importante?: string | null
          is_active?: boolean | null
          mensagem_chave?: string | null
          objetivo?: string | null
          observacoes?: string | null
          referencia?: string | null
          referencia_imagem_url?: string | null
          status?: Database["public"]["Enums"]["briefing_status"]
          sub_complemento?: string | null
          tema: string
          tom_comunicacao?: string | null
          triado_por?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string
          codigo?: string
          composicao?: string | null
          created_at?: string
          criado_por?: string | null
          data_entrega?: string | null
          data_triagem?: string | null
          diretrizes_visuais?: string | null
          empreendimento_id?: string | null
          estilo_visual?: string | null
          formato_peca?: string | null
          head_titulo?: string | null
          id?: string
          importante?: string | null
          is_active?: boolean | null
          mensagem_chave?: string | null
          objetivo?: string | null
          observacoes?: string | null
          referencia?: string | null
          referencia_imagem_url?: string | null
          status?: Database["public"]["Enums"]["briefing_status"]
          sub_complemento?: string | null
          tema?: string
          tom_comunicacao?: string | null
          triado_por?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "briefings_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_fluxo: {
        Row: {
          aprovacao_automatica: boolean | null
          categoria_pai_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          nome: string
          ordem: number | null
          tipo: string
          updated_at: string | null
        }
        Insert: {
          aprovacao_automatica?: boolean | null
          categoria_pai_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          ordem?: number | null
          tipo: string
          updated_at?: string | null
        }
        Update: {
          aprovacao_automatica?: boolean | null
          categoria_pai_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          ordem?: number | null
          tipo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_fluxo_categoria_pai_id_fkey"
            columns: ["categoria_pai_id"]
            isOneToOne: false
            referencedRelation: "categorias_fluxo"
            referencedColumns: ["id"]
          },
        ]
      }
      centro_custo_empreendimentos: {
        Row: {
          centro_custo_id: string
          created_at: string | null
          empreendimento_id: string
          id: string
        }
        Insert: {
          centro_custo_id: string
          created_at?: string | null
          empreendimento_id: string
          id?: string
        }
        Update: {
          centro_custo_id?: string
          created_at?: string | null
          empreendimento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "centro_custo_empreendimentos_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centro_custo_empreendimentos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      centros_custo: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cliente_interacoes: {
        Row: {
          cliente_id: string
          created_at: string | null
          descricao: string | null
          id: string
          tipo: string
          user_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo: string
          user_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_interacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_socios: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          observacao: string | null
          percentual_participacao: number | null
          socio_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          percentual_participacao?: number | null
          socio_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          observacao?: string | null
          percentual_participacao?: number | null
          socio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cliente_socios_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      cliente_telefones: {
        Row: {
          cliente_id: string
          created_at: string | null
          descricao: string | null
          id: string
          is_whatsapp: boolean | null
          numero: string
          principal: boolean | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_whatsapp?: boolean | null
          numero: string
          principal?: boolean | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_whatsapp?: boolean | null
          numero?: string
          principal?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cliente_telefones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          conjuge_id: string | null
          corretor_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          data_perda: string | null
          data_primeira_compra: string | null
          data_primeira_negociacao: string | null
          data_qualificacao: string | null
          email: string | null
          empreendimento_id: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          estado_civil: string | null
          fase: string | null
          gestor_id: string | null
          id: string
          imobiliaria_id: string | null
          interesse: string[] | null
          is_active: boolean
          lead_id: string | null
          motivo_perda: string | null
          nacionalidade: string | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          observacoes: string | null
          origem: string | null
          passaporte: string | null
          profissao: string | null
          renda_mensal: number | null
          rg: string | null
          telefone: string | null
          temperatura: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          conjuge_id?: string | null
          corretor_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_perda?: string | null
          data_primeira_compra?: string | null
          data_primeira_negociacao?: string | null
          data_qualificacao?: string | null
          email?: string | null
          empreendimento_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          estado_civil?: string | null
          fase?: string | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          interesse?: string[] | null
          is_active?: boolean
          lead_id?: string | null
          motivo_perda?: string | null
          nacionalidade?: string | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          origem?: string | null
          passaporte?: string | null
          profissao?: string | null
          renda_mensal?: number | null
          rg?: string | null
          telefone?: string | null
          temperatura?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          conjuge_id?: string | null
          corretor_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_perda?: string | null
          data_primeira_compra?: string | null
          data_primeira_negociacao?: string | null
          data_qualificacao?: string | null
          email?: string | null
          empreendimento_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          estado_civil?: string | null
          fase?: string | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          interesse?: string[] | null
          is_active?: boolean
          lead_id?: string | null
          motivo_perda?: string | null
          nacionalidade?: string | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          origem?: string | null
          passaporte?: string | null
          profissao?: string | null
          renda_mensal?: number | null
          rg?: string | null
          telefone?: string | null
          temperatura?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_conjuge_id_fkey"
            columns: ["conjuge_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      comissao_parcelas: {
        Row: {
          comissao_id: string
          comprovante_url: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          observacao: string | null
          parcela: number
          status: Database["public"]["Enums"]["parcela_status"]
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          comissao_id: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          observacao?: string | null
          parcela: number
          status?: Database["public"]["Enums"]["parcela_status"]
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          comissao_id?: string
          comprovante_url?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          observacao?: string | null
          parcela?: number
          status?: Database["public"]["Enums"]["parcela_status"]
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissao_parcelas_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes: {
        Row: {
          contrato_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_estorno: string | null
          data_pagamento: string | null
          data_pagamento_corretor: string | null
          data_pagamento_imobiliaria: string | null
          empreendimento_id: string
          estornada: boolean | null
          gestor_id: string | null
          id: string
          imobiliaria_id: string | null
          is_active: boolean
          nf_corretor: string | null
          nf_imobiliaria: string | null
          nf_numero: string | null
          nf_quitada: boolean | null
          numero: string
          observacoes: string | null
          percentual_comissao: number | null
          percentual_corretor: number | null
          percentual_imobiliaria: number | null
          status: Database["public"]["Enums"]["comissao_status"] | null
          status_corretor: Database["public"]["Enums"]["comissao_status"]
          status_imobiliaria: Database["public"]["Enums"]["comissao_status"]
          updated_at: string
          updated_by: string | null
          valor_comissao: number | null
          valor_corretor: number | null
          valor_imobiliaria: number | null
          valor_venda: number
        }
        Insert: {
          contrato_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_estorno?: string | null
          data_pagamento?: string | null
          data_pagamento_corretor?: string | null
          data_pagamento_imobiliaria?: string | null
          empreendimento_id: string
          estornada?: boolean | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          nf_corretor?: string | null
          nf_imobiliaria?: string | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          numero: string
          observacoes?: string | null
          percentual_comissao?: number | null
          percentual_corretor?: number | null
          percentual_imobiliaria?: number | null
          status?: Database["public"]["Enums"]["comissao_status"] | null
          status_corretor?: Database["public"]["Enums"]["comissao_status"]
          status_imobiliaria?: Database["public"]["Enums"]["comissao_status"]
          updated_at?: string
          updated_by?: string | null
          valor_comissao?: number | null
          valor_corretor?: number | null
          valor_imobiliaria?: number | null
          valor_venda: number
        }
        Update: {
          contrato_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_estorno?: string | null
          data_pagamento?: string | null
          data_pagamento_corretor?: string | null
          data_pagamento_imobiliaria?: string | null
          empreendimento_id?: string
          estornada?: boolean | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          nf_corretor?: string | null
          nf_imobiliaria?: string | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          numero?: string
          observacoes?: string | null
          percentual_comissao?: number | null
          percentual_corretor?: number | null
          percentual_imobiliaria?: number | null
          status?: Database["public"]["Enums"]["comissao_status"] | null
          status_corretor?: Database["public"]["Enums"]["comissao_status"]
          status_imobiliaria?: Database["public"]["Enums"]["comissao_status"]
          updated_at?: string
          updated_by?: string | null
          valor_comissao?: number | null
          valor_corretor?: number | null
          valor_imobiliaria?: number | null
          valor_venda?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_comercial: {
        Row: {
          created_at: string | null
          data_referencia: string
          desconto_avista: number | null
          empreendimento_id: string
          entrada_curto_prazo: number | null
          entrada_minima: number | null
          id: string
          indice_reajuste: string | null
          is_active: boolean | null
          limite_parcelas_anuais: number | null
          max_parcelas_entrada: number | null
          max_parcelas_mensais: number | null
          parcelas_curto_prazo: number | null
          taxa_juros_anual: number | null
          updated_at: string | null
          valor_m2: number
        }
        Insert: {
          created_at?: string | null
          data_referencia?: string
          desconto_avista?: number | null
          empreendimento_id: string
          entrada_curto_prazo?: number | null
          entrada_minima?: number | null
          id?: string
          indice_reajuste?: string | null
          is_active?: boolean | null
          limite_parcelas_anuais?: number | null
          max_parcelas_entrada?: number | null
          max_parcelas_mensais?: number | null
          parcelas_curto_prazo?: number | null
          taxa_juros_anual?: number | null
          updated_at?: string | null
          valor_m2?: number
        }
        Update: {
          created_at?: string | null
          data_referencia?: string
          desconto_avista?: number | null
          empreendimento_id?: string
          entrada_curto_prazo?: number | null
          entrada_minima?: number | null
          id?: string
          indice_reajuste?: string | null
          is_active?: boolean | null
          limite_parcelas_anuais?: number | null
          max_parcelas_entrada?: number | null
          max_parcelas_mensais?: number | null
          parcelas_curto_prazo?: number | null
          taxa_juros_anual?: number | null
          updated_at?: string | null
          valor_m2?: number
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_comercial_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: true
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracao_comissoes: {
        Row: {
          created_at: string
          empreendimento_id: string | null
          id: string
          observacoes: string | null
          percentual_padrao_corretor: number | null
          percentual_padrao_imobiliaria: number | null
          regra_calculo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          observacoes?: string | null
          percentual_padrao_corretor?: number | null
          percentual_padrao_imobiliaria?: number | null
          regra_calculo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          observacoes?: string | null
          percentual_padrao_corretor?: number | null
          percentual_padrao_imobiliaria?: number | null
          regra_calculo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracao_comissoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: true
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_sistema: {
        Row: {
          categoria: string
          chave: string
          created_at: string
          id: string
          updated_at: string
          valor: string
        }
        Insert: {
          categoria?: string
          chave: string
          created_at?: string
          id?: string
          updated_at?: string
          valor: string
        }
        Update: {
          categoria?: string
          chave?: string
          created_at?: string
          id?: string
          updated_at?: string
          valor?: string
        }
        Relationships: []
      }
      contrato_aprovacoes: {
        Row: {
          aprovador_id: string | null
          contrato_id: string
          created_at: string
          data_envio: string | null
          data_resposta: string | null
          etapa: number
          id: string
          observacao: string | null
          status: Database["public"]["Enums"]["aprovacao_status"]
          tipo_aprovador: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at: string
        }
        Insert: {
          aprovador_id?: string | null
          contrato_id: string
          created_at?: string
          data_envio?: string | null
          data_resposta?: string | null
          etapa?: number
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["aprovacao_status"]
          tipo_aprovador: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at?: string
        }
        Update: {
          aprovador_id?: string | null
          contrato_id?: string
          created_at?: string
          data_envio?: string | null
          data_resposta?: string | null
          etapa?: number
          id?: string
          observacao?: string | null
          status?: Database["public"]["Enums"]["aprovacao_status"]
          tipo_aprovador?: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_aprovacoes_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_aprovacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_condicoes_pagamento: {
        Row: {
          bem_ano: string | null
          bem_area_m2: number | null
          bem_cartorio: string | null
          bem_cor: string | null
          bem_descricao: string | null
          bem_endereco: string | null
          bem_marca: string | null
          bem_matricula: string | null
          bem_modelo: string | null
          bem_observacoes: string | null
          bem_placa: string | null
          bem_renavam: string | null
          bem_valor_avaliado: number | null
          beneficiario_id: string | null
          beneficiario_tipo: string | null
          com_correcao: boolean | null
          contrato_id: string
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          evento_vencimento: string | null
          forma_pagamento: string | null
          forma_quitacao: string | null
          id: string
          indice_correcao: string | null
          intervalo_dias: number | null
          is_active: boolean | null
          observacao_texto: string | null
          ordem: number | null
          parcelas_sem_correcao: number | null
          quantidade: number | null
          tipo_parcela_codigo: string
          updated_at: string | null
          valor: number | null
          valor_tipo: string | null
        }
        Insert: {
          bem_ano?: string | null
          bem_area_m2?: number | null
          bem_cartorio?: string | null
          bem_cor?: string | null
          bem_descricao?: string | null
          bem_endereco?: string | null
          bem_marca?: string | null
          bem_matricula?: string | null
          bem_modelo?: string | null
          bem_observacoes?: string | null
          bem_placa?: string | null
          bem_renavam?: string | null
          bem_valor_avaliado?: number | null
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          com_correcao?: boolean | null
          contrato_id: string
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Update: {
          bem_ano?: string | null
          bem_area_m2?: number | null
          bem_cartorio?: string | null
          bem_cor?: string | null
          bem_descricao?: string | null
          bem_endereco?: string | null
          bem_marca?: string | null
          bem_matricula?: string | null
          bem_modelo?: string | null
          bem_observacoes?: string | null
          bem_placa?: string | null
          bem_renavam?: string | null
          bem_valor_avaliado?: number | null
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          com_correcao?: boolean | null
          contrato_id?: string
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo?: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_condicoes_pagamento_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_documentos: {
        Row: {
          arquivo_url: string | null
          contrato_id: string
          created_at: string
          id: string
          nome: string
          obrigatorio: boolean
          observacao: string | null
          status: Database["public"]["Enums"]["documento_contrato_status"]
          tipo: string
          updated_at: string
        }
        Insert: {
          arquivo_url?: string | null
          contrato_id: string
          created_at?: string
          id?: string
          nome: string
          obrigatorio?: boolean
          observacao?: string | null
          status?: Database["public"]["Enums"]["documento_contrato_status"]
          tipo: string
          updated_at?: string
        }
        Update: {
          arquivo_url?: string | null
          contrato_id?: string
          created_at?: string
          id?: string
          nome?: string
          obrigatorio?: boolean
          observacao?: string | null
          status?: Database["public"]["Enums"]["documento_contrato_status"]
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_documentos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_pendencias: {
        Row: {
          contrato_id: string
          created_at: string
          descricao: string
          id: string
          prazo: string | null
          resolucao: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["pendencia_status"]
          updated_at: string
        }
        Insert: {
          contrato_id: string
          created_at?: string
          descricao: string
          id?: string
          prazo?: string | null
          resolucao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["pendencia_status"]
          updated_at?: string
        }
        Update: {
          contrato_id?: string
          created_at?: string
          descricao?: string
          id?: string
          prazo?: string | null
          resolucao?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["pendencia_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_pendencias_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_pendencias_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_signatarios: {
        Row: {
          conjuge_cpf: string | null
          conjuge_email: string | null
          conjuge_nome: string | null
          contrato_id: string
          cpf: string | null
          created_at: string
          data_assinatura: string | null
          data_envio: string | null
          data_visualizacao: string | null
          email: string | null
          id: string
          ip_assinatura: string | null
          motivo_recusa: string | null
          nome: string
          obrigatorio: boolean
          ordem: number
          regime_bens: string | null
          status: Database["public"]["Enums"]["signatario_status"]
          telefone: string | null
          tem_conjuge: boolean | null
          tipo: Database["public"]["Enums"]["signatario_tipo"]
          token_assinatura: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          conjuge_cpf?: string | null
          conjuge_email?: string | null
          conjuge_nome?: string | null
          contrato_id: string
          cpf?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          data_visualizacao?: string | null
          email?: string | null
          id?: string
          ip_assinatura?: string | null
          motivo_recusa?: string | null
          nome: string
          obrigatorio?: boolean
          ordem?: number
          regime_bens?: string | null
          status?: Database["public"]["Enums"]["signatario_status"]
          telefone?: string | null
          tem_conjuge?: boolean | null
          tipo: Database["public"]["Enums"]["signatario_tipo"]
          token_assinatura?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          conjuge_cpf?: string | null
          conjuge_email?: string | null
          conjuge_nome?: string | null
          contrato_id?: string
          cpf?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          data_visualizacao?: string | null
          email?: string | null
          id?: string
          ip_assinatura?: string | null
          motivo_recusa?: string | null
          nome?: string
          obrigatorio?: boolean
          ordem?: number
          regime_bens?: string | null
          status?: Database["public"]["Enums"]["signatario_status"]
          telefone?: string | null
          tem_conjuge?: boolean | null
          tipo?: Database["public"]["Enums"]["signatario_tipo"]
          token_assinatura?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_signatarios_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_template_imagens: {
        Row: {
          altura: number | null
          arquivo_url: string
          created_at: string | null
          id: string
          largura: number | null
          nome: string
          template_id: string
        }
        Insert: {
          altura?: number | null
          arquivo_url: string
          created_at?: string | null
          id?: string
          largura?: number | null
          nome: string
          template_id: string
        }
        Update: {
          altura?: number | null
          arquivo_url?: string
          created_at?: string | null
          id?: string
          largura?: number | null
          nome?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contrato_template_imagens_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contrato_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_templates: {
        Row: {
          conteudo_html: string
          created_at: string
          descricao: string | null
          empreendimento_id: string | null
          id: string
          is_active: boolean
          nome: string
          updated_at: string
          variaveis: Json | null
        }
        Insert: {
          conteudo_html: string
          created_at?: string
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean
          nome: string
          updated_at?: string
          variaveis?: Json | null
        }
        Update: {
          conteudo_html?: string
          created_at?: string
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          updated_at?: string
          variaveis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_templates_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_unidades: {
        Row: {
          contrato_id: string
          created_at: string
          id: string
          unidade_id: string
          valor_unidade: number | null
        }
        Insert: {
          contrato_id: string
          created_at?: string
          id?: string
          unidade_id: string
          valor_unidade?: number | null
        }
        Update: {
          contrato_id?: string
          created_at?: string
          id?: string
          unidade_id?: string
          valor_unidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contrato_unidades_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      contrato_variaveis: {
        Row: {
          campo_origem: string | null
          categoria: string | null
          chave: string
          created_at: string | null
          exemplo: string | null
          id: string
          is_active: boolean | null
          is_sistema: boolean | null
          label: string
          origem: string | null
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          campo_origem?: string | null
          categoria?: string | null
          chave: string
          created_at?: string | null
          exemplo?: string | null
          id?: string
          is_active?: boolean | null
          is_sistema?: boolean | null
          label: string
          origem?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          campo_origem?: string | null
          categoria?: string | null
          chave?: string
          created_at?: string | null
          exemplo?: string | null
          id?: string
          is_active?: boolean | null
          is_sistema?: boolean | null
          label?: string
          origem?: string | null
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contrato_versoes: {
        Row: {
          alterado_por: string | null
          conteudo_html: string
          contrato_id: string
          created_at: string
          id: string
          motivo_alteracao: string | null
          versao: number
        }
        Insert: {
          alterado_por?: string | null
          conteudo_html: string
          contrato_id: string
          created_at?: string
          id?: string
          motivo_alteracao?: string | null
          versao: number
        }
        Update: {
          alterado_por?: string | null
          conteudo_html?: string
          contrato_id?: string
          created_at?: string
          id?: string
          motivo_alteracao?: string | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "contrato_versoes_alterado_por_fkey"
            columns: ["alterado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contrato_versoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          cliente_id: string
          conteudo_html: string | null
          corretagem_texto: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_aprovacao: string | null
          data_assinatura: string | null
          data_envio_assinatura: string | null
          data_envio_incorporador: string | null
          data_geracao: string
          empreendimento_id: string
          gestor_id: string | null
          id: string
          imobiliaria_id: string | null
          is_active: boolean
          modalidade_id: string | null
          motivo_reprovacao: string | null
          negociacao_id: string | null
          numero: string
          observacoes: string | null
          percentual_corretagem: number | null
          status: Database["public"]["Enums"]["contrato_status"]
          template_id: string | null
          updated_at: string
          updated_by: string | null
          valor_contrato: number | null
          valor_corretagem: number | null
          versao: number
        }
        Insert: {
          cliente_id: string
          conteudo_html?: string | null
          corretagem_texto?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_assinatura?: string | null
          data_envio_assinatura?: string | null
          data_envio_incorporador?: string | null
          data_geracao?: string
          empreendimento_id: string
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          modalidade_id?: string | null
          motivo_reprovacao?: string | null
          negociacao_id?: string | null
          numero: string
          observacoes?: string | null
          percentual_corretagem?: number | null
          status?: Database["public"]["Enums"]["contrato_status"]
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_contrato?: number | null
          valor_corretagem?: number | null
          versao?: number
        }
        Update: {
          cliente_id?: string
          conteudo_html?: string | null
          corretagem_texto?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_aprovacao?: string | null
          data_assinatura?: string | null
          data_envio_assinatura?: string | null
          data_envio_incorporador?: string | null
          data_geracao?: string
          empreendimento_id?: string
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          modalidade_id?: string | null
          motivo_reprovacao?: string | null
          negociacao_id?: string | null
          numero?: string
          observacoes?: string | null
          percentual_corretagem?: number | null
          status?: Database["public"]["Enums"]["contrato_status"]
          template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_contrato?: number | null
          valor_corretagem?: number | null
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contrato_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      corretores: {
        Row: {
          cidade: string | null
          cpf: string | null
          created_at: string
          creci: string | null
          email: string | null
          id: string
          imobiliaria_id: string
          is_active: boolean
          nome_completo: string
          telefone: string | null
          uf: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          imobiliaria_id: string
          is_active?: boolean
          nome_completo: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cidade?: string | null
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          imobiliaria_id?: string
          is_active?: boolean
          nome_completo?: string
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corretores_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimento_corretores: {
        Row: {
          autorizado_em: string
          autorizado_por: string | null
          corretor_id: string
          empreendimento_id: string
          id: string
        }
        Insert: {
          autorizado_em?: string
          autorizado_por?: string | null
          corretor_id: string
          empreendimento_id: string
          id?: string
        }
        Update: {
          autorizado_em?: string
          autorizado_por?: string | null
          corretor_id?: string
          empreendimento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_corretores_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_corretores_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_corretores_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimento_documentos: {
        Row: {
          arquivo_url: string
          created_at: string
          created_by: string | null
          descricao: string | null
          empreendimento_id: string
          id: string
          nome: string
          tipo: Database["public"]["Enums"]["documento_tipo"]
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          empreendimento_id: string
          id?: string
          nome: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          empreendimento_id?: string
          id?: string
          nome?: string
          tipo?: Database["public"]["Enums"]["documento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_documentos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimento_imobiliarias: {
        Row: {
          autorizado_em: string
          autorizado_por: string | null
          comissao_percentual: number | null
          empreendimento_id: string
          id: string
          imobiliaria_id: string
        }
        Insert: {
          autorizado_em?: string
          autorizado_por?: string | null
          comissao_percentual?: number | null
          empreendimento_id: string
          id?: string
          imobiliaria_id: string
        }
        Update: {
          autorizado_em?: string
          autorizado_por?: string | null
          comissao_percentual?: number | null
          empreendimento_id?: string
          id?: string
          imobiliaria_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_imobiliarias_autorizado_por_fkey"
            columns: ["autorizado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_imobiliarias_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_imobiliarias_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimento_midias: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          is_capa: boolean
          nome: string | null
          ordem: number | null
          tipo: Database["public"]["Enums"]["midia_tipo"]
          url: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          is_capa?: boolean
          nome?: string | null
          ordem?: number | null
          tipo?: Database["public"]["Enums"]["midia_tipo"]
          url: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          is_capa?: boolean
          nome?: string | null
          ordem?: number | null
          tipo?: Database["public"]["Enums"]["midia_tipo"]
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimento_midias_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empreendimentos: {
        Row: {
          auto_vincular_corretor: boolean
          construtora: string | null
          created_at: string
          data_inicio_contrato: string | null
          descricao_completa: string | null
          descricao_curta: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          incorporadora: string | null
          incorporadora_id: string | null
          infraestrutura: string[] | null
          is_active: boolean
          latitude: number | null
          legenda_status_visiveis: string[] | null
          longitude: number | null
          mapa_label_formato: string[] | null
          matricula_mae: string | null
          meta_12_meses: number | null
          meta_6_meses: number | null
          nome: string
          registro_incorporacao: string | null
          responsavel_comercial_id: string | null
          status: Database["public"]["Enums"]["empreendimento_status"]
          tipo: Database["public"]["Enums"]["empreendimento_tipo"]
          total_unidades: number | null
          updated_at: string
        }
        Insert: {
          auto_vincular_corretor?: boolean
          construtora?: string | null
          created_at?: string
          data_inicio_contrato?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          incorporadora?: string | null
          incorporadora_id?: string | null
          infraestrutura?: string[] | null
          is_active?: boolean
          latitude?: number | null
          legenda_status_visiveis?: string[] | null
          longitude?: number | null
          mapa_label_formato?: string[] | null
          matricula_mae?: string | null
          meta_12_meses?: number | null
          meta_6_meses?: number | null
          nome: string
          registro_incorporacao?: string | null
          responsavel_comercial_id?: string | null
          status?: Database["public"]["Enums"]["empreendimento_status"]
          tipo: Database["public"]["Enums"]["empreendimento_tipo"]
          total_unidades?: number | null
          updated_at?: string
        }
        Update: {
          auto_vincular_corretor?: boolean
          construtora?: string | null
          created_at?: string
          data_inicio_contrato?: string | null
          descricao_completa?: string | null
          descricao_curta?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          incorporadora?: string | null
          incorporadora_id?: string | null
          infraestrutura?: string[] | null
          is_active?: boolean
          latitude?: number | null
          legenda_status_visiveis?: string[] | null
          longitude?: number | null
          mapa_label_formato?: string[] | null
          matricula_mae?: string | null
          meta_12_meses?: number | null
          meta_6_meses?: number | null
          nome?: string
          registro_incorporacao?: string | null
          responsavel_comercial_id?: string | null
          status?: Database["public"]["Enums"]["empreendimento_status"]
          tipo?: Database["public"]["Enums"]["empreendimento_tipo"]
          total_unidades?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimentos_incorporadora_id_fkey"
            columns: ["incorporadora_id"]
            isOneToOne: false
            referencedRelation: "incorporadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimentos_responsavel_comercial_id_fkey"
            columns: ["responsavel_comercial_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_membros: {
        Row: {
          created_at: string | null
          evento_id: string
          id: string
          papel: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          evento_id: string
          id?: string
          papel?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          evento_id?: string
          id?: string
          papel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_membros_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_tarefas: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          dependencia_id: string | null
          evento_id: string
          id: string
          ordem: number | null
          responsavel_id: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dependencia_id?: string | null
          evento_id: string
          id?: string
          ordem?: number | null
          responsavel_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          dependencia_id?: string | null
          evento_id?: string
          id?: string
          ordem?: number | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evento_tarefas_dependencia_id_fkey"
            columns: ["dependencia_id"]
            isOneToOne: false
            referencedRelation: "evento_tarefas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_tarefas_evento_id_fkey"
            columns: ["evento_id"]
            isOneToOne: false
            referencedRelation: "eventos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evento_tarefas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_template_tarefas: {
        Row: {
          created_at: string | null
          descricao: string | null
          dias_antes_evento: number | null
          duracao_horas: number | null
          id: string
          ordem: number | null
          template_id: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          dias_antes_evento?: number | null
          duracao_horas?: number | null
          id?: string
          ordem?: number | null
          template_id: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          dias_antes_evento?: number | null
          duracao_horas?: number | null
          id?: string
          ordem?: number | null
          template_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "evento_template_tarefas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "evento_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_templates: {
        Row: {
          created_at: string | null
          descricao: string | null
          duracao_dias: number | null
          id: string
          is_active: boolean | null
          local_padrao: string | null
          nome: string
          orcamento_padrao: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          id?: string
          is_active?: boolean | null
          local_padrao?: string | null
          nome: string
          orcamento_padrao?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          duracao_dias?: number | null
          id?: string
          is_active?: boolean | null
          local_padrao?: string | null
          nome?: string
          orcamento_padrao?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      eventos: {
        Row: {
          codigo: string
          created_at: string | null
          created_by: string | null
          data_evento: string
          descricao: string | null
          empreendimento_id: string | null
          id: string
          is_active: boolean | null
          local: string | null
          nome: string
          orcamento: number | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_evento: string
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          local?: string | null
          nome: string
          orcamento?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_evento?: string
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          local?: string | null
          nome?: string
          orcamento?: number | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fachadas: {
        Row: {
          created_at: string
          descricao: string | null
          empreendimento_id: string
          id: string
          imagem_url: string | null
          is_active: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          empreendimento_id: string
          id?: string
          imagem_url?: string | null
          is_active?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          empreendimento_id?: string
          id?: string
          imagem_url?: string | null
          is_active?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fachadas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      fluxo_aprovacao_config: {
        Row: {
          created_at: string
          empreendimento_id: string | null
          etapa: number
          id: string
          is_active: boolean
          nome_etapa: string
          obrigatoria: boolean
          prazo_horas: number | null
          tipo_aprovador: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          empreendimento_id?: string | null
          etapa: number
          id?: string
          is_active?: boolean
          nome_etapa: string
          obrigatoria?: boolean
          prazo_horas?: number | null
          tipo_aprovador: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string | null
          etapa?: number
          id?: string
          is_active?: boolean
          nome_etapa?: string
          obrigatoria?: boolean
          prazo_horas?: number | null
          tipo_aprovador?: Database["public"]["Enums"]["aprovador_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fluxo_aprovacao_config_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      funil_etapas: {
        Row: {
          codigo: string
          cor: string
          cor_bg: string | null
          created_at: string | null
          funil_id: string
          icone: string | null
          id: string
          is_active: boolean | null
          is_final_perda: boolean | null
          is_final_sucesso: boolean | null
          is_inicial: boolean | null
          nome: string
          ordem: number
        }
        Insert: {
          codigo: string
          cor?: string
          cor_bg?: string | null
          created_at?: string | null
          funil_id: string
          icone?: string | null
          id?: string
          is_active?: boolean | null
          is_final_perda?: boolean | null
          is_final_sucesso?: boolean | null
          is_inicial?: boolean | null
          nome: string
          ordem?: number
        }
        Update: {
          codigo?: string
          cor?: string
          cor_bg?: string | null
          created_at?: string | null
          funil_id?: string
          icone?: string | null
          id?: string
          is_active?: boolean | null
          is_final_perda?: boolean | null
          is_final_sucesso?: boolean | null
          is_inicial?: boolean | null
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "funil_etapas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
        ]
      }
      funis: {
        Row: {
          created_at: string | null
          descricao: string | null
          empreendimento_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funis_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      imobiliarias: {
        Row: {
          cnpj: string | null
          created_at: string
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          gestor_email: string | null
          gestor_nome: string | null
          gestor_telefone: string | null
          id: string
          is_active: boolean
          nome: string
          site: string | null
          telefone: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          id?: string
          is_active?: boolean
          nome: string
          site?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          gestor_email?: string | null
          gestor_nome?: string | null
          gestor_telefone?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          site?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      incorporadoras: {
        Row: {
          cnpj: string | null
          created_at: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          nome: string
          razao_social: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nome: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          nome?: string
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lancamentos_financeiros: {
        Row: {
          beneficiario_id: string | null
          beneficiario_tipo: string | null
          bonificacao_id: string | null
          categoria_fluxo: string | null
          centro_custo_id: string | null
          comissao_id: string | null
          conferido_em: string | null
          conferido_por: string | null
          conta_id: string | null
          contrato_id: string | null
          created_at: string | null
          created_by: string | null
          data_competencia: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          empreendimento_id: string | null
          id: string
          is_recorrente: boolean | null
          nf_numero: string | null
          nf_quitada: boolean | null
          observacoes: string | null
          recorrencia_frequencia: string | null
          recorrencia_pai_id: string | null
          status: string | null
          status_conferencia: string | null
          subcategoria: string | null
          tipo: string
          updated_at: string | null
          valor: number
        }
        Insert: {
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          bonificacao_id?: string | null
          categoria_fluxo?: string | null
          centro_custo_id?: string | null
          comissao_id?: string | null
          conferido_em?: string | null
          conferido_por?: string | null
          conta_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          empreendimento_id?: string | null
          id?: string
          is_recorrente?: boolean | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          observacoes?: string | null
          recorrencia_frequencia?: string | null
          recorrencia_pai_id?: string | null
          status?: string | null
          status_conferencia?: string | null
          subcategoria?: string | null
          tipo: string
          updated_at?: string | null
          valor: number
        }
        Update: {
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          bonificacao_id?: string | null
          categoria_fluxo?: string | null
          centro_custo_id?: string | null
          comissao_id?: string | null
          conferido_em?: string | null
          conferido_por?: string | null
          conta_id?: string | null
          contrato_id?: string | null
          created_at?: string | null
          created_by?: string | null
          data_competencia?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          empreendimento_id?: string | null
          id?: string
          is_recorrente?: boolean | null
          nf_numero?: string | null
          nf_quitada?: boolean | null
          observacoes?: string | null
          recorrencia_frequencia?: string | null
          recorrencia_pai_id?: string | null
          status?: string | null
          status_conferencia?: string | null
          subcategoria?: string | null
          tipo?: string
          updated_at?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_beneficiario_id_fkey"
            columns: ["beneficiario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_bonificacao_id_fkey"
            columns: ["bonificacao_id"]
            isOneToOne: false
            referencedRelation: "bonificacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_comissao_id_fkey"
            columns: ["comissao_id"]
            isOneToOne: false
            referencedRelation: "comissoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conferido_por_fkey"
            columns: ["conferido_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_recorrencia_pai_id_fkey"
            columns: ["recorrencia_pai_id"]
            isOneToOne: false
            referencedRelation: "lancamentos_financeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_empreendimento: {
        Row: {
          altura: number | null
          created_at: string
          empreendimento_id: string
          id: string
          imagem_url: string
          largura: number | null
          updated_at: string
        }
        Insert: {
          altura?: number | null
          created_at?: string
          empreendimento_id: string
          id?: string
          imagem_url: string
          largura?: number | null
          updated_at?: string
        }
        Update: {
          altura?: number | null
          created_at?: string
          empreendimento_id?: string
          id?: string
          imagem_url?: string
          largura?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mapa_empreendimento_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: true
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_comerciais: {
        Row: {
          competencia: string
          corretor_id: string | null
          created_at: string
          empreendimento_id: string | null
          id: string
          meta_atendimentos: number
          meta_propostas: number
          meta_treinamentos: number
          meta_unidades: number
          meta_valor: number
          meta_visitas: number
          periodicidade: string
          updated_at: string
        }
        Insert: {
          competencia: string
          corretor_id?: string | null
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          meta_atendimentos?: number
          meta_propostas?: number
          meta_treinamentos?: number
          meta_unidades?: number
          meta_valor?: number
          meta_visitas?: number
          periodicidade?: string
          updated_at?: string
        }
        Update: {
          competencia?: string
          corretor_id?: string | null
          created_at?: string
          empreendimento_id?: string | null
          id?: string
          meta_atendimentos?: number
          meta_propostas?: number
          meta_treinamentos?: number
          meta_unidades?: number
          meta_valor?: number
          meta_visitas?: number
          periodicidade?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metas_comerciais_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_comerciais_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidade_componentes: {
        Row: {
          com_correcao: boolean | null
          created_at: string | null
          id: string
          indice_correcao: string | null
          intervalo_dias: number | null
          is_active: boolean | null
          modalidade_id: string
          ordem: number | null
          parcelas_sem_correcao: number | null
          quantidade: number | null
          tipo_parcela_codigo: string
          valor_fixo: number | null
          valor_percentual: number | null
        }
        Insert: {
          com_correcao?: boolean | null
          created_at?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          modalidade_id: string
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo: string
          valor_fixo?: number | null
          valor_percentual?: number | null
        }
        Update: {
          com_correcao?: boolean | null
          created_at?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          modalidade_id?: string
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo?: string
          valor_fixo?: number | null
          valor_percentual?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "modalidade_componentes_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_pagamento"
            referencedColumns: ["id"]
          },
        ]
      }
      modalidades_pagamento: {
        Row: {
          created_at: string | null
          descricao: string | null
          empreendimento_id: string | null
          id: string
          incluir_baloes: boolean | null
          indice_correcao: string | null
          is_active: boolean | null
          is_padrao: boolean | null
          nome: string
          parcelas_entrada: number | null
          parcelas_mensais: number | null
          percentual_balao: number | null
          percentual_entrada: number | null
          taxa_juros: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          incluir_baloes?: boolean | null
          indice_correcao?: string | null
          is_active?: boolean | null
          is_padrao?: boolean | null
          nome: string
          parcelas_entrada?: number | null
          parcelas_mensais?: number | null
          percentual_balao?: number | null
          percentual_entrada?: number | null
          taxa_juros?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          incluir_baloes?: boolean | null
          indice_correcao?: string | null
          is_active?: boolean | null
          is_padrao?: boolean | null
          nome?: string
          parcelas_entrada?: number | null
          parcelas_mensais?: number | null
          percentual_balao?: number | null
          percentual_entrada?: number | null
          taxa_juros?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modalidades_pagamento_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean
          name: string
          route: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          route?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          route?: string | null
        }
        Relationships: []
      }
      negociacao_clientes: {
        Row: {
          cliente_id: string
          created_at: string | null
          id: string
          negociacao_id: string
          tipo: string
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          id?: string
          negociacao_id: string
          tipo?: string
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          id?: string
          negociacao_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "negociacao_clientes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacao_clientes_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      negociacao_condicoes_pagamento: {
        Row: {
          com_correcao: boolean | null
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          evento_vencimento: string | null
          forma_pagamento: string | null
          forma_quitacao: string | null
          id: string
          indice_correcao: string | null
          intervalo_dias: number | null
          is_active: boolean | null
          negociacao_id: string
          observacao_texto: string | null
          ordem: number | null
          parcelas_sem_correcao: number | null
          quantidade: number | null
          tipo_parcela_codigo: string
          updated_at: string | null
          valor: number | null
          valor_tipo: string | null
        }
        Insert: {
          com_correcao?: boolean | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          negociacao_id: string
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Update: {
          com_correcao?: boolean | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          negociacao_id?: string
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          tipo_parcela_codigo?: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacao_condicoes_pagamento_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      negociacao_historico: {
        Row: {
          created_at: string
          etapa_anterior: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova: Database["public"]["Enums"]["etapa_funil"] | null
          funil_etapa_anterior_id: string | null
          funil_etapa_nova_id: string | null
          id: string
          negociacao_id: string
          observacao: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_funil"] | null
          funil_etapa_anterior_id?: string | null
          funil_etapa_nova_id?: string | null
          id?: string
          negociacao_id: string
          observacao?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          etapa_anterior?: Database["public"]["Enums"]["etapa_funil"] | null
          etapa_nova?: Database["public"]["Enums"]["etapa_funil"] | null
          funil_etapa_anterior_id?: string | null
          funil_etapa_nova_id?: string | null
          id?: string
          negociacao_id?: string
          observacao?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacao_historico_funil_etapa_anterior_id_fkey"
            columns: ["funil_etapa_anterior_id"]
            isOneToOne: false
            referencedRelation: "funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacao_historico_funil_etapa_nova_id_fkey"
            columns: ["funil_etapa_nova_id"]
            isOneToOne: false
            referencedRelation: "funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacao_historico_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacao_historico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      negociacao_unidades: {
        Row: {
          created_at: string
          id: string
          negociacao_id: string
          unidade_id: string
          valor_proposta: number | null
          valor_tabela: number | null
          valor_unidade: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          negociacao_id: string
          unidade_id: string
          valor_proposta?: number | null
          valor_tabela?: number | null
          valor_unidade?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          negociacao_id?: string
          unidade_id?: string
          valor_proposta?: number | null
          valor_tabela?: number | null
          valor_unidade?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacao_unidades_negociacao_id_fkey"
            columns: ["negociacao_id"]
            isOneToOne: false
            referencedRelation: "negociacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacao_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      negociacoes: {
        Row: {
          aprovada_em: string | null
          cliente_id: string
          codigo: string
          condicao_pagamento: string | null
          contrato_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          dados_filiacao_ok: boolean | null
          data_aceite: string | null
          data_contrato_gerado: string | null
          data_conversao: string | null
          data_emissao_proposta: string | null
          data_fechamento: string | null
          data_previsao_fechamento: string | null
          data_primeiro_atendimento: string | null
          data_proposta_gerada: string | null
          data_validade_proposta: string | null
          desconto_percentual: number | null
          desconto_valor: number | null
          documentos_anexados: boolean | null
          empreendimento_id: string
          estado_civil_validado: boolean | null
          etapa: Database["public"]["Enums"]["etapa_funil"]
          ficha_completa: boolean | null
          funil_etapa_id: string | null
          gestor_id: string | null
          id: string
          imobiliaria_id: string | null
          indice_correcao: string | null
          is_active: boolean
          modalidade_id: string | null
          motivo_perda: string | null
          motivo_recusa: string | null
          motivo_rejeicao: string | null
          motivo_validacao: string | null
          numero_proposta: string | null
          observacoes: string | null
          ordem_kanban: number
          proposta_origem_id: string | null
          rejeitada_em: string | null
          simulacao_dados: Json | null
          solicitada_em: string | null
          status_aprovacao: string | null
          status_proposta: string | null
          updated_at: string
          updated_by: string | null
          validacao_comercial_em: string | null
          validacao_comercial_por: string | null
          valor_entrada: number | null
          valor_negociacao: number | null
          valor_proposta: number | null
          valor_tabela: number | null
          valor_total_fechamento: number | null
        }
        Insert: {
          aprovada_em?: string | null
          cliente_id: string
          codigo: string
          condicao_pagamento?: string | null
          contrato_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          dados_filiacao_ok?: boolean | null
          data_aceite?: string | null
          data_contrato_gerado?: string | null
          data_conversao?: string | null
          data_emissao_proposta?: string | null
          data_fechamento?: string | null
          data_previsao_fechamento?: string | null
          data_primeiro_atendimento?: string | null
          data_proposta_gerada?: string | null
          data_validade_proposta?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          documentos_anexados?: boolean | null
          empreendimento_id: string
          estado_civil_validado?: boolean | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          ficha_completa?: boolean | null
          funil_etapa_id?: string | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          indice_correcao?: string | null
          is_active?: boolean
          modalidade_id?: string | null
          motivo_perda?: string | null
          motivo_recusa?: string | null
          motivo_rejeicao?: string | null
          motivo_validacao?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          ordem_kanban?: number
          proposta_origem_id?: string | null
          rejeitada_em?: string | null
          simulacao_dados?: Json | null
          solicitada_em?: string | null
          status_aprovacao?: string | null
          status_proposta?: string | null
          updated_at?: string
          updated_by?: string | null
          validacao_comercial_em?: string | null
          validacao_comercial_por?: string | null
          valor_entrada?: number | null
          valor_negociacao?: number | null
          valor_proposta?: number | null
          valor_tabela?: number | null
          valor_total_fechamento?: number | null
        }
        Update: {
          aprovada_em?: string | null
          cliente_id?: string
          codigo?: string
          condicao_pagamento?: string | null
          contrato_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          dados_filiacao_ok?: boolean | null
          data_aceite?: string | null
          data_contrato_gerado?: string | null
          data_conversao?: string | null
          data_emissao_proposta?: string | null
          data_fechamento?: string | null
          data_previsao_fechamento?: string | null
          data_primeiro_atendimento?: string | null
          data_proposta_gerada?: string | null
          data_validade_proposta?: string | null
          desconto_percentual?: number | null
          desconto_valor?: number | null
          documentos_anexados?: boolean | null
          empreendimento_id?: string
          estado_civil_validado?: boolean | null
          etapa?: Database["public"]["Enums"]["etapa_funil"]
          ficha_completa?: boolean | null
          funil_etapa_id?: string | null
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          indice_correcao?: string | null
          is_active?: boolean
          modalidade_id?: string | null
          motivo_perda?: string | null
          motivo_recusa?: string | null
          motivo_rejeicao?: string | null
          motivo_validacao?: string | null
          numero_proposta?: string | null
          observacoes?: string | null
          ordem_kanban?: number
          proposta_origem_id?: string | null
          rejeitada_em?: string | null
          simulacao_dados?: Json | null
          solicitada_em?: string | null
          status_aprovacao?: string | null
          status_proposta?: string | null
          updated_at?: string
          updated_by?: string | null
          validacao_comercial_em?: string | null
          validacao_comercial_por?: string | null
          valor_entrada?: number | null
          valor_negociacao?: number | null
          valor_proposta?: number | null
          valor_tabela?: number | null
          valor_total_fechamento?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "negociacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_funil_etapa_id_fkey"
            columns: ["funil_etapa_id"]
            isOneToOne: false
            referencedRelation: "funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_modalidade_id_fkey"
            columns: ["modalidade_id"]
            isOneToOne: false
            referencedRelation: "modalidades_pagamento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_proposta_origem_id_fkey"
            columns: ["proposta_origem_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "negociacoes_validacao_comercial_por_fkey"
            columns: ["validacao_comercial_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_fases: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      planejamento_historico: {
        Row: {
          campo_alterado: string
          created_at: string | null
          id: string
          item_id: string
          user_id: string | null
          valor_anterior: string | null
          valor_novo: string | null
        }
        Insert: {
          campo_alterado: string
          created_at?: string | null
          id?: string
          item_id: string
          user_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Update: {
          campo_alterado?: string
          created_at?: string | null
          id?: string
          item_id?: string
          user_id?: string | null
          valor_anterior?: string | null
          valor_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_historico_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "planejamento_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_historico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_item_responsaveis: {
        Row: {
          created_at: string | null
          id: string
          item_id: string
          papel: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          item_id: string
          papel?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          item_id?: string
          papel?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_item_responsaveis_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "planejamento_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_item_responsaveis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_itens: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          empreendimento_id: string
          fase_id: string
          id: string
          is_active: boolean | null
          item: string
          obs: string | null
          ordem: number | null
          responsavel_tecnico_id: string | null
          status_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          empreendimento_id: string
          fase_id: string
          id?: string
          is_active?: boolean | null
          item: string
          obs?: string | null
          ordem?: number | null
          responsavel_tecnico_id?: string | null
          status_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          empreendimento_id?: string
          fase_id?: string
          id?: string
          is_active?: boolean | null
          item?: string
          obs?: string | null
          ordem?: number | null
          responsavel_tecnico_id?: string | null
          status_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_itens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_itens_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "planejamento_fases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_itens_responsavel_tecnico_id_fkey"
            columns: ["responsavel_tecnico_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planejamento_itens_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "planejamento_status"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_status: {
        Row: {
          cor: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_final: boolean | null
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_final?: boolean | null
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_final?: boolean | null
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      plano_contas: {
        Row: {
          categoria: string
          codigo: string
          created_at: string | null
          id: string
          is_active: boolean | null
          nome: string
          ordem: number | null
          pai_id: string | null
          tipo: string
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          ordem?: number | null
          pai_id?: string | null
          tipo: string
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          ordem?: number | null
          pai_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plano_contas_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          percentual_comissao: number | null
          phone: string | null
          tipo_vinculo: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          percentual_comissao?: number | null
          phone?: string | null
          tipo_vinculo?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          percentual_comissao?: number | null
          phone?: string | null
          tipo_vinculo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projeto_comentarios: {
        Row: {
          anexo_url: string | null
          comentario: string
          created_at: string | null
          id: string
          projeto_id: string
          user_id: string | null
        }
        Insert: {
          anexo_url?: string | null
          comentario: string
          created_at?: string | null
          id?: string
          projeto_id: string
          user_id?: string | null
        }
        Update: {
          anexo_url?: string | null
          comentario?: string
          created_at?: string | null
          id?: string
          projeto_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_comentarios_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_comentarios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_historico: {
        Row: {
          created_at: string | null
          id: string
          observacao: string | null
          projeto_id: string
          status_anterior: Database["public"]["Enums"]["status_projeto"] | null
          status_novo: Database["public"]["Enums"]["status_projeto"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          projeto_id: string
          status_anterior?: Database["public"]["Enums"]["status_projeto"] | null
          status_novo: Database["public"]["Enums"]["status_projeto"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          observacao?: string | null
          projeto_id?: string
          status_anterior?: Database["public"]["Enums"]["status_projeto"] | null
          status_novo?: Database["public"]["Enums"]["status_projeto"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projeto_historico_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_historico_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projeto_responsaveis: {
        Row: {
          created_at: string
          id: string
          projeto_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          projeto_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          projeto_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projeto_responsaveis_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projeto_responsaveis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos_marketing: {
        Row: {
          briefing_anexos: Json | null
          briefing_id: string | null
          briefing_texto: string | null
          categoria: Database["public"]["Enums"]["categoria_projeto"]
          cliente_id: string | null
          codigo: string
          created_at: string | null
          created_by: string | null
          data_entrega: string | null
          data_inicio: string | null
          data_previsao: string | null
          data_solicitacao: string | null
          descricao: string | null
          empreendimento_id: string | null
          id: string
          is_active: boolean | null
          is_interno: boolean
          ordem_kanban: number | null
          prioridade: Database["public"]["Enums"]["prioridade_projeto"] | null
          status: Database["public"]["Enums"]["status_projeto"] | null
          supervisor_id: string | null
          ticket_etapa_id: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          briefing_anexos?: Json | null
          briefing_id?: string | null
          briefing_texto?: string | null
          categoria: Database["public"]["Enums"]["categoria_projeto"]
          cliente_id?: string | null
          codigo: string
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          data_inicio?: string | null
          data_previsao?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          is_interno?: boolean
          ordem_kanban?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_projeto"] | null
          status?: Database["public"]["Enums"]["status_projeto"] | null
          supervisor_id?: string | null
          ticket_etapa_id?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          briefing_anexos?: Json | null
          briefing_id?: string | null
          briefing_texto?: string | null
          categoria?: Database["public"]["Enums"]["categoria_projeto"]
          cliente_id?: string | null
          codigo?: string
          created_at?: string | null
          created_by?: string | null
          data_entrega?: string | null
          data_inicio?: string | null
          data_previsao?: string | null
          data_solicitacao?: string | null
          descricao?: string | null
          empreendimento_id?: string | null
          id?: string
          is_active?: boolean | null
          is_interno?: boolean
          ordem_kanban?: number | null
          prioridade?: Database["public"]["Enums"]["prioridade_projeto"] | null
          status?: Database["public"]["Enums"]["status_projeto"] | null
          supervisor_id?: string | null
          ticket_etapa_id?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_projetos_marketing_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_marketing_briefing_id_fkey"
            columns: ["briefing_id"]
            isOneToOne: false
            referencedRelation: "briefings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_marketing_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_marketing_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_marketing_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_marketing_ticket_etapa_id_fkey"
            columns: ["ticket_etapa_id"]
            isOneToOne: false
            referencedRelation: "ticket_etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_condicoes_pagamento: {
        Row: {
          com_correcao: boolean | null
          created_at: string
          data_vencimento: string | null
          descricao: string | null
          forma_pagamento: string | null
          id: string
          indice_correcao: string | null
          intervalo_dias: number | null
          is_active: boolean
          ordem: number
          proposta_id: string
          quantidade: number
          tipo_parcela_codigo: string
          updated_at: string
          valor: number
          valor_tipo: string | null
        }
        Insert: {
          com_correcao?: boolean | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean
          ordem?: number
          proposta_id: string
          quantidade?: number
          tipo_parcela_codigo: string
          updated_at?: string
          valor?: number
          valor_tipo?: string | null
        }
        Update: {
          com_correcao?: boolean | null
          created_at?: string
          data_vencimento?: string | null
          descricao?: string | null
          forma_pagamento?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean
          ordem?: number
          proposta_id?: string
          quantidade?: number
          tipo_parcela_codigo?: string
          updated_at?: string
          valor?: number
          valor_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_condicoes_pagamento_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
        ]
      }
      proposta_unidades: {
        Row: {
          created_at: string
          id: string
          proposta_id: string
          unidade_id: string
          valor_proposta: number | null
          valor_tabela: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          proposta_id: string
          unidade_id: string
          valor_proposta?: number | null
          valor_tabela?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          proposta_id?: string
          unidade_id?: string
          valor_proposta?: number | null
          valor_tabela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposta_unidades_proposta_id_fkey"
            columns: ["proposta_id"]
            isOneToOne: false
            referencedRelation: "propostas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposta_unidades_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      propostas: {
        Row: {
          cliente_id: string
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_aceite: string | null
          data_emissao: string | null
          data_validade: string
          desconto_percentual: number | null
          desconto_valor: number | null
          empreendimento_id: string
          gestor_id: string | null
          id: string
          imobiliaria_id: string | null
          is_active: boolean
          motivo_recusa: string | null
          numero: string
          observacoes: string | null
          simulacao_dados: Json | null
          status: string
          updated_at: string
          updated_by: string | null
          valor_proposta: number | null
          valor_tabela: number | null
        }
        Insert: {
          cliente_id: string
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_aceite?: string | null
          data_emissao?: string | null
          data_validade: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          empreendimento_id: string
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          motivo_recusa?: string | null
          numero?: string
          observacoes?: string | null
          simulacao_dados?: Json | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          valor_proposta?: number | null
          valor_tabela?: number | null
        }
        Update: {
          cliente_id?: string
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_aceite?: string | null
          data_emissao?: string | null
          data_validade?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          empreendimento_id?: string
          gestor_id?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          motivo_recusa?: string | null
          numero?: string
          observacoes?: string | null
          simulacao_dados?: Json | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          valor_proposta?: number | null
          valor_tabela?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "propostas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propostas_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      reserva_documentos: {
        Row: {
          arquivo_url: string
          created_at: string
          id: string
          nome: string
          reserva_id: string
          tipo: string
        }
        Insert: {
          arquivo_url: string
          created_at?: string
          id?: string
          nome: string
          reserva_id: string
          tipo: string
        }
        Update: {
          arquivo_url?: string
          created_at?: string
          id?: string
          nome?: string
          reserva_id?: string
          tipo?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module_id: string
          role: Database["public"]["Enums"]["app_role"] | null
          role_id: string | null
          scope: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_id: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          scope?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saldos_mensais: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          id: string
          mes: number
          saldo_inicial: number
          updated_at: string | null
        }
        Insert: {
          ano: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes: number
          saldo_inicial?: number
          updated_at?: string | null
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes?: number
          saldo_inicial?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saldos_mensais_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_projeto: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          ordem: number | null
          projeto_id: string
          responsavel_id: string | null
          status: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          projeto_id: string
          responsavel_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          ordem?: number | null
          projeto_id?: string
          responsavel_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_projeto_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_marketing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_projeto_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      template_condicoes_pagamento: {
        Row: {
          bem_ano: string | null
          bem_area_m2: number | null
          bem_cartorio: string | null
          bem_cor: string | null
          bem_descricao: string | null
          bem_endereco: string | null
          bem_marca: string | null
          bem_matricula: string | null
          bem_modelo: string | null
          bem_observacoes: string | null
          bem_placa: string | null
          bem_renavam: string | null
          bem_valor_avaliado: number | null
          beneficiario_id: string | null
          beneficiario_tipo: string | null
          com_correcao: boolean | null
          created_at: string | null
          data_vencimento: string | null
          descricao: string | null
          evento_vencimento: string | null
          forma_pagamento: string | null
          forma_quitacao: string | null
          id: string
          indice_correcao: string | null
          intervalo_dias: number | null
          is_active: boolean | null
          observacao_texto: string | null
          ordem: number | null
          parcelas_sem_correcao: number | null
          quantidade: number | null
          template_id: string
          tipo_parcela_codigo: string
          updated_at: string | null
          valor: number | null
          valor_tipo: string | null
        }
        Insert: {
          bem_ano?: string | null
          bem_area_m2?: number | null
          bem_cartorio?: string | null
          bem_cor?: string | null
          bem_descricao?: string | null
          bem_endereco?: string | null
          bem_marca?: string | null
          bem_matricula?: string | null
          bem_modelo?: string | null
          bem_observacoes?: string | null
          bem_placa?: string | null
          bem_renavam?: string | null
          bem_valor_avaliado?: number | null
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          com_correcao?: boolean | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          template_id: string
          tipo_parcela_codigo: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Update: {
          bem_ano?: string | null
          bem_area_m2?: number | null
          bem_cartorio?: string | null
          bem_cor?: string | null
          bem_descricao?: string | null
          bem_endereco?: string | null
          bem_marca?: string | null
          bem_matricula?: string | null
          bem_modelo?: string | null
          bem_observacoes?: string | null
          bem_placa?: string | null
          bem_renavam?: string | null
          bem_valor_avaliado?: number | null
          beneficiario_id?: string | null
          beneficiario_tipo?: string | null
          com_correcao?: boolean | null
          created_at?: string | null
          data_vencimento?: string | null
          descricao?: string | null
          evento_vencimento?: string | null
          forma_pagamento?: string | null
          forma_quitacao?: string | null
          id?: string
          indice_correcao?: string | null
          intervalo_dias?: number | null
          is_active?: boolean | null
          observacao_texto?: string | null
          ordem?: number | null
          parcelas_sem_correcao?: number | null
          quantidade?: number | null
          template_id?: string
          tipo_parcela_codigo?: string
          updated_at?: string | null
          valor?: number | null
          valor_tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_condicoes_pagamento_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contrato_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_aceites: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          tipo: string
          user_agent: string | null
          user_id: string
          versao_hash: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          tipo: string
          user_agent?: string | null
          user_id: string
          versao_hash: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          tipo?: string
          user_agent?: string | null
          user_id?: string
          versao_hash?: string
        }
        Relationships: []
      }
      termos_versoes: {
        Row: {
          conteudo: string
          created_at: string | null
          criado_por: string | null
          id: string
          tipo: string
          versao_hash: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          tipo: string
          versao_hash: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          id?: string
          tipo?: string
          versao_hash?: string
        }
        Relationships: []
      }
      ticket_criativos: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_final: boolean | null
          nome: string | null
          projeto_id: string
          tipo: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_final?: boolean | null
          nome?: string | null
          projeto_id: string
          tipo?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_final?: boolean | null
          nome?: string | null
          projeto_id?: string
          tipo?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_criativos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_marketing"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_etapas: {
        Row: {
          categoria: string | null
          cor: string | null
          cor_bg: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_final: boolean | null
          is_inicial: boolean | null
          nome: string
          ordem: number | null
          updated_at: string | null
        }
        Insert: {
          categoria?: string | null
          cor?: string | null
          cor_bg?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_final?: boolean | null
          is_inicial?: boolean | null
          nome: string
          ordem?: number | null
          updated_at?: string | null
        }
        Update: {
          categoria?: string | null
          cor?: string | null
          cor_bg?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_final?: boolean | null
          is_inicial?: boolean | null
          nome?: string
          ordem?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tipologias: {
        Row: {
          area_privativa: number | null
          area_total: number | null
          banheiros: number | null
          categoria: Database["public"]["Enums"]["tipologia_categoria"]
          created_at: string
          empreendimento_id: string
          id: string
          is_active: boolean
          nome: string
          planta_url: string | null
          quartos: number | null
          suites: number | null
          updated_at: string
          vagas: number | null
          valor_base: number | null
        }
        Insert: {
          area_privativa?: number | null
          area_total?: number | null
          banheiros?: number | null
          categoria?: Database["public"]["Enums"]["tipologia_categoria"]
          created_at?: string
          empreendimento_id: string
          id?: string
          is_active?: boolean
          nome: string
          planta_url?: string | null
          quartos?: number | null
          suites?: number | null
          updated_at?: string
          vagas?: number | null
          valor_base?: number | null
        }
        Update: {
          area_privativa?: number | null
          area_total?: number | null
          banheiros?: number | null
          categoria?: Database["public"]["Enums"]["tipologia_categoria"]
          created_at?: string
          empreendimento_id?: string
          id?: string
          is_active?: boolean
          nome?: string
          planta_url?: string | null
          quartos?: number | null
          suites?: number | null
          updated_at?: string
          vagas?: number | null
          valor_base?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tipologias_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_parcela: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          is_active: boolean | null
          nome: string
          ordem: number | null
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome: string
          ordem?: number | null
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_active?: boolean | null
          nome?: string
          ordem?: number | null
        }
        Relationships: []
      }
      unidade_historico_precos: {
        Row: {
          alterado_por: string | null
          area_anterior: number | null
          area_nova: number | null
          created_at: string | null
          id: string
          motivo: string | null
          unidade_id: string
          valor_anterior: number | null
          valor_novo: number | null
        }
        Insert: {
          alterado_por?: string | null
          area_anterior?: number | null
          area_nova?: number | null
          created_at?: string | null
          id?: string
          motivo?: string | null
          unidade_id: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Update: {
          alterado_por?: string | null
          area_anterior?: number | null
          area_nova?: number | null
          created_at?: string | null
          id?: string
          motivo?: string | null
          unidade_id?: string
          valor_anterior?: number | null
          valor_novo?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unidade_historico_precos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades: {
        Row: {
          andar: number | null
          area_privativa: number | null
          bloco_id: string | null
          created_at: string
          descricao: string | null
          empreendimento_id: string
          fachada_id: string | null
          id: string
          is_active: boolean
          numero: string
          observacoes: string | null
          polygon_coords: Json | null
          posicao: string | null
          status: Database["public"]["Enums"]["unidade_status"]
          tipologia_id: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          andar?: number | null
          area_privativa?: number | null
          bloco_id?: string | null
          created_at?: string
          descricao?: string | null
          empreendimento_id: string
          fachada_id?: string | null
          id?: string
          is_active?: boolean
          numero: string
          observacoes?: string | null
          polygon_coords?: Json | null
          posicao?: string | null
          status?: Database["public"]["Enums"]["unidade_status"]
          tipologia_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          andar?: number | null
          area_privativa?: number | null
          bloco_id?: string | null
          created_at?: string
          descricao?: string | null
          empreendimento_id?: string
          fachada_id?: string | null
          id?: string
          is_active?: boolean
          numero?: string
          observacoes?: string | null
          polygon_coords?: Json | null
          posicao?: string | null
          status?: Database["public"]["Enums"]["unidade_status"]
          tipologia_id?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unidades_bloco_id_fkey"
            columns: ["bloco_id"]
            isOneToOne: false
            referencedRelation: "blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_fachada_id_fkey"
            columns: ["fachada_id"]
            isOneToOne: false
            referencedRelation: "fachadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "tipologias"
            referencedColumns: ["id"]
          },
        ]
      }
      user_empreendimentos: {
        Row: {
          created_at: string
          empreendimento_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          empreendimento_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          empreendimento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_empreendimentos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module_id: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_id: string
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module_id?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_empreendimento_bonus: {
        Row: {
          created_at: string | null
          elegivel_bonificacao: boolean | null
          empreendimento_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          elegivel_bonificacao?: boolean | null
          empreendimento_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          elegivel_bonificacao?: boolean | null
          empreendimento_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuario_empreendimento_bonus_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_empreendimento_bonus_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          erro: string | null
          evento: string
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          sucesso: boolean
          tempo_ms: number | null
          url: string
          webhook_id: string | null
        }
        Insert: {
          created_at?: string
          erro?: string | null
          evento: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          sucesso?: boolean
          tempo_ms?: number | null
          url: string
          webhook_id?: string | null
        }
        Update: {
          created_at?: string
          erro?: string | null
          evento?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          sucesso?: boolean
          tempo_ms?: number | null
          url?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          descricao: string | null
          evento: string
          id: string
          is_active: boolean | null
          ultimo_disparo: string | null
          ultimo_status: number | null
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          evento: string
          id?: string
          is_active?: boolean | null
          ultimo_disparo?: string | null
          ultimo_status?: number | null
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          evento?: string
          id?: string
          is_active?: boolean | null
          ultimo_disparo?: string | null
          ultimo_status?: number | null
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aprovar_solicitacao_negociacao: {
        Args: { p_gestor_id: string; p_negociacao_id: string }
        Returns: Json
      }
      can_access_empreendimento: {
        Args: { _empreendimento_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_module: {
        Args: { _action: string; _module_name: string; _user_id: string }
        Returns: boolean
      }
      can_access_module_v2: {
        Args: { _action: string; _module_name: string; _user_id: string }
        Returns: boolean
      }
      generate_negociacao_proposta_numero: { Args: never; Returns: string }
      generate_signature_token: { Args: never; Returns: string }
      gerar_hash_versao: { Args: { conteudo: string }; Returns: string }
      get_gestor_empreendimento: { Args: { emp_id: string }; Returns: string }
      get_module_scope: {
        Args: { _module_name: string; _user_id: string }
        Returns: string
      }
      get_role_id: { Args: { _role_name: string }; Returns: string }
      get_user_imobiliaria_id: { Args: { _user_id: string }; Returns: string }
      get_user_module_permission: {
        Args: { _module_name: string; _user_id: string }
        Returns: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          scope: string
        }[]
      }
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      has_role_by_id: {
        Args: { _role_id: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_cliente_externo: { Args: { _user_id: string }; Returns: boolean }
      is_gestor_imobiliaria: { Args: { _user_id: string }; Returns: boolean }
      is_incorporador: { Args: { _user_id: string }; Returns: boolean }
      is_marketing_supervisor: { Args: { _user_id: string }; Returns: boolean }
      is_seven_team: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      rejeitar_solicitacao_negociacao: {
        Args: { p_gestor_id: string; p_motivo: string; p_negociacao_id: string }
        Returns: boolean
      }
      user_has_empreendimento_access: {
        Args: { _empreendimento_id: string; _user_id: string }
        Returns: boolean
      }
      verificar_ficha_proposta_completa: {
        Args: { neg_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "gestor_produto"
        | "incorporador"
        | "corretor"
        | "cliente_externo"
        | "supervisor_relacionamento"
        | "supervisor_render"
        | "supervisor_criacao"
        | "supervisor_video"
        | "equipe_marketing"
        | "super_admin"
        | "diretor_de_marketing"
      aprovacao_status: "pendente" | "aprovado" | "reprovado" | "em_revisao"
      aprovador_tipo:
        | "corretor"
        | "gestor_comercial"
        | "juridico"
        | "diretoria"
        | "incorporador"
      briefing_status:
        | "pendente"
        | "triado"
        | "em_producao"
        | "revisao"
        | "aprovado"
        | "entregue"
        | "cancelado"
      categoria_projeto:
        | "render_3d"
        | "design_grafico"
        | "video_animacao"
        | "evento"
        | "pedido_orcamento"
        | "criacao_campanha"
      comissao_status: "pendente" | "parcialmente_pago" | "pago" | "cancelado"
      contrato_status:
        | "em_geracao"
        | "enviado_assinatura"
        | "assinado"
        | "enviado_incorporador"
        | "aprovado"
        | "reprovado"
        | "cancelado"
      documento_contrato_status:
        | "pendente"
        | "enviado"
        | "aprovado"
        | "reprovado"
      documento_tipo:
        | "registro_incorporacao"
        | "matricula"
        | "projeto"
        | "licenca"
        | "contrato"
        | "memorial"
        | "outro"
      empreendimento_status: "lancamento" | "obra" | "entregue"
      empreendimento_tipo: "loteamento" | "condominio" | "predio" | "comercial"
      etapa_funil:
        | "lead"
        | "atendimento"
        | "proposta"
        | "negociacao"
        | "fechado"
        | "perdido"
      lead_temperatura: "frio" | "morno" | "quente"
      midia_tipo: "imagem" | "video" | "tour_virtual" | "pdf" | "link"
      parcela_status: "pendente" | "paga" | "atrasada" | "cancelada"
      pendencia_status: "aberta" | "resolvida" | "cancelada"
      prioridade_projeto: "baixa" | "media" | "alta" | "urgente"
      proposta_status:
        | "rascunho"
        | "enviada"
        | "aceita"
        | "recusada"
        | "expirada"
        | "convertida"
      reserva_status: "ativa" | "expirada" | "convertida" | "cancelada"
      signatario_status:
        | "pendente"
        | "enviado"
        | "visualizado"
        | "assinado"
        | "recusado"
      signatario_tipo:
        | "comprador"
        | "conjuge"
        | "testemunha_1"
        | "testemunha_2"
        | "representante_legal"
        | "incorporador"
      status_projeto:
        | "briefing"
        | "triagem"
        | "em_producao"
        | "revisao"
        | "aprovacao_cliente"
        | "concluido"
        | "arquivado"
      tipologia_categoria: "casa" | "apartamento" | "terreno"
      unidade_status:
        | "disponivel"
        | "reservada"
        | "vendida"
        | "bloqueada"
        | "negociacao"
        | "contrato"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "gestor_produto",
        "incorporador",
        "corretor",
        "cliente_externo",
        "supervisor_relacionamento",
        "supervisor_render",
        "supervisor_criacao",
        "supervisor_video",
        "equipe_marketing",
        "super_admin",
        "diretor_de_marketing",
      ],
      aprovacao_status: ["pendente", "aprovado", "reprovado", "em_revisao"],
      aprovador_tipo: [
        "corretor",
        "gestor_comercial",
        "juridico",
        "diretoria",
        "incorporador",
      ],
      briefing_status: [
        "pendente",
        "triado",
        "em_producao",
        "revisao",
        "aprovado",
        "entregue",
        "cancelado",
      ],
      categoria_projeto: [
        "render_3d",
        "design_grafico",
        "video_animacao",
        "evento",
        "pedido_orcamento",
        "criacao_campanha",
      ],
      comissao_status: ["pendente", "parcialmente_pago", "pago", "cancelado"],
      contrato_status: [
        "em_geracao",
        "enviado_assinatura",
        "assinado",
        "enviado_incorporador",
        "aprovado",
        "reprovado",
        "cancelado",
      ],
      documento_contrato_status: [
        "pendente",
        "enviado",
        "aprovado",
        "reprovado",
      ],
      documento_tipo: [
        "registro_incorporacao",
        "matricula",
        "projeto",
        "licenca",
        "contrato",
        "memorial",
        "outro",
      ],
      empreendimento_status: ["lancamento", "obra", "entregue"],
      empreendimento_tipo: ["loteamento", "condominio", "predio", "comercial"],
      etapa_funil: [
        "lead",
        "atendimento",
        "proposta",
        "negociacao",
        "fechado",
        "perdido",
      ],
      lead_temperatura: ["frio", "morno", "quente"],
      midia_tipo: ["imagem", "video", "tour_virtual", "pdf", "link"],
      parcela_status: ["pendente", "paga", "atrasada", "cancelada"],
      pendencia_status: ["aberta", "resolvida", "cancelada"],
      prioridade_projeto: ["baixa", "media", "alta", "urgente"],
      proposta_status: [
        "rascunho",
        "enviada",
        "aceita",
        "recusada",
        "expirada",
        "convertida",
      ],
      reserva_status: ["ativa", "expirada", "convertida", "cancelada"],
      signatario_status: [
        "pendente",
        "enviado",
        "visualizado",
        "assinado",
        "recusado",
      ],
      signatario_tipo: [
        "comprador",
        "conjuge",
        "testemunha_1",
        "testemunha_2",
        "representante_legal",
        "incorporador",
      ],
      status_projeto: [
        "briefing",
        "triagem",
        "em_producao",
        "revisao",
        "aprovacao_cliente",
        "concluido",
        "arquivado",
      ],
      tipologia_categoria: ["casa", "apartamento", "terreno"],
      unidade_status: [
        "disponivel",
        "reservada",
        "vendida",
        "bloqueada",
        "negociacao",
        "contrato",
      ],
    },
  },
} as const
