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
      arqo_agendamentos: {
        Row: {
          created_at: string
          data_hora: string
          duracao_min: number
          google_event_id: string | null
          id: string
          lead_id: string
          local: string | null
          observacoes: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          duracao_min?: number
          google_event_id?: string | null
          id?: string
          lead_id: string
          local?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          duracao_min?: number
          google_event_id?: string | null
          id?: string
          lead_id?: string
          local?: string | null
          observacoes?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arqo_agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_agendamentos_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_vw_forecast_ponderado"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "arqo_agendamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_funil_etapas: {
        Row: {
          categoria: string
          cor: string
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          is_encerramento: boolean
          nome: string
          ordem: number
          peso: number
          updated_at: string
        }
        Insert: {
          categoria?: string
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          is_encerramento?: boolean
          nome: string
          ordem: number
          peso?: number
          updated_at?: string
        }
        Update: {
          categoria?: string
          cor?: string
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          is_encerramento?: boolean
          nome?: string
          ordem?: number
          peso?: number
          updated_at?: string
        }
        Relationships: []
      }
      arqo_grupo_membros: {
        Row: {
          created_at: string
          grupo_id: string
          id: string
          is_active: boolean
          ordem_roleta: number
          papel: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grupo_id: string
          id?: string
          is_active?: boolean
          ordem_roleta?: number
          papel?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grupo_id?: string
          id?: string
          is_active?: boolean
          ordem_roleta?: number
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arqo_grupo_membros_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "arqo_grupos_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_grupo_membros_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_grupos_atendimento: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          tipo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      arqo_lead_events: {
        Row: {
          comentario: string | null
          created_at: string
          etapa_de: string | null
          etapa_para: string | null
          id: string
          lead_id: string
          payload: Json
          temperatura_de: string | null
          temperatura_para: string | null
          tipo: string
          usuario_id: string | null
        }
        Insert: {
          comentario?: string | null
          created_at?: string
          etapa_de?: string | null
          etapa_para?: string | null
          id?: string
          lead_id: string
          payload?: Json
          temperatura_de?: string | null
          temperatura_para?: string | null
          tipo: string
          usuario_id?: string | null
        }
        Update: {
          comentario?: string | null
          created_at?: string
          etapa_de?: string | null
          etapa_para?: string | null
          id?: string
          lead_id?: string
          payload?: Json
          temperatura_de?: string | null
          temperatura_para?: string | null
          tipo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "arqo_lead_events_etapa_de_fkey"
            columns: ["etapa_de"]
            isOneToOne: false
            referencedRelation: "arqo_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_lead_events_etapa_para_fkey"
            columns: ["etapa_para"]
            isOneToOne: false
            referencedRelation: "arqo_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_vw_forecast_ponderado"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "arqo_lead_events_temperatura_de_fkey"
            columns: ["temperatura_de"]
            isOneToOne: false
            referencedRelation: "arqo_temperaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_lead_events_temperatura_para_fkey"
            columns: ["temperatura_para"]
            isOneToOne: false
            referencedRelation: "arqo_temperaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_lead_events_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_lead_sources: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          is_active: boolean
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          is_active?: boolean
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      arqo_leads: {
        Row: {
          atendimento_final_pelo_gestor: boolean
          atribuido_em: string | null
          cliente_id: string
          closer_id: string | null
          consultor_id: string | null
          created_at: string
          created_by: string | null
          empreendimento_id: string | null
          etapa_id: string
          fechado_em: string | null
          grupo_id: string | null
          id: string
          is_active: boolean
          motivo_perda: string | null
          observacoes: string | null
          optout_em: string | null
          proximo_contato_em: string | null
          qualificacao_atualizada_em: string | null
          qualificacao_resumo: string | null
          qualificacao_score: number | null
          source_id: string | null
          temperatura_id: string | null
          tentativas_contato: number
          ultimo_contato_em: string | null
          unidade_id: string | null
          updated_at: string
          valor_estimado: number | null
        }
        Insert: {
          atendimento_final_pelo_gestor?: boolean
          atribuido_em?: string | null
          cliente_id: string
          closer_id?: string | null
          consultor_id?: string | null
          created_at?: string
          created_by?: string | null
          empreendimento_id?: string | null
          etapa_id: string
          fechado_em?: string | null
          grupo_id?: string | null
          id?: string
          is_active?: boolean
          motivo_perda?: string | null
          observacoes?: string | null
          optout_em?: string | null
          proximo_contato_em?: string | null
          qualificacao_atualizada_em?: string | null
          qualificacao_resumo?: string | null
          qualificacao_score?: number | null
          source_id?: string | null
          temperatura_id?: string | null
          tentativas_contato?: number
          ultimo_contato_em?: string | null
          unidade_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Update: {
          atendimento_final_pelo_gestor?: boolean
          atribuido_em?: string | null
          cliente_id?: string
          closer_id?: string | null
          consultor_id?: string | null
          created_at?: string
          created_by?: string | null
          empreendimento_id?: string | null
          etapa_id?: string
          fechado_em?: string | null
          grupo_id?: string | null
          id?: string
          is_active?: boolean
          motivo_perda?: string | null
          observacoes?: string | null
          optout_em?: string | null
          proximo_contato_em?: string | null
          qualificacao_atualizada_em?: string | null
          qualificacao_resumo?: string | null
          qualificacao_score?: number | null
          source_id?: string | null
          temperatura_id?: string | null
          tentativas_contato?: number
          ultimo_contato_em?: string | null
          unidade_id?: string | null
          updated_at?: string
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arqo_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "arqo_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "arqo_grupos_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "arqo_lead_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_temperatura_id_fkey"
            columns: ["temperatura_id"]
            isOneToOne: false
            referencedRelation: "arqo_temperaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "seven_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_oportunidade_responsaveis: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          papel: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          papel: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          papel?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "arqo_oportunidade_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_oportunidade_responsaveis_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_vw_forecast_ponderado"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "arqo_oportunidade_responsaveis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_regua_reengajamento: {
        Row: {
          canal: string
          created_at: string
          dias_apos_ultimo_contato: number
          id: string
          is_active: boolean
          mensagem_template: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          canal?: string
          created_at?: string
          dias_apos_ultimo_contato: number
          id?: string
          is_active?: boolean
          mensagem_template: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          canal?: string
          created_at?: string
          dias_apos_ultimo_contato?: number
          id?: string
          is_active?: boolean
          mensagem_template?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      arqo_sla_regras: {
        Row: {
          acao_expiracao: string
          created_at: string
          etapa_id: string
          horas_max: number
          id: string
          is_active: boolean
          temperatura_id: string | null
          updated_at: string
        }
        Insert: {
          acao_expiracao?: string
          created_at?: string
          etapa_id: string
          horas_max?: number
          id?: string
          is_active?: boolean
          temperatura_id?: string | null
          updated_at?: string
        }
        Update: {
          acao_expiracao?: string
          created_at?: string
          etapa_id?: string
          horas_max?: number
          id?: string
          is_active?: boolean
          temperatura_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "arqo_sla_regras_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "arqo_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_sla_regras_temperatura_id_fkey"
            columns: ["temperatura_id"]
            isOneToOne: false
            referencedRelation: "arqo_temperaturas"
            referencedColumns: ["id"]
          },
        ]
      }
      arqo_temperaturas: {
        Row: {
          cor: string
          created_at: string
          id: string
          is_active: boolean
          nome: string
          ordem: number
          peso: number
          updated_at: string
        }
        Insert: {
          cor?: string
          created_at?: string
          id?: string
          is_active?: boolean
          nome: string
          ordem?: number
          peso?: number
          updated_at?: string
        }
        Update: {
          cor?: string
          created_at?: string
          id?: string
          is_active?: boolean
          nome?: string
          ordem?: number
          peso?: number
          updated_at?: string
        }
        Relationships: []
      }
      nexa_contratos: {
        Row: {
          created_at: string
          id: string
          status: string
          unidade_id: string | null
          updated_at: string
          valor: number | null
          visita_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          valor?: number | null
          visita_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          unidade_id?: string | null
          updated_at?: string
          valor?: number | null
          visita_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_contratos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "seven_unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_contratos_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "nexa_visitas"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_visitas: {
        Row: {
          arqo_lead_id: string | null
          cliente_id: string | null
          corretor_id: string | null
          created_at: string
          created_by: string | null
          data_hora: string
          empreendimento_id: string
          google_event_id: string | null
          id: string
          imobiliaria_parceira_id: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["nexa_visita_status"]
          updated_at: string
          visitante_nome: string | null
          visitante_telefone: string | null
        }
        Insert: {
          arqo_lead_id?: string | null
          cliente_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_hora: string
          empreendimento_id: string
          google_event_id?: string | null
          id?: string
          imobiliaria_parceira_id?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["nexa_visita_status"]
          updated_at?: string
          visitante_nome?: string | null
          visitante_telefone?: string | null
        }
        Update: {
          arqo_lead_id?: string | null
          cliente_id?: string | null
          corretor_id?: string | null
          created_at?: string
          created_by?: string | null
          data_hora?: string
          empreendimento_id?: string
          google_event_id?: string | null
          id?: string
          imobiliaria_parceira_id?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["nexa_visita_status"]
          updated_at?: string
          visitante_nome?: string | null
          visitante_telefone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexa_visitas_arqo_lead_id_fkey"
            columns: ["arqo_lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_arqo_lead_id_fkey"
            columns: ["arqo_lead_id"]
            isOneToOne: false
            referencedRelation: "arqo_vw_forecast_ponderado"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "nexa_visitas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "seven_corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_imobiliaria_parceira_id_fkey"
            columns: ["imobiliaria_parceira_id"]
            isOneToOne: false
            referencedRelation: "seven_imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      nexa_visitas_eventos: {
        Row: {
          created_at: string
          id: string
          payload: Json
          tipo_evento: string
          unidade_id: string | null
          usuario_id: string | null
          visita_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          tipo_evento: string
          unidade_id?: string | null
          usuario_id?: string | null
          visita_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          tipo_evento?: string
          unidade_id?: string | null
          usuario_id?: string | null
          visita_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexa_visitas_eventos_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "seven_unidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_eventos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nexa_visitas_eventos_visita_id_fkey"
            columns: ["visita_id"]
            isOneToOne: false
            referencedRelation: "nexa_visitas"
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
          empresa: string
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
          empresa?: string
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
          empresa?: string
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
      seven_blocos: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_boxes: {
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
            referencedRelation: "seven_blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boxes_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "seven_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_centro_custo_empreendimentos: {
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
            referencedRelation: "seven_centros_custo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "centro_custo_empreendimentos_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_centros_custo: {
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
      seven_cliente_interacoes: {
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
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_cliente_socios: {
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
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cliente_socios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_cliente_telefones: {
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
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_clientes: {
        Row: {
          cnpj: string | null
          conjuge_id: string | null
          corretor_id: string | null
          cpf: string | null
          created_at: string
          data_nascimento: string | null
          data_perda: string | null
          data_primeira_compra: string | null
          data_primeira_negociacao: string | null
          data_promocao_comprador: string | null
          data_promocao_qualificado: string | null
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
          inscricao_estadual: string | null
          interesse: string[] | null
          is_active: boolean
          lead_id: string | null
          motivo_perda: string | null
          nacionalidade: string | null
          nivel_cadastro: Database["public"]["Enums"]["nivel_cadastro_cliente"]
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          observacoes: string | null
          origem: string | null
          passaporte: string | null
          profissao: string | null
          razao_social: string | null
          renda_mensal: number | null
          rg: string | null
          telefone: string | null
          temperatura: string | null
          tipo_pessoa: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          cnpj?: string | null
          conjuge_id?: string | null
          corretor_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_perda?: string | null
          data_primeira_compra?: string | null
          data_primeira_negociacao?: string | null
          data_promocao_comprador?: string | null
          data_promocao_qualificado?: string | null
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
          inscricao_estadual?: string | null
          interesse?: string[] | null
          is_active?: boolean
          lead_id?: string | null
          motivo_perda?: string | null
          nacionalidade?: string | null
          nivel_cadastro?: Database["public"]["Enums"]["nivel_cadastro_cliente"]
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          origem?: string | null
          passaporte?: string | null
          profissao?: string | null
          razao_social?: string | null
          renda_mensal?: number | null
          rg?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string | null
          conjuge_id?: string | null
          corretor_id?: string | null
          cpf?: string | null
          created_at?: string
          data_nascimento?: string | null
          data_perda?: string | null
          data_primeira_compra?: string | null
          data_primeira_negociacao?: string | null
          data_promocao_comprador?: string | null
          data_promocao_qualificado?: string | null
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
          inscricao_estadual?: string | null
          interesse?: string[] | null
          is_active?: boolean
          lead_id?: string | null
          motivo_perda?: string | null
          nacionalidade?: string | null
          nivel_cadastro?: Database["public"]["Enums"]["nivel_cadastro_cliente"]
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          observacoes?: string | null
          origem?: string | null
          passaporte?: string | null
          profissao?: string | null
          razao_social?: string | null
          renda_mensal?: number | null
          rg?: string | null
          telefone?: string | null
          temperatura?: string | null
          tipo_pessoa?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_conjuge_id_fkey"
            columns: ["conjuge_id"]
            isOneToOne: false
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_corretor_id_fkey"
            columns: ["corretor_id"]
            isOneToOne: false
            referencedRelation: "seven_corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clientes_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
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
            referencedRelation: "seven_imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_configuracao_comercial: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_corretores: {
        Row: {
          cidade: string | null
          cod_sorteio: string | null
          cpf: string | null
          created_at: string
          creci: string | null
          email: string | null
          id: string
          imobiliaria_id: string | null
          is_active: boolean
          nome_completo: string
          send_campanha: string | null
          status_vinculo: string | null
          telefone: string | null
          uf: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cidade?: string | null
          cod_sorteio?: string | null
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          nome_completo: string
          send_campanha?: string | null
          status_vinculo?: string | null
          telefone?: string | null
          uf?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cidade?: string | null
          cod_sorteio?: string | null
          cpf?: string | null
          created_at?: string
          creci?: string | null
          email?: string | null
          id?: string
          imobiliaria_id?: string | null
          is_active?: boolean
          nome_completo?: string
          send_campanha?: string | null
          status_vinculo?: string | null
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
            referencedRelation: "seven_imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_empreendimento_corretores: {
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
            referencedRelation: "seven_corretores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_corretores_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_empreendimento_documentos: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_empreendimento_imobiliarias: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "empreendimento_imobiliarias_imobiliaria_id_fkey"
            columns: ["imobiliaria_id"]
            isOneToOne: false
            referencedRelation: "seven_imobiliarias"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_empreendimento_midias: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_empreendimentos: {
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
          texto_rodape_relatorio: string | null
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
          texto_rodape_relatorio?: string | null
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
          texto_rodape_relatorio?: string | null
          tipo?: Database["public"]["Enums"]["empreendimento_tipo"]
          total_unidades?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "empreendimentos_incorporadora_id_fkey"
            columns: ["incorporadora_id"]
            isOneToOne: false
            referencedRelation: "seven_incorporadoras"
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
      seven_fachadas: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_imobiliarias: {
        Row: {
          cnpj: string | null
          cpf: string | null
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
          tipo_pessoa: string
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cnpj?: string | null
          cpf?: string | null
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
          tipo_pessoa?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cnpj?: string | null
          cpf?: string | null
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
          tipo_pessoa?: string
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      seven_incorporadoras: {
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
      seven_lancamentos_financeiros: {
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
            foreignKeyName: "lancamentos_financeiros_centro_custo_id_fkey"
            columns: ["centro_custo_id"]
            isOneToOne: false
            referencedRelation: "seven_centros_custo"
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
            referencedRelation: "seven_plano_contas"
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_recorrencia_pai_id_fkey"
            columns: ["recorrencia_pai_id"]
            isOneToOne: false
            referencedRelation: "seven_lancamentos_financeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_mapa_empreendimento: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_plano_contas: {
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
            referencedRelation: "seven_plano_contas"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_saldos_mensais: {
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
      seven_tipologias: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_unidade_historico_precos: {
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
            referencedRelation: "seven_unidades"
            referencedColumns: ["id"]
          },
        ]
      }
      seven_unidades: {
        Row: {
          andar: number | null
          area_privativa: number | null
          bloco_id: string | null
          created_at: string
          data_venda: string | null
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
          data_venda?: string | null
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
          data_venda?: string | null
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
            referencedRelation: "seven_blocos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_fachada_id_fkey"
            columns: ["fachada_id"]
            isOneToOne: false
            referencedRelation: "seven_fachadas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unidades_tipologia_id_fkey"
            columns: ["tipologia_id"]
            isOneToOne: false
            referencedRelation: "seven_tipologias"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_audit_logs: {
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
      sistema_configuracoes: {
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
      sistema_modules: {
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
      sistema_notificacoes: {
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
      sistema_role_permissions: {
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
            referencedRelation: "sistema_modules"
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
      sistema_user_empreendimentos: {
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
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      sistema_user_module_permissions: {
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
            referencedRelation: "sistema_modules"
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
    }
    Views: {
      arqo_vw_forecast_ponderado: {
        Row: {
          cliente_id: string | null
          closer_id: string | null
          consultor_id: string | null
          created_at: string | null
          empreendimento_id: string | null
          etapa_categoria: string | null
          etapa_id: string | null
          etapa_nome: string | null
          fator_ponderacao: number | null
          grupo_id: string | null
          lead_id: string | null
          temperatura_id: string | null
          temperatura_nome: string | null
          updated_at: string | null
          valor_bruto: number | null
          valor_ponderado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "arqo_leads_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "seven_clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_closer_id_fkey"
            columns: ["closer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_consultor_id_fkey"
            columns: ["consultor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_empreendimento_id_fkey"
            columns: ["empreendimento_id"]
            isOneToOne: false
            referencedRelation: "seven_empreendimentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "arqo_funil_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "arqo_grupos_atendimento"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "arqo_leads_temperatura_id_fkey"
            columns: ["temperatura_id"]
            isOneToOne: false
            referencedRelation: "arqo_temperaturas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      arqo_atribuir_lead_roleta: {
        Args: {
          p_grupo_id: string
          p_lead_id: string
          p_tipo_atribuicao?: string
        }
        Returns: string
      }
      arqo_liberar_consultor: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      arqo_registrar_tentativa: {
        Args: { p_canal?: string; p_comentario?: string; p_lead_id: string }
        Returns: undefined
      }
      arqo_transicionar_status: {
        Args: {
          p_comentario?: string
          p_etapa_para: string
          p_lead_id: string
          p_motivo_perda?: string
        }
        Returns: undefined
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
      generate_cod_sorteio: { Args: never; Returns: string }
      get_cidades_corretores: {
        Args: never
        Returns: {
          cidade: string
        }[]
      }
      get_corretor_ids_by_user: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_gestor_empreendimento: { Args: { emp_id: string }; Returns: string }
      get_imobiliarias_ativas: {
        Args: never
        Returns: {
          endereco_cidade: string
          endereco_uf: string
          id: string
          nome: string
        }[]
      }
      get_module_scope: {
        Args: { _module_name: string; _user_id: string }
        Returns: string
      }
      get_or_create_pessoa: {
        Args: {
          p_cpf?: string
          p_email?: string
          p_nome: string
          p_origem?: string
          p_telefone?: string
        }
        Returns: string
      }
      get_role_id: { Args: { _role_name: string }; Returns: string }
      get_unidades_disponiveis: {
        Args: {
          p_empreendimento_id?: string
          p_incorporadora_id?: string
          p_status?: string[]
        }
        Returns: {
          andar: number
          area_privativa: number
          bloco: string
          empreendimento: string
          empreendimento_id: string
          incorporadora: string
          quartos: number
          status: string
          suites: number
          tipologia: string
          unidade: string
          unidade_id: string
          vagas: number
          valor: number
        }[]
      }
      get_unidades_disponiveis_bk: {
        Args: never
        Returns: {
          andar: number
          area_privativa: number
          bloco: string
          empreendimento: string
          quartos: number
          status: string
          suites: number
          tipologia: string
          unidade: string
          unidade_id: string
          vagas: number
          valor: number
        }[]
      }
      get_user_empresa: { Args: { _user_id: string }; Returns: string }
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
      higienizar_telefone_whatsapp: {
        Args: never
        Returns: {
          etapa: string
          registros_afetados: number
        }[]
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_cliente_externo: { Args: { _user_id: string }; Returns: boolean }
      is_gestor_imobiliaria: { Args: { _user_id: string }; Returns: boolean }
      is_incorporador: { Args: { _user_id: string }; Returns: boolean }
      is_nexa_user: { Args: { _user_id: string }; Returns: boolean }
      is_seven_team: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      user_has_empreendimento_access: {
        Args: { _empreendimento_id: string; _user_id: string }
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
      nexa_visita_status:
        | "agendada"
        | "confirmada"
        | "realizada"
        | "no_show"
        | "cancelada"
      nivel_cadastro_cliente: "lead" | "qualificado" | "comprador"
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
      nexa_visita_status: [
        "agendada",
        "confirmada",
        "realizada",
        "no_show",
        "cancelada",
      ],
      nivel_cadastro_cliente: ["lead", "qualificado", "comprador"],
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
