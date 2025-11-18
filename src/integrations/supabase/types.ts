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
          tipo_sanguineo: string | null
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
          tipo_sanguineo?: string | null
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
          tipo_sanguineo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anamneses_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: true
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anamneses_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: true
            referencedRelation: "alunos_secure"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          ativa: boolean
          capacidade_maxima: number | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          ativa?: boolean
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          valor_mensal: number
        }
        Update: {
          ativa?: boolean
          capacidade_maxima?: number | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: []
      }
      coordenador_atividades: {
        Row: {
          atividade_id: string
          coordenador_id: string
          created_at: string
          id: string
        }
        Insert: {
          atividade_id: string
          coordenador_id: string
          created_at?: string
          id?: string
        }
        Update: {
          atividade_id?: string
          coordenador_id?: string
          created_at?: string
          id?: string
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
          data_competencia: string
          id: string
          item: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_competencia: string
          id?: string
          item: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_competencia?: string
          id?: string
          item?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          funcao: string
          id: string
          nome: string
          salario: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          funcao: string
          id?: string
          nome: string
          salario: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          funcao?: string
          id?: string
          nome?: string
          salario?: number
          updated_at?: string
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
          status: Database["public"]["Enums"]["status_matricula"]
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_matricula"]
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
          status?: Database["public"]["Enums"]["status_matricula"]
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
            foreignKeyName: "matriculas_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_secure"
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
      observacoes: {
        Row: {
          aluno_id: string
          created_at: string
          data: string
          id: string
          observacao: string
          professor_id: string
          tipo: string
          turma_id: string
          updated_at: string
        }
        Insert: {
          aluno_id: string
          created_at?: string
          data?: string
          id?: string
          observacao: string
          professor_id: string
          tipo: string
          turma_id: string
          updated_at?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string
          data?: string
          id?: string
          observacao?: string
          professor_id?: string
          tipo?: string
          turma_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "observacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observacoes_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos_secure"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observacoes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observacoes_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          created_at: string
          data_pagamento: string | null
          data_vencimento: string
          forma_pagamento: string | null
          id: string
          matricula_id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          updated_at: string
          valor: number
        }
        Insert: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento: string
          forma_pagamento?: string | null
          id?: string
          matricula_id: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          valor: number
        }
        Update: {
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string
          forma_pagamento?: string | null
          id?: string
          matricula_id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
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
      presencas: {
        Row: {
          created_at: string
          data: string
          id: string
          matricula_id: string
          observacao: string | null
          presente: boolean
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          matricula_id: string
          observacao?: string | null
          presente: boolean
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          matricula_id?: string
          observacao?: string | null
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "presencas_matricula_id_fkey"
            columns: ["matricula_id"]
            isOneToOne: false
            referencedRelation: "matriculas"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ativo: boolean
          created_at: string
          especialidade: string | null
          id: string
          percentual_comissao: number
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          especialidade?: string | null
          id?: string
          percentual_comissao?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          especialidade?: string | null
          id?: string
          percentual_comissao?: number
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          nome_completo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          nome_completo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          nome_completo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ativa: boolean
          atividade_id: string
          capacidade_maxima: number
          created_at: string
          dias_semana: string[]
          horario: string
          id: string
          nome: string
          professor_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          atividade_id: string
          capacidade_maxima: number
          created_at?: string
          dias_semana: string[]
          horario: string
          id?: string
          nome: string
          professor_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          atividade_id?: string
          capacidade_maxima?: number
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
      alunos_secure: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          endereco: string | null
          id: string | null
          nome_completo: string | null
          responsavel_id: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: never
          created_at?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          id?: string | null
          nome_completo?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: never
          created_at?: string | null
          data_nascimento?: string | null
          endereco?: string | null
          id?: string | null
          nome_completo?: string | null
          responsavel_id?: string | null
          telefone?: string | null
          updated_at?: string | null
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
    }
    Functions: {
      get_aluno_cpf: {
        Args: { aluno_id: string; cpf_value: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_coordenador_atividade: {
        Args: { _atividade_id: string; _user_id: string }
        Returns: boolean
      }
      is_coordenador_turma: {
        Args: { _turma_id: string; _user_id: string }
        Returns: boolean
      }
      is_professor_turma: {
        Args: { _turma_id: string; _user_id: string }
        Returns: boolean
      }
      is_responsavel_aluno: {
        Args: { _aluno_id: string; _user_id: string }
        Returns: boolean
      }
      mask_cpf: { Args: { cpf_value: string }; Returns: string }
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
      app_role: ["direcao", "coordenacao", "professor", "responsavel"],
      status_matricula: ["pendente", "ativa", "cancelada", "concluida"],
      status_pagamento: ["pendente", "pago", "atrasado", "cancelado"],
    },
  },
} as const
