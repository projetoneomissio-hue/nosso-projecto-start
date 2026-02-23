
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function scanProfessors() {
    console.log("=== VARREDURA DE ATRIBUIÇÕES DE PROFESSORES ===\n");

    // 1. Fetch all professors with their profiles
    const { data: professors, error: profError } = await supabase
        .from('professores')
        .select(`
            *,
            profiles:user_id (nome_completo, email)
        `);

    if (profError) {
        console.error("Erro ao buscar professores:", profError);
        return;
    }

    // 2. Fetch all turmas with their activities
    const { data: turmas, error: turmasError } = await supabase
        .from('turmas')
        .select(`
            *,
            atividades:atividade_id (nome)
        `);

    if (turmasError) {
        console.error("Erro ao buscar turmas:", turmasError);
        return;
    }

    // 3. Find users with 'professor' role in user_roles
    const { data: profRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
            user_id,
            profiles:user_id (nome_completo, email)
        `)
        .eq('role', 'professor');

    if (rolesError) {
        console.error("Erro ao buscar papéis de professor:", rolesError);
        return;
    }

    const assignmentsByProf = {};

    professors!.forEach(p => {
        assignmentsByProf[p.id] = {
            nome: p.profiles?.nome_completo || "Sem Nome",
            especialidade: p.especialidade,
            tipo: p.tipo_contrato,
            email: p.profiles?.email,
            turmas: []
        };
    });

    turmas!.forEach(t => {
        if (t.professor_id && assignmentsByProf[t.professor_id]) {
            assignmentsByProf[t.professor_id].turmas.push({
                nome: t.nome,
                atividade: t.atividades?.nome || "N/A",
                horario: t.horario
            });
        }
    });

    const potentialProfs = profRoles!.filter(r => !professors!.some(p => p.user_id === r.user_id));

    console.log(`Total de registros na tabela 'professores': ${professors!.length}`);
    console.log(`Usuários com cargo 'professor' pendentes de vínculo: ${potentialProfs.length}`);
    console.log("------------------------------------------");

    if (professors!.length > 0) {
        Object.values(assignmentsByProf).forEach((p: any) => {
            console.log(`PROFESSOR: ${p.nome} (${p.email})`);
            console.log(`ESPECIALIDADE: ${p.especialidade || "Não informada"}`);
            console.log(`CONTRATO: ${p.tipo}`);
            if (p.turmas.length > 0) {
                console.log(`ATRIBUIÇÕES (${p.turmas.length}):`);
                p.turmas.forEach(t => {
                    console.log(`  - [${t.atividade}] ${t.nome} (${t.horario || "Sem horário"})`);
                });
            } else {
                console.log("⚠️ SEM ATRIBUIÇÕES NO MOMENTO");
            }
            console.log("------------------------------------------");
        });
    }

    if (potentialProfs.length > 0) {
        console.log("\n⚠️ USUÁRIOS COM CARGO 'PROFESSOR' SEM REGISTRO EM 'PROFESSORES':");
        potentialProfs.forEach(r => {
            const profile = r.profiles as any;
            console.log(`  - ${profile?.nome_completo || "Sem Nome"} (${profile?.email || "Sem e-mail"})`);
        });
    }

    // Finding turmas without professors
    const orphanTurmas = turmas!.filter(t => !t.professor_id);
    if (orphanTurmas.length > 0) {
        console.log(`\n🚨 TURMAS SEM PROFESSOR ATRIBUÍDO (${orphanTurmas.length}):`);
        orphanTurmas.forEach(t => {
            console.log(`  - [${t.atividades?.nome || "N/A"}] ${t.nome}`);
        });
    } else {
        console.log("\n✅ Todas as turmas possuem professores atribuídos.");
    }
}

scanProfessors();
