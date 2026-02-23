
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ssnmuiskarajydbtwgto.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbm11aXNrYXJhanlkYnR3Z3RvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc0NCwiZXhwIjoyMDg2NjkzNzQ0fQ.QOjbolKMlGQxVJdnV-d_3j6dty53oGZcxw9ZcIysUFY';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setup() {
    const userId = 'd48f749a-f6d4-44d3-b68a-681fa8a615a3'; // neomissiocuritiba@gmail.com
    console.log('Setup for User:', userId);

    // 1. Ensure Professor record exists
    let { data: prof } = await supabase.from('professores').select('id').eq('user_id', userId).maybeSingle();

    if (!prof) {
        console.log('Creating professor record...');
        const { data: newProf, error: profError } = await supabase
            .from('professores')
            .insert([{ user_id: userId, nome: 'Neo Missio Curitiba', ativo: true }])
            .select()
            .single();

        if (profError) {
            console.error('Error creating professor:', profError);
            return;
        }
        prof = newProf;
    }

    const profId = prof.id;
    console.log('Professor ID:', profId);

    // 2. Find an active class to link
    const { data: turmas } = await supabase.from('turmas').select('id, nome').limit(1);
    if (!turmas || turmas.length === 0) {
        console.error('No turmas found in DB to link.');
        return;
    }

    const turmaId = turmas[0].id;
    console.log('Linking to Turma:', turmas[0].nome, '(', turmaId, ')');

    // 3. Link professor to turma
    const { error: updateError } = await supabase
        .from('turmas')
        .update({ professor_id: profId })
        .eq('id', turmaId);

    if (updateError) {
        console.error('Error linking professor to turma:', updateError);
        return;
    }

    // 4. Check for students (matriculas)
    const { count } = await supabase
        .from('matriculas')
        .select('*', { count: 'exact', head: true })
        .eq('turma_id', turmaId);

    console.log('Current students in turma:', count);

    if (count === 0) {
        console.log('No students found. Checking for any students to link...');
        const { data: students } = await supabase.from('alunos').select('id').limit(5);
        if (students && students.length > 0) {
            console.log('Linking', students.length, 'students to this turma...');
            const inserts = students.map(s => ({
                turma_id: turmaId,
                aluno_id: s.id,
                status: 'ativa',
                data_matricula: new Date().toISOString()
            }));
            await supabase.from('matriculas').insert(inserts);
        }
    }

    console.log('Setup successfully completed!');
}

setup();
