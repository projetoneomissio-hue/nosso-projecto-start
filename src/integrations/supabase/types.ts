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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alunos: {
        Row: {
          cpf: string | null
          created_at: string
          data_nascimento: string
          endereco: string | null
          id: string
          nome_completo: string
          responsavel_id: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          data_nascimento: string
          endereco?: string | null
          id?: string
          nome_completo: string
          responsavel_id: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          data_nascimento?: string
          endereco?: string | null
          id?: string
          nome_completo?: string
          responsavel_id?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alunos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      anamneses: {
        Row: {
          alergias: string | null
          aluno_id: string
          condicoes_medicas: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_relacao: string | null
          contato_emergencia_telefone: string | null
          created_at: string
          id: string
          medicamentos: string | null
          observacoes: string | null
          plano_saude: string | null
          updated_at: string
        }
        Insert: {
          alergias?: string | null
          aluno_id: string
          condicoes_medicas?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_relacao?: string | null
          contato_emergencia_telefone?: string | null
          created_at?: string
          id?: string
          medicamentos?: string | null
          observacoes?: string | null
          plano_saude?: string | null
          updated_at?: string
        }
        Update: {
          alergias?: string | null
          aluno_id?: string
          condicoes_medicas?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_relacao?: string | null
          contato_emergencia_telefone?: string | null
          created_at?: string
          id?: string
          medicamentos?: string | null
          observacoes?: string | null
          plano_saude?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          ativa: boolean | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          ativa?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      comunicados: {
        Row: {
          conteudo: string
          created_at: string | null
          criado_por: string | null
          destinatario_id: string | null
          id: string
          tipo: string
          titulo: string
          urgente: boolean | null
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          criado_por?: string | null
          destinatario_id?: string | null
          id?: string
          tipo: string
          titulo: string
          urgente?: boolean | null
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          criado_por?: string | null
          destinatario_id?: string | null
          id?: string
          tipo?: string
          titulo?: string
          urgente?: boolean | null
        }
        Relationships: []
      }
      coordenador_atividades: {
        Row: {
          atividade_id: string
          coordenador_id: string
          created_at: string
        }
        Insert: {
          atividade_id: string
          coordenador_id: string
          created_at?: string
        }
        Update: {
          atividade_id?: string
          coordenador_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coordenador_atividades_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coordenador_atividades_coordenador_id_fkey"
            columns: ["coordenador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      custos_predio: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          recorrente: boolean | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          descricao: string
          id?: string
          recorrente?: boolean | null
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          recorrente?: boolean | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          cargo: string
          created_at: string
          data_admissao: string
          id: string
          nome: string
          salario: number
          updated_at: string
        }
        Insert: {
          cargo: string
          created_at?: string
          data_admissao: string
          id?: string
          nome: string
          salario: number
          updated_at?: string
        }
        Update: {
          cargo?: string
          created_at?: string
          data_admissao?: string
          id?: string
          nome?: string
          salario?: number
          updated_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      locacoes: {
        Row: {
          created_at: string
          data: string
          evento: string
          horario_fim: string
          horario_inicio: string
          id: string
          observacoes: string | null
          responsavel_nome: string
          responsavel_telefone: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data: string
          evento: string
          horario_fim: string
          horario_inicio: string
          id?: string
          observacoes?: string | null
          responsavel_nome: string
          responsavel_telefone?: string | null
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data?: string
          evento?: string
          horario_fim?: string
          horario_inicio?: string
          id?: string
          observacoes?: string | null
          responsavel_nome?: string
          responsavel_telefone?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      matriculas: {
        Row: {
          aluno_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_matricula"] | null
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_matricula"] | null
          turma_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_matricula"] | null
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matriculas_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_recovery_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          id: string
          matricula_id: string
          metodo_pagamento: string | null
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          id?: string
          matricula_id: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          id?: string
          matricula_id?: string
          metodo_pagamento?: string | null
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"] | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome_completo: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome_completo?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professores: {
        Row: {
          cpf: string | null
          created_at: string
          especialidade: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          especialidade?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          especialidade?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      turmas: {
        Row: {
          ativa: boolean | null
          atividade_id: string
          capacidade: number
          created_at: string
          dias_semana: string[]
          horario: string
          id: string
          nome: string
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean | null
          atividade_id: string
          capacidade: number
          created_at?: string
          dias_semana: string[]
          horario: string
          id?: string
          nome: string
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean | null
          atividade_id?: string
          capacidade?: number
          created_at?: string
          dias_semana?: string[]
          horario?: string
          id?: string
          nome?: string
          professor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turmas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: {
          user_id: string
          required_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_new_user: {
        Args: {
          email: string
          full_name: string
          role: Database["public"]["Enums"]["app_role"]
          password_hash: string
        }
        Returns: string
      }
      dissolve_family_group: {
        Args: {
          group_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "direcao" | "coordenacao" | "professor" | "responsavel"
      status_matricula: "pendente" | "ativa" | "cancelada" | "concluida"
      status_pagamento: "pendente" | "pago" | "atrasado" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
    Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
    Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof Database["public"]["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof Database["public"]["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof Database["public"]["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
  ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never
