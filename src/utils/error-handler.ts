import { toast } from "sonner";

/**
 * Interface para erros do Supabase/PostgREST
 */
interface SupabaseError {
    code?: string;
    message: string;
    details?: string;
    hint?: string;
}

/**
 * Mapeamento de códigos de erro do Supabase para mensagens em Português
 */
const ERROR_MAPPING: Record<string, string> = {
    // Erros de Autenticação (Auth)
    "invalid_credentials": "E-mail ou senha incorretos. Por favor, tente novamente.",
    "email_not_confirmed": "Por favor, confirme seu e-mail antes de fazer login.",
    "user_already_exists": "Já existe um usuário cadastrado com este e-mail.",
    "invalid_grant": "Credenciais inválidas.",
    "too_many_requests": "Muitas tentativas. Por favor, aguarde um momento.",

    // Erros de Banco de Dados (PostgreSQL / PostgREST)
    "23505": "Este registro já existe no sistema.",
    "23503": "Não é possível realizar esta ação porque este item está sendo usado em outro lugar.",
    "42P01": "Erro de configuração do sistema (tabela não encontrada).",
    "PGRST116": "O registro solicitado não foi encontrado.",
    "P0001": "Erro de validação personalizada no servidor.",

    // MFA
    "mfa_challenge_failed": "Código de verificação incorreto.",
    "mfa_factor_not_found": "Fator de autenticação não encontrado.",
};

/**
 * Função centralizada para lidar com erros e exibir toasts amigáveis
 */
export const handleError = (error: any, customTitle?: string) => {
    console.error("Error catched by handler:", error);

    let message = "Ocorreu um erro inesperado. Por favor, tente novamente.";

    if (typeof error === "string") {
        message = error;
    } else if (error?.code && ERROR_MAPPING[error.code]) {
        message = ERROR_MAPPING[error.code];
    } else if (error?.message && ERROR_MAPPING[error.message]) {
        message = ERROR_MAPPING[error.message];
    } else if (error?.error_description) {
        // Alguns erros de auth do Supabase vêm aqui
        message = error.error_description;
    } else if (error?.message) {
        message = error.message;
    }

    toast.error(customTitle || "Erro!", {
        description: message,
    });

    return message;
};
