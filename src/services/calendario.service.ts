import { supabase } from "@/integrations/supabase/client";

export interface CalendarioEvento {
    id: string;
    unidade_id: string;
    titulo: string;
    descricao?: string;
    data_inicio: string;
    data_fim: string;
    tipo: 'feriado' | 'recesso' | 'evento' | 'prova' | 'reuniao';
    eh_dia_letivo: boolean;
}

export interface CriarEventoDTO {
    unidade_id: string;
    titulo: string;
    descricao?: string;
    data_inicio: string;
    data_fim: string;
    tipo: CalendarioEvento['tipo'];
    eh_dia_letivo: boolean;
}

export const calendarioService = {
    async listarEventos(unidadeId: string, dataInicio: string, dataFim: string) {
        const { data, error } = await supabase
            .from('calendario_escolar' as any)
            .select('*')
            .eq('unidade_id', unidadeId)
            .gte('data_fim', dataInicio) // Pega eventos que terminam depois do início da busca
            .lte('data_inicio', dataFim) // E começam antes do fim da busca
            .order('data_inicio', { ascending: true });

        if (error) throw error;
        return data as CalendarioEvento[];
    },

    async criarEvento(evento: CriarEventoDTO) {
        const { data, error } = await supabase
            .from('calendario_escolar' as any)
            .insert(evento)
            .select()
            .single();

        if (error) throw error;
        return data as CalendarioEvento;
    },

    async excluirEvento(id: string) {
        const { error } = await supabase
            .from('calendario_escolar' as any)
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
