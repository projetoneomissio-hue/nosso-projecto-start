
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const TEMP_RESPONSAVEL_ID = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3';

interface StudentData {
    nome: string;
    idade: number;
    rematricula: string;
    jan: string;
    fev: string;
}

interface ImportGroup {
    turma: string;
    horario: string;
    students: StudentData[];
}

const groupsToImport: ImportGroup[] = [
    {
        turma: 'Jiu-Jitsu Infantil 2',
        horario: '11:00 - 12:00', // Estimate
        students: [
            { nome: 'Aimée Websky Meier', idade: 7, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Ana Clara Machado', idade: 9, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Anthony cordeiro gama', idade: 7, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Benedito Campos Theodoro', idade: 6, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Daniel Schroeter Knupp', idade: 7, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Elisa Streisky Dorneles', idade: 8, rematricula: 'ok', jan: '70,00', fev: '70,00' },
            { nome: 'Eudora Arabel Maia da Silva', idade: 9, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Helena Andretta de Assis', idade: 8, rematricula: '', jan: '70,00', fev: '70,00' },
            { nome: 'Heloisa Mesquita de Almeida', idade: 9, rematricula: '', jan: '70,00', fev: '70,00' },
            { nome: 'João Henrique dos Santos barbosa', idade: 9, rematricula: '', jan: '', fev: '' },
            { nome: 'Larissa emanuelle finkensieper da Costa', idade: 9, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Lauren Kramer de Lima', idade: 9, rematricula: '15,00', jan: '', fev: '70,00' },
            { nome: 'Leandro Gama Vernizi', idade: 7, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Leonardo Silveira Oliveira', idade: 8, rematricula: '25,00', jan: '70,00', fev: '' },
            { nome: 'Martín de Novaes Pequeno da Silva', idade: 10, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Matias Campos Theodoro', idade: 9, rematricula: 'ok', jan: '70,00', fev: '70,00' },
            { nome: 'Miguel Ciota Verona', idade: 11, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Miguel Schnekemberg Martins.', idade: 9, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Oliver Ethan lopes de moura', idade: 9, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Olívia Garofani Paz', idade: 8, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Theo Knupp Ramos', idade: 8, rematricula: '', jan: '', fev: '' },
            { nome: 'Tuany Araujo Oliveira', idade: 10, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Valentina Gomes Bello', idade: 7, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        ]
    },
    {
        turma: 'Jiu-Jitsu Infantil 3',
        horario: '14:00 - 15:00', // Estimate
        students: [
            { nome: 'Asaf Hecht Lourenço', idade: 13, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Davi Silverio Pinto', idade: 10, rematricula: 'ok', jan: '70,00', fev: '70,00' },
            { nome: 'Gabriel Dubek Teixeira', idade: 12, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Heitor Andretta de Assis', idade: 12, rematricula: '', jan: '70,00', fev: '70,00' },
            { nome: 'João Francisco de Assis Brum Pires', idade: 12, rematricula: 'ok', jan: '70,00', fev: '70,00' },
            { nome: 'Laura Pinheiro Gabre', idade: 12, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Miguel Lorenzo de Liz Gomes', idade: 11, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Miguel Schroeter Knupp', idade: 11, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Pedro Henrique da Silva de Camargo', idade: 10, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'Thomas Henrique Andretta Neves', idade: 12, rematricula: '25,00', jan: '70,00', fev: '70,00' },
        ]
    },
    {
        turma: 'Jiu-Jitsu Adulto',
        horario: '19:00 - 20:30', // Estimate
        students: [
            { nome: 'Alisson de Oliveira', idade: 39, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Anderson Bahiense Rodrigues', idade: 53, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Leandro da Fonseca', idade: 42, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Luis Fernando Malessa Dorneles', idade: 36, rematricula: 'ok', jan: '100,00', fev: '100,00' },
            { nome: 'Malcom noa Gomes de lima', idade: 15, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Marcus Vinicius Santana Lopes', idade: 41, rematricula: 'ok', jan: '150,00', fev: '150,00' },
            { nome: 'Roger Hudson Emer', idade: 36, rematricula: '25,00', jan: '70,00', fev: '70,00' },
            { nome: 'William Savulski de Carvalho', idade: 29, rematricula: '10,00', jan: '100,00', fev: '100,00' },
        ]
    }
];

async function importData() {
    console.log('🚀 Iniciando Migração de Dados (Fase 2 - Multi-Turmas)...');

    // Get or Create "Jiu-Jitsu" activity
    const { data: atividade } = await supabase
        .from('atividades')
        .select('id')
        .eq('nome', 'Jiu-Jitsu')
        .single();

    let atividadeId = atividade?.id;
    if (!atividadeId) {
        const { data: newAtiv } = await supabase
            .from('atividades')
            .insert({ nome: 'Jiu-Jitsu', ativa: true, valor_mensal: 70.00, capacidade_maxima: 50 })
            .select().single();
        atividadeId = newAtiv!.id;
    }

    for (const group of groupsToImport) {
        console.log(`\n📦 Processando Turma: ${group.turma}`);

        // Check then Create Turma
        const { data: turma } = await supabase
            .from('turmas')
            .select('id')
            .eq('nome', group.turma)
            .maybeSingle();

        let turmaId = turma?.id;
        if (!turmaId) {
            const { data: newTurma } = await supabase
                .from('turmas')
                .insert({
                    nome: group.turma,
                    atividade_id: atividadeId,
                    horario: group.horario,
                    dias_semana: ['Segunda', 'Quarta', 'Sexta'],
                    capacidade_maxima: 30,
                    ativa: true
                })
                .select().single();
            turmaId = newTurma!.id;
        }

        for (const s of group.students) {
            process.stdout.write(`  👤 Aluno: ${s.nome.padEnd(40)}`);

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

                if (errA) { console.log(` ❌ ERRO ALUNO: ${errA.message}`); continue; }
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

                if (errM) { console.log(` ❌ ERRO MATRÍCULA: ${errM.message}`); continue; }
                matricula = newMatr;
            }

            // Pagamentos
            const payEntries = [];
            if (s.jan) payEntries.push({ mes: 'Janeiro', val: s.jan, date: '2026-01-10' });
            if (s.fev) payEntries.push({ mes: 'Fevereiro', val: s.fev, date: '2026-02-10' });

            for (const p of payEntries) {
                const v = parseFloat(p.val.replace(',', '.'));
                if (isNaN(v)) continue;

                const { data: existingPay } = await supabase
                    .from('pagamentos')
                    .select('id')
                    .eq('matricula_id', matricula!.id)
                    .eq('data_vencimento', p.date)
                    .maybeSingle();

                if (!existingPay) {
                    const { error: errP } = await supabase.from('pagamentos').insert({
                        matricula_id: matricula!.id,
                        valor: v,
                        data_vencimento: p.date,
                        data_pagamento: p.date,
                        status: 'pago',
                        forma_pagamento: 'pix'
                    });
                    if (errP) process.stdout.write(` ⚠️ Erro Pgto ${p.mes}`);
                }
            }
            console.log(' ✅ OK');
        }
    }

    console.log('\n✨ Migração Completa!');
}

importData().catch(console.error);
