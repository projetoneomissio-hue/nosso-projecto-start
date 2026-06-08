import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { unmaskCPF, validateCPF } from "@/utils/cpf";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ImportRow {
  // Identificação
  nome_completo: string;
  data_nascimento: string;
  cpf?: string;
  rg?: string;
  sexo?: string;
  // Endereço / Escola
  bairro?: string;
  endereco?: string;
  escola?: string;
  serie_ano?: string;
  // Responsável
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone?: string;
  grau_parentesco?: string;
  // Saúde
  tipo_sanguineo?: string;
  alergias?: string;
  medicamentos?: string;
  doenca_cronica?: string;
  necessidade_especial?: string; // "S" | "N"
  necessidade_descricao?: string;
  necessidade_cid?: string;
  necessidade_laudo?: string; // "S" | "N"
  // Extras livres
  [key: string]: string | undefined;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParsedImport {
  rows: ImportRow[];
  errors: ValidationError[];
}

export interface ImportSummary {
  total: number;
  alunosCriados: number;
  responsaveisNovos: number;   // convite enviado
  responsaveisVinculados: number; // já existia no sistema
  erros: { row: number; nome: string; motivo: string }[];
}

// ---------------------------------------------------------------------------
// Template generation
// ---------------------------------------------------------------------------

const TEMPLATE_HEADERS: { key: keyof ImportRow; label: string }[] = [
  { key: "nome_completo",          label: "nome_completo *" },
  { key: "data_nascimento",        label: "data_nascimento * (DD/MM/AAAA)" },
  { key: "cpf",                    label: "cpf (somente números)" },
  { key: "rg",                     label: "rg" },
  { key: "sexo",                   label: "sexo (M/F)" },
  { key: "bairro",                 label: "bairro" },
  { key: "endereco",               label: "endereco" },
  { key: "escola",                 label: "escola" },
  { key: "serie_ano",              label: "serie_ano (ex: 5º ano)" },
  { key: "responsavel_nome",       label: "responsavel_nome *" },
  { key: "responsavel_email",      label: "responsavel_email *" },
  { key: "responsavel_telefone",   label: "responsavel_telefone" },
  { key: "grau_parentesco",        label: "grau_parentesco (ex: Mãe, Pai)" },
  { key: "tipo_sanguineo",         label: "tipo_sanguineo (ex: A+)" },
  { key: "alergias",               label: "alergias (ex: Amendoim, Lactose)" },
  { key: "medicamentos",           label: "medicamentos em uso" },
  { key: "doenca_cronica",         label: "doenca_cronica (ex: Asma)" },
  { key: "necessidade_especial",   label: "necessidade_especial (S/N)" },
  { key: "necessidade_descricao",  label: "necessidade_descricao (preencher se S)" },
  { key: "necessidade_cid",        label: "necessidade_cid (ex: F90.0)" },
  { key: "necessidade_laudo",      label: "necessidade_laudo (S/N)" },
];

const EXAMPLE_ROW: Record<string, string> = {
  "nome_completo *": "Maria da Silva",
  "data_nascimento * (DD/MM/AAAA)": "15/03/2015",
  "cpf (somente números)": "12345678900",
  "rg": "9.999.999-9",
  "sexo (M/F)": "F",
  "bairro": "Centro",
  "endereco": "Rua das Flores, 10, Apto 2",
  "escola": "E.M. João Paulo II",
  "serie_ano (ex: 5º ano)": "5º ano",
  "responsavel_nome *": "João da Silva",
  "responsavel_email *": "joao@email.com",
  "responsavel_telefone": "(41) 99999-8888",
  "grau_parentesco (ex: Mãe, Pai)": "Pai",
  "tipo_sanguineo (ex: A+)": "A+",
  "alergias (ex: Amendoim, Lactose)": "Amendoim",
  "medicamentos em uso": "Ritalina 10mg",
  "doenca_cronica (ex: Asma)": "Asma",
  "necessidade_especial (S/N)": "S",
  "necessidade_descricao (preencher se S)": "TDAH — dificuldade de concentração. Sentar na frente.",
  "necessidade_cid (ex: F90.0)": "F90.0",
  "necessidade_laudo (S/N)": "S",
};

const INSTRUCTIONS = [
  ["INSTRUÇÕES DE PREENCHIMENTO"],
  [],
  ["Campos obrigatórios", "nome_completo, data_nascimento, responsavel_nome, responsavel_email"],
  [],
  ["CAMPO", "DESCRIÇÃO"],
  ["nome_completo", "Nome completo do aluno"],
  ["data_nascimento", "Formato DD/MM/AAAA — ex: 15/03/2015"],
  ["cpf", "Somente números, sem pontos ou traços — ex: 12345678900"],
  ["sexo", "M para masculino, F para feminino"],
  ["responsavel_email", "Email do responsável. Se já tiver conta no sistema, o aluno será vinculado automaticamente. Caso contrário, um convite será enviado."],
  ["necessidade_especial", "S para Sim, N para Não"],
  ["necessidade_descricao", "Preencha somente se necessidade_especial = S. Descreva diagnóstico e como a equipe deve agir."],
  ["necessidade_laudo", "S se o responsável possui laudo médico. O upload do arquivo é feito no perfil do aluno após a importação."],
  [],
  ["IMPORTANTE"],
  ["• Não altere os cabeçalhos da aba 'alunos'"],
  ["• Colunas extras ao final serão importadas como dados adicionais"],
  ["• CPFs duplicados serão ignorados (aluno já existe)"],
  ["• A primeira linha de dados é apenas um exemplo — apague-a antes de importar"],
];

export function generateTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Aba 1: alunos
  const headers = TEMPLATE_HEADERS.map((h) => h.label);
  const ws = XLSX.utils.aoa_to_sheet([headers, headers.map((h) => EXAMPLE_ROW[h] ?? "")]);

  // Largura automática das colunas
  ws["!cols"] = headers.map(() => ({ wch: 30 }));

  XLSX.utils.book_append_sheet(wb, ws, "alunos");

  // Aba 2: instrucoes
  const wsInstr = XLSX.utils.aoa_to_sheet(INSTRUCTIONS);
  wsInstr["!cols"] = [{ wch: 28 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsInstr, "instrucoes");

  XLSX.writeFile(wb, "template_importacao_alunos.xlsx");
}

// ---------------------------------------------------------------------------
// Parsing & Validation
// ---------------------------------------------------------------------------

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();

  // DD/MM/AAAA
  const ddmmyyyy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // YYYY-MM-DD (já no formato certo)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Excel serial number
  const serial = Number(s);
  if (!isNaN(serial) && serial > 1000) {
    const date = XLSX.SSF.parse_date_code(serial);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }

  return null;
}

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\s*\*.*$/, "")       // remove "* ..." do final
    .replace(/\s*\(.*?\)/g, "")    // remove "(...)"
    .trim()
    .replace(/\s+/g, "_");
}

export function parseFile(file: File): Promise<ParsedImport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: false });

        // Procura aba "alunos" ou usa a primeira
        const sheetName = wb.SheetNames.find((n) => n.toLowerCase() === "alunos") ?? wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const raw: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (raw.length === 0) {
          return resolve({ rows: [], errors: [{ row: 0, field: "arquivo", message: "Planilha vazia ou sem dados." }] });
        }

        // Normaliza cabeçalhos
        const normalized = raw.map((r) => {
          const out: Record<string, string> = {};
          for (const [k, v] of Object.entries(r)) {
            out[normalizeHeader(k)] = String(v).trim();
          }
          return out;
        });

        const errors: ValidationError[] = [];
        const rows: ImportRow[] = [];

        normalized.forEach((r, i) => {
          const rowNum = i + 2; // linha 1 = cabeçalho
          const rowErrors: ValidationError[] = [];

          // Obrigatórios
          if (!r.nome_completo) rowErrors.push({ row: rowNum, field: "nome_completo", message: "Campo obrigatório." });
          if (!r.data_nascimento) rowErrors.push({ row: rowNum, field: "data_nascimento", message: "Campo obrigatório." });
          if (!r.responsavel_nome) rowErrors.push({ row: rowNum, field: "responsavel_nome", message: "Campo obrigatório." });
          if (!r.responsavel_email) rowErrors.push({ row: rowNum, field: "responsavel_email", message: "Campo obrigatório." });

          // Validações de formato
          const dateStr = parseDate(r.data_nascimento);
          if (r.data_nascimento && !dateStr) {
            rowErrors.push({ row: rowNum, field: "data_nascimento", message: `Formato inválido: "${r.data_nascimento}". Use DD/MM/AAAA.` });
          }

          if (r.responsavel_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.responsavel_email)) {
            rowErrors.push({ row: rowNum, field: "responsavel_email", message: "Email inválido." });
          }

          const cpfRaw = r.cpf ? unmaskCPF(r.cpf) : "";
          if (cpfRaw && (cpfRaw.length !== 11 || !validateCPF(cpfRaw))) {
            rowErrors.push({ row: rowNum, field: "cpf", message: `CPF inválido: "${r.cpf}".` });
          }

          errors.push(...rowErrors);
          if (rowErrors.length === 0) {
            rows.push({
              ...r,
              data_nascimento: dateStr ?? r.data_nascimento,
              cpf: cpfRaw || undefined,
            } as ImportRow);
          }
        });

        resolve({ rows, errors });
      } catch (err) {
        reject(new Error("Não foi possível ler o arquivo. Verifique se é um .xlsx ou .csv válido."));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo."));
    reader.readAsArrayBuffer(file);
  });
}

// ---------------------------------------------------------------------------
// Import execution
// ---------------------------------------------------------------------------

async function upsertResponsavel(
  email: string,
  nome: string,
  telefone?: string
): Promise<{ id: string; isNew: boolean }> {
  // Verifica se já existe profile com esse email
  const { data: existing } = await (supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle() as any);

  if (existing) return { id: existing.id, isNew: false };

  // Envia convite pelo Supabase Auth (cria o usuário e dispara email)
  const { data: invited, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { nome_completo: nome, telefone: telefone ?? "" },
  });

  if (error || !invited?.user) {
    throw new Error(`Falha ao enviar convite para ${email}: ${error?.message}`);
  }

  return { id: invited.user.id, isNew: true };
}

export async function executeImport(rows: ImportRow[]): Promise<ImportSummary> {
  const summary: ImportSummary = {
    total: rows.length,
    alunosCriados: 0,
    responsaveisNovos: 0,
    responsaveisVinculados: 0,
    erros: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // 1. Verifica CPF duplicado
      if (row.cpf) {
        const { data: dupAluno } = await supabase
          .from("alunos")
          .select("id")
          .eq("cpf", row.cpf)
          .maybeSingle();
        if (dupAluno) {
          summary.erros.push({ row: i + 2, nome: row.nome_completo, motivo: `CPF ${row.cpf} já cadastrado.` });
          continue;
        }
      }

      // 2. Cria ou localiza responsável
      const { id: responsavelId, isNew } = await upsertResponsavel(
        row.responsavel_email,
        row.responsavel_nome,
        row.responsavel_telefone
      );

      if (isNew) summary.responsaveisNovos++;
      else summary.responsaveisVinculados++;

      // 3. Coleta dados extras (colunas não mapeadas)
      const knownKeys = new Set(TEMPLATE_HEADERS.map((h) => h.key));
      const dadosExtras: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        if (!knownKeys.has(k as keyof ImportRow) && v) dadosExtras[k] = v;
      }

      // 4. Insere aluno
      const { data: novoAluno, error: alunoError } = await supabase
        .from("alunos")
        .insert({
          responsavel_id: responsavelId,
          nome_completo: row.nome_completo,
          data_nascimento: row.data_nascimento,
          cpf: row.cpf || null,
          rg: row.rg || null,
          telefone: row.responsavel_telefone || null,
          endereco: row.endereco || null,
          bairro: row.bairro || null,
          escola: row.escola || null,
          serie_ano: row.serie_ano || null,
          grau_parentesco: row.grau_parentesco || null,
          alergias: row.alergias || null,
          medicamentos: row.medicamentos || null,
          observacoes: Object.keys(dadosExtras).length ? JSON.stringify(dadosExtras) : null,
        } as any)
        .select("id")
        .single();

      if (alunoError || !novoAluno) throw new Error(alunoError?.message ?? "Erro ao criar aluno.");

      // 5. Insere anamnese (se houver dados de saúde)
      const temSaude =
        row.tipo_sanguineo ||
        row.doenca_cronica ||
        row.necessidade_especial?.toUpperCase() === "S";

      if (temSaude) {
        await supabase.from("anamneses").insert({
          aluno_id: novoAluno.id,
          tipo_sanguineo: row.tipo_sanguineo || null,
          alergias: row.alergias || null,
          medicamentos: row.medicamentos || null,
          doenca_cronica: row.doenca_cronica || null,
          is_pne: row.necessidade_especial?.toUpperCase() === "S",
          pne_descricao: row.necessidade_descricao || null,
          pne_cid: row.necessidade_cid || null,
          pne_laudo: row.necessidade_laudo?.toUpperCase() === "S",
        } as any);
      }

      summary.alunosCriados++;
    } catch (err: any) {
      summary.erros.push({ row: i + 2, nome: row.nome_completo, motivo: err.message ?? "Erro desconhecido." });
    }
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Export error report
// ---------------------------------------------------------------------------

export function downloadErrorReport(erros: ImportSummary["erros"]): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(
    erros.map((e) => ({ Linha: e.row, Nome: e.nome, Motivo: e.motivo }))
  );
  ws["!cols"] = [{ wch: 8 }, { wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws, "erros");
  XLSX.writeFile(wb, "erros_importacao.xlsx");
}
