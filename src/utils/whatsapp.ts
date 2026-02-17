/**
 * Utilitários para integração com WhatsApp (Click-to-Chat)
 */

/**
 * Formata um número de telefone para o padrão do WhatsApp (apenas dígitos, com código do país 55 se não houver)
 * @param phone Número de telefone (ex: (11) 99999-9999)
 * @returns Número formatado (ex: 5511999999999) ou null se inválido
 */
export function formatWhatsAppNumber(phone: string | null | undefined): string | null {
    if (!phone) return null;

    // Remove tudo que não é dígito
    let cleanPhone = phone.replace(/\D/g, "");

    // Se estiver vazio após limpeza
    if (cleanPhone.length === 0) return null;

    // Se não tiver o código do país (55) e tiver 10 ou 11 dígitos, adiciona
    if (cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        cleanPhone = "55" + cleanPhone;
    }

    return cleanPhone;
}

/**
 * Gera um link para iniciar uma conversa no WhatsApp
 * @param phone Número de telefone destino
 * @param message Mensagem inicial (opcional)
 * @returns URL completa (ex: https://wa.me/5511999999999?text=Olá)
 */
export function generateWhatsAppLink(phone: string, message?: string): string {
    const formattedPhone = formatWhatsAppNumber(phone);
    if (!formattedPhone) return "";

    const baseUrl = `https://wa.me/${formattedPhone}`;

    if (message) {
        const encodedMessage = encodeURIComponent(message);
        return `${baseUrl}?text=${encodedMessage}`;
    }

    return baseUrl;
}

/**
 * Templates de mensagens comuns
 */
export const WhatsAppTemplates = {
    cobranca: (nomeResponsavel: string, nomeAluno: string, mesReferencia: string, valor: string) => {
        return `Olá ${nomeResponsavel}, somos da NeoMissio.
    
Referente ao aluno(a) *${nomeAluno}*, notamos uma pendência na mensalidade de *${mesReferencia}* no valor de *R$ ${valor}*.

Podemos ajudar enviando o boleto ou a chave Pix?`;
    },

    recibo: (nomeResponsavel: string, nomeAluno: string, atividade: string, valor: string) => {
        return `Olá ${nomeResponsavel}!
    
Confirmamos o recebimento do pagamento de *R$ ${valor}* referente à *${atividade}* do aluno(a) *${nomeAluno}*.

Obrigado! 🚀`;
    },

    contatoGeral: (nomeResponsavel: string) => {
        return `Olá ${nomeResponsavel}, tudo bem? Entramos em contato referente a NeoMissio.`;
    }
};
