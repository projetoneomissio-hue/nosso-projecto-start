import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Users,
  UserPlus,
  Link,
  FileX,
  Loader2,
} from "lucide-react";
import {
  generateTemplate,
  parseFile,
  executeImport,
  downloadErrorReport,
  type ImportRow,
  type ValidationError,
  type ImportSummary,
} from "@/services/importService";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Step types
// ---------------------------------------------------------------------------
type Step = "upload" | "preview" | "importing" | "done";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ImportarAlunos() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [parseErrors, setParseErrors] = useState<ValidationError[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // ---------------------------------------------------------------------------
  // File handling
  // ---------------------------------------------------------------------------
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "csv") {
      toast({ title: "Formato inválido", description: "Use um arquivo .xlsx ou .csv.", variant: "destructive" });
      return;
    }

    setFileName(file.name);
    try {
      const { rows: parsed, errors } = await parseFile(file);
      setRows(parsed);
      setParseErrors(errors);
      setStep("preview");
    } catch (err: any) {
      toast({ title: "Erro ao ler arquivo", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ---------------------------------------------------------------------------
  // Import execution
  // ---------------------------------------------------------------------------
  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    // Simula progresso enquanto importa em lote
    const interval = setInterval(() => {
      setImportProgress((p) => Math.min(p + 3, 90));
    }, 200);

    try {
      const result = await executeImport(rows);
      clearInterval(interval);
      setImportProgress(100);
      setSummary(result);
      setStep("done");
    } catch (err: any) {
      clearInterval(interval);
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
      setStep("preview");
    }
  };

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------
  const hasErrors = parseErrors.length > 0;
  const validCount = rows.length;
  const errorCount = parseErrors.length;
  const previewRows = rows.slice(0, 10);

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderBadgePNE = (row: ImportRow) => {
    if (row.necessidade_especial?.toUpperCase() === "S") {
      return <Badge variant="outline" className="border-amber-400 text-amber-600 text-[10px]">PNE</Badge>;
    }
    return null;
  };

  // ---------------------------------------------------------------------------
  // Steps
  // ---------------------------------------------------------------------------

  // STEP 1: Upload
  if (step === "upload") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Importar Alunos</h1>
              <p className="text-muted-foreground text-sm">Fase A — Alunos + Responsáveis + Saúde</p>
            </div>
          </div>

          {/* Download template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Passo 1 — Baixe o template
              </CardTitle>
              <CardDescription>
                Preencha o arquivo com os dados dos alunos e depois faça o upload abaixo.
                Não altere os cabeçalhos da aba "alunos".
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="gap-2" onClick={generateTemplate}>
                <Download className="h-4 w-4" />
                Baixar template_importacao_alunos.xlsx
              </Button>
            </CardContent>
          </Card>

          {/* Drop zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                Passo 2 — Envie o arquivo preenchido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
                  ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-sm text-muted-foreground mt-1">Aceita .xlsx ou .csv</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={onFileInput}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // STEP 2: Preview + Validation
  if (step === "preview") {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setStep("upload")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Revisão da Importação</h1>
              <p className="text-muted-foreground text-sm">{fileName}</p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{validCount}</p>
                  <p className="text-sm text-muted-foreground">prontos para importar</p>
                </div>
              </CardContent>
            </Card>
            {errorCount > 0 && (
              <Card>
                <CardContent className="pt-5 flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-destructive shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{errorCount}</p>
                    <p className="text-sm text-muted-foreground">linhas com erro</p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <Users className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <p className="text-2xl font-bold">{validCount + errorCount}</p>
                  <p className="text-sm text-muted-foreground">linhas no arquivo</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Validation errors */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{errorCount} linha(s) com erro</strong> serão ignoradas na importação.
                Corrija o arquivo e reimporte para incluí-las.
                <ul className="mt-2 space-y-0.5 text-sm list-disc list-inside">
                  {parseErrors.slice(0, 5).map((e, i) => (
                    <li key={i}>Linha {e.row} — <span className="font-mono">{e.field}</span>: {e.message}</li>
                  ))}
                  {parseErrors.length > 5 && <li>...e mais {parseErrors.length - 5} erros.</li>}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview table */}
          {validCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Preview — {previewRows.length < validCount ? `primeiros ${previewRows.length} de ${validCount}` : `${validCount} aluno(s)`}
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Nasc.</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Email responsável</TableHead>
                      <TableHead>Saúde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{row.nome_completo}</TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">{row.data_nascimento}</TableCell>
                        <TableCell>{row.responsavel_nome}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{row.responsavel_email}</TableCell>
                        <TableCell>{renderBadgePNE(row)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("upload")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Escolher outro arquivo
            </Button>
            <Button
              disabled={validCount === 0}
              onClick={handleImport}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar {validCount} aluno(s)
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // STEP 3: Importing (progress)
  if (step === "importing") {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div>
            <h2 className="text-xl font-bold">Importando alunos...</h2>
            <p className="text-muted-foreground text-sm mt-1">Não feche esta página.</p>
          </div>
          <div className="w-full space-y-2">
            <Progress value={importProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{importProgress}%</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // STEP 4: Done
  if (step === "done" && summary) {
    const allOk = summary.erros.length === 0;
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center py-4">
            {allOk
              ? <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
              : <AlertTriangle className="h-14 w-14 text-amber-500 mx-auto mb-3" />
            }
            <h1 className="text-2xl font-bold">
              {allOk ? "Importação concluída!" : "Importação concluída com avisos"}
            </h1>
          </div>

          {/* Result cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-5 text-center">
                <Users className="h-6 w-6 mx-auto mb-1 text-green-500" />
                <p className="text-2xl font-bold">{summary.alunosCriados}</p>
                <p className="text-xs text-muted-foreground">alunos criados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <UserPlus className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                <p className="text-2xl font-bold">{summary.responsaveisNovos}</p>
                <p className="text-xs text-muted-foreground">convites enviados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <Link className="h-6 w-6 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold">{summary.responsaveisVinculados}</p>
                <p className="text-xs text-muted-foreground">responsáveis vinculados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5 text-center">
                <FileX className="h-6 w-6 mx-auto mb-1 text-destructive" />
                <p className="text-2xl font-bold">{summary.erros.length}</p>
                <p className="text-xs text-muted-foreground">não importados</p>
              </CardContent>
            </Card>
          </div>

          {/* Errors detail */}
          {summary.erros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Registros não importados
                </CardTitle>
                <CardDescription>
                  Corrija os erros abaixo e reimporte apenas esses registros.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Linha</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.erros.map((e, i) => (
                      <TableRow key={i}>
                        <TableCell className="tabular-nums text-muted-foreground">{e.row}</TableCell>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell className="text-destructive text-sm">{e.motivo}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 gap-2"
                  onClick={() => downloadErrorReport(summary.erros)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Baixar relatório de erros (.xlsx)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setStep("upload"); setRows([]); setParseErrors([]); setSummary(null); }}>
              Nova importação
            </Button>
            <Button onClick={() => navigate("/alunos")}>
              Ver alunos
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
