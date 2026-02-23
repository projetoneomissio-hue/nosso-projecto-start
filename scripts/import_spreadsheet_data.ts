
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEMP_RESPONSAVEL_ID = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3';

async function importData() {
    console.log('🚀 Iniciando Migração de Dados (V3 - Check-then-Create)...');

    // 1. Atividade
    const { data: atividade } = await supabase
        .from('atividades')
        .select('id')
        .eq('nome', 'Jiu-Jitsu')
        .single();

    let atividadeId = atividade?.id;
    if (!atividadeId) {
        const { data: newAtiv } = await supabase
            .from('atividades')
            .insert({ nome: 'Jiu-Jitsu', ativa: true, valor_mensal: 70.00, capacidade_maxima: 20 })
            .select().single();
        atividadeId = newAtiv!.id;
    }

    // 2. Turma
    const { data: turma } = await supabase
        .from('turmas')
        .select('id')
        .eq('nome', 'Jiu-Jitsu Infantil 1')
        .single();

    let turmaId = turma?.id;
    if (!turmaId) {
        const { data: newTurma } = await supabase
            .from('turmas')
            .insert({
                nome: 'Jiu-Jitsu Infantil 1',
                atividade_id: atividadeId,
                horario: '10:00 - 11:00',
                dias_semana: ['Segunda', 'Quarta'],
                capacidade_maxima: 20,
                ativa: true
            })
            .select().single();
        turmaId = newTurma!.id;
    }

    // 3. Dados
    const studentsToImport = [
        { nome: 'Ana Bella Campos Theodoro', idade: 4, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Carolina Ciota Verona', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Franchesco Aaron serrano moreno', idade: 4, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'isabela Lohayne de Liz Fonseca', idade: 4, rematricula: 'ok', jan: '70,00', fev: '70,00' },
        { nome: 'Joaquim Garofani Paz', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Leonardo Porochniak Silveira', idade: 6, rematricula: '', jan: '70,00', fev: '70,00' },
        { nome: 'Levi Streisky Dorneles', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Luan Koch Prado', idade: 5, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Noah Mateus Machado', idade: 5, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Paulo Streisky Dorneles', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        { nome: 'Vicente Borges de Castilhos', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
    ];

    for (const s of studentsToImport) {
        console.log(`👤 Aluno: ${s.nome}`);

        // Check then Create Aluno
        let { data: aluno } = await supabase
            .from('alunos')
            .select('id')
            .eq('nome_completo', s.nome)
            .maybeSingle();

        if (!aluno) {
            const birthDate = new Date();
            birthDate.setFullYear(2026 - s.idade);
            const { data: newAluno, error: errA } = await supabase
                .from('alunos')
                .insert({
                    nome_completo: s.nome,
                    data_nascimento: birthDate.toISOString().split('T')[0],
                    responsavel_id: TEMP_RESPONSAVEL_ID
                }).select().single();

            if (errA) { console.error(`Err aluno ${s.nome}:`, errA.message); continue; }
            aluno = newAluno;
        }

        // Check then Create Matrícula
        let { data: matricula } = await supabase
            .from('matriculas')
            .select('id')
            .eq('aluno_id', aluno!.id)
            .eq('turma_id', turmaId)
            .maybeSingle();

        if (!matricula) {
            const { data: newMatr, error: errM } = await supabase
                .from('matriculas')
                .insert({
                    aluno_id: aluno!.id,
                    turma_id: turmaId,
                    status: 'ativa',
                    data_inicio: '2026-01-01'
                }).select().single();

            if (errM) { console.error(`Err matr ${s.nome}:`, errM.message); continue; }
            matricula = newMatr;
        }

        // Pagamentos (Check by mes/ano could be added, but for now just inserting)
        const payEntries = [
            { mes: 'Janeiro', val: s.jan, date: '2026-01-10' },
            { mes: 'Fevereiro', val: s.fev, date: '2026-02-10' }
        ];

        for (const p of payEntries) {
            const v = parseFloat(p.val.replace(',', '.'));
            if (isNaN(v)) continue;

            // Simple check to avoid double payments for same month
            const { data: existingPay } = await supabase
                .from('pagamentos')
                .select('id')
                .eq('matricula_id', matricula!.id)
                .eq('data_vencimento', p.date)
                .maybeSingle();

            if (!existingPay) {
                await supabase.from('pagamentos').insert({
                    matricula_id: matricula!.id,
                    valor: v,
                    data_vencimento: p.date,
                    data_pagamento: p.date,
                    status: 'pago',
                    forma_pagamento: 'pix'
                });
            }
        }
    }

    console.log('✅ Migração V3 concluída!');
}

importData().catch(console.error);
