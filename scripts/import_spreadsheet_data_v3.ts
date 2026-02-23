
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
    rematricula?: string;
    jan?: string;
    fev?: string;
    mar?: string;
}

interface ImportGroup {
    turma: string;
    atividade: string;
    mensalidade: number;
    horario: string;
    students: StudentData[];
}

const groupsToImport: ImportGroup[] = [
    {
        turma: 'Pilates Regular',
        atividade: 'Pilates',
        mensalidade: 100.00,
        horario: '18:00 - 19:00', // Estimate
        students: [
            { nome: 'Carmem Scariot', idade: 40, rematricula: '25,00', jan: '100,00', fev: '100,00' }, // Estimated age 40
            { nome: 'Cleusa Maria Furtado', idade: 64, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Deli Mari Chibior Lourenço de Souza', idade: 53, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Emilia Lopes', idade: 68, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Fatima aparecida linhares', idade: 47, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Iracema da Silva', idade: 50, rematricula: '25,00', jan: '100,00', fev: '100,00' }, // Estimated age 50
            { nome: 'Ivanir de Lourdes Xavier', idade: 63, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Joana Maria Viana de Freitas', idade: 55, rematricula: '25,00', jan: '100,00', fev: '100,00' }, // Estimated age 55
            { nome: 'Jocelina Joaquim de Andrade', idade: 50, rematricula: 'ok', fev: '100,00' }, // Estimated age 50
            { nome: 'Leoni Bueno Teodorovecz', idade: 74, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Maria Cleusa da Cruz', idade: 75, jan: '100,00', fev: '100,00' },
            { nome: 'Maria Salete Antunes', idade: 61, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Mirian Reddin', idade: 69, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Otilia Franczak Carvalho', idade: 67, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Rosália Freire Campana', idade: 67, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Roseli Terezinha da Rocha', idade: 75, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Sibele Felix', idade: 45, rematricula: '25,00', jan: '100,00', fev: '100,00' }, // Estimated age 45
            { nome: 'Vanessa Mendonça de Freitas', idade: 43, rematricula: '25,00', jan: '100,00', fev: '100,00' },
            { nome: 'Zenir de Jesus Miqueliza Felix', idade: 56, rematricula: '25,00', jan: '100,00', fev: '100,00' }, // Estimated age 56
            { nome: 'Ana Luiza', idade: 19, rematricula: '25,00', jan: '100,00', fev: '100,00' },
        ]
    },
    {
        turma: 'Vôlei Juvenil',
        atividade: 'Vôlei',
        mensalidade: 60.00,
        horario: '16:00 - 17:30', // Estimate
        students: [
            { nome: 'Emanuelle Luiza Vassoler Marques', idade: 13, rematricula: '25,00' },
            { nome: 'Fernanda Silveira Oliveira', idade: 16, rematricula: '25,00', jan: '60,00' },
            { nome: 'João Gabriel Silveira Oliveira', idade: 13, rematricula: '25,00', jan: '60,00' },
            { nome: 'Kauanny Ketllyn Cheslacki de Oliveira', idade: 15, rematricula: '25,00', jan: '60,00', fev: '60,00' },
            { nome: 'Lucas Socoloski Patyk', idade: 12, rematricula: '25,00', jan: '60,00', fev: '60,00' },
            { nome: 'Marina Oliszczcki Chagas', idade: 13, fev: '60,00' },
            { nome: 'Valentina Schonenborn Balduino', idade: 11, rematricula: '25,00', jan: '60,00', fev: '60,00' },
            { nome: 'Miguel Sureck', idade: 10, fev: '60,00' }, // Age 2016 -> ~10 in 2026
        ]
    },
    {
        turma: 'Desenho Iniciante',
        atividade: 'Desenho',
        mensalidade: 60.00,
        horario: '14:00 - 15:30', // Estimate
        students: [
            { nome: 'Arthur Junqueira', idade: 9, rematricula: '25,00', fev: '60,00' },
            { nome: 'Cecília de haro Bronner', idade: 8, rematricula: 'ok', fev: '60,00' },
            { nome: 'Davi Silverio Pinto', idade: 10, rematricula: '25,00', fev: '60,00' },
            { nome: 'Gabriel Dubek Teixeira', idade: 12, rematricula: '25,00', fev: '60,00', mar: '60,00' },
            { nome: 'Gustavo Oliveira Schadlich', idade: 12, rematricula: '25,00', fev: '60,00' },
            { nome: 'Kauê Henrique Santana dos Santos', idade: 8, rematricula: '25,00', fev: '60,00' },
            { nome: 'Marianna Moser Guilherme', idade: 12, rematricula: '25,00', fev: '60,00' },
            { nome: 'Miguel Schnekemberg Martins.', idade: 9, rematricula: 'ok', fev: '60,00' },
            { nome: 'Myrian Batista Ilariuch', idade: 10, rematricula: '25,00', fev: '60,00' },
            { nome: 'Oliver Ethan Lopes de Moura', idade: 9, rematricula: 'ok', fev: '60,00' }, // Estimated 9 from previous tab
            { nome: 'Rozeli dos Reis', idade: 59, rematricula: '25,00', fev: '60,00' },
        ]
    },
    {
        turma: 'Inglês Básico',
        atividade: 'Inglês',
        mensalidade: 60.00,
        horario: '15:30 - 17:00', // Estimate
        students: [
            { nome: 'Bernardo Merlo Bonetti Scala', idade: 10, rematricula: '25,00', fev: '60,00' },
            { nome: 'Heloísa Mesquita de Almeida', idade: 9, rematricula: '25,00', fev: '60,00' },
            { nome: 'Isadora Nefertari Magnaguagno Sforza', idade: 7, rematricula: '25,00', fev: '60,00' },
            { nome: 'João Francisco Brum Pires', idade: 12, rematricula: '25,00', fev: '60,00' }, // Estimated 12 from previous tab
            { nome: 'Maria Agatha Miranda silva', idade: 11, rematricula: '25,00', fev: '60,00' },
            { nome: 'Miguel Schroeter Knupp', idade: 11, rematricula: 'ok', fev: '60,00' },
            { nome: 'Sarah Dambros Stella Silva', idade: 11, fev: '60,00' },
            { nome: 'Davi Silverio Pinto', idade: 10, rematricula: '100,00', fev: '60,00' },
        ]
    },
    {
        turma: 'Ballet Infantil',
        atividade: 'Ballet',
        mensalidade: 60.00,
        horario: '10:00 - 11:00', // Estimate
        students: [
            { nome: 'Lavinia Rodrigues', idade: 10, rematricula: '25,00', jan: '60,00' },
            { nome: 'Amaya da Rosa', idade: 4, rematricula: '25,00', jan: '60,00' },
            { nome: 'Cecília de haro Bronner', idade: 8, rematricula: '25,00', jan: '60,00' },
            { nome: 'Geovana lima de sousa', idade: 4 },
            { nome: 'Isabella Lohayne de liz da Fonseca', idade: 4, rematricula: 'OK', jan: '60,00' },
            { nome: 'Isadora Nefertari Magnaguagno Sforza', idade: 7, jan: '60,00' },
            { nome: 'Julia Marques de Souza', idade: 7, rematricula: '25,00' },
            { nome: 'Liz Seniuk de Andrade', idade: 4, rematricula: '25,00', jan: '60,00' },
            { nome: 'Rocio Almaguer Cêspedes', idade: 5, rematricula: '25,00', jan: '60,00' },
            { nome: 'Sophia Garcia dos Santos', idade: 6, rematricula: '25,00', jan: '60,00' },
            { nome: 'Vitória Kadena Carvalho Cachilé', idade: 4, rematricula: '25,00', jan: '60,00' },
            { nome: 'Valentina Leite Chaves', idade: 4 }, // Age 2022 -> 4 in 2026
        ]
    }
];

async function importData() {
    console.log('🚀 Iniciando Migração de Dados (Fase 3 - Outras Modalidades)...');

    for (const group of groupsToImport) {
        console.log(`\n📦 Processando Atividade: ${group.atividade}`);

        // Get or Create Activity
        const { data: atividade } = await supabase
            .from('atividades')
            .select('id')
            .eq('nome', group.atividade)
            .maybeSingle();

        let atividadeId = atividade?.id;
        if (!atividadeId) {
            const { data: newAtiv } = await supabase
                .from('atividades')
                .insert({ nome: group.atividade, ativa: true, valor_mensal: group.mensalidade, capacidade_maxima: 50 })
                .select().single();
            if (newAtiv) atividadeId = newAtiv.id;
        }

        if (!atividadeId) {
            console.error(`Falha ao criar/encontrar atividade: ${group.atividade}`);
            continue;
        }

        console.log(`🏠 Processando Turma: ${group.turma}`);

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
                    dias_semana: ['Terça', 'Quinta'], // Default
                    capacidade_maxima: 20,
                    ativa: true
                })
                .select().single();
            if (newTurma) turmaId = newTurma.id;
        }

        if (!turmaId) {
            console.error(`Falha ao criar/encontrar turma: ${group.turma}`);
            continue;
        }


        for (const s of group.students) {
            process.stdout.write(`  👤 Aluno: ${s.nome.padEnd(40)}`);

            // Check then Create Aluno (case-insensitive search would be better, but exact string for now)
            // Trying a case-insensitive match just in case
            const { data: searchAluno } = await supabase
                .from('alunos')
                .select('id, nome_completo')
                .ilike('nome_completo', `%${s.nome.split(' ')[0]}%${s.nome.split(' ')[s.nome.split(' ').length - 1]}%`)
                .maybeSingle();

            let aluno;

            // If we found a close match (e.g., 'João Pires' vs 'João Francisco Pires') we could use it, 
            // but for safety, we'll try exact match first.
            let { data: exactAluno } = await supabase
                .from('alunos')
                .select('id')
                .eq('nome_completo', s.nome)
                .maybeSingle();

            aluno = exactAluno;

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
            // Parse monetary values handles strings like '100,00' or 'R$ 60,00'
            const parseMoney = (valStr: string) => {
                return parseFloat(valStr.replace('R$', '').replace(' ', '').replace(',', '.'));
            };

            if (s.jan) payEntries.push({ mes: 'Janeiro', val: parseMoney(s.jan), date: '2026-01-10' });
            if (s.fev) payEntries.push({ mes: 'Fevereiro', val: parseMoney(s.fev), date: '2026-02-10' });
            if (s.mar) payEntries.push({ mes: 'Março', val: parseMoney(s.mar), date: '2026-03-10' });

            for (const p of payEntries) {
                if (isNaN(p.val)) continue;

                const { data: existingPay } = await supabase
                    .from('pagamentos')
                    .select('id')
                    .eq('matricula_id', matricula!.id)
                    .eq('data_vencimento', p.date)
                    .maybeSingle();

                if (!existingPay) {
                    const { error: errP } = await supabase.from('pagamentos').insert({
                        matricula_id: matricula!.id,
                        valor: p.val,
                        data_vencimento: p.date,
                        data_pagamento: p.date,
                        status: 'pago',
                        forma_pagamento: 'pix' // Assumindo Pix como default para importação
                    });
                    if (errP) process.stdout.write(` ⚠️ Erro Pgto ${p.mes}`);
                }
            }
            console.log(' ✅ OK');
        }
    }

    console.log('\n✨ Migração Completa! Todas as modalidades foram sincronizadas.');
}

importData().catch(console.error);
