
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUnidade } from "@/contexts/UnidadeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WizardSteps } from "@/components/ui/wizard-steps";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, User, AlertCircle, ArrowRight, ArrowLeft, Save, CheckCircle } from "lucide-react";
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";
import { compressImage } from "@/utils/compressImage";

const CadastrarAluno = () => {
  const { user } = useAuth();
  const { currentUnidade } = useUnidade();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    dataNascimento: "",
    cpf: "",
    telefone: "",
    endereco: "",
    alergias: "",
    medicamentos: "",
    observacoes: "",
  });

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cpfError, setCpfError] = useState<string | null>(null);

  // Photo Upload Handler
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setUploading(true);
      const originalFile = event.target.files[0];
      const file = await compressImage(originalFile);
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('student-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('student-photos')
        .getPublicUrl(filePath);

      setFotoUrl(data.publicUrl);
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanCpf = unmaskCPF(formData.cpf);

      // Validate CPF format if provided
      if (cleanCpf && cleanCpf.length > 0) {
        if (cleanCpf.length !== 11 || !validateCPF(cleanCpf)) {
          throw new Error("CPF inválido. Verifique os dígitos informados.");
        }

        // Check for duplicate CPF
        const { data: existing, error: checkError } = await supabase
          .from("alunos")
          .select("id, nome_completo")
          .eq("cpf", cleanCpf)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existing) {
          throw new Error(
            `Já existe um aluno cadastrado com este CPF: ${existing.nome_completo}. ` +
            `Se deseja matriculá-lo em outra atividade, vá em "Nova Matrícula".`
          );
        }
      }

      const { error } = await supabase.from("alunos").insert({
        responsavel_id: user?.id,
        nome_completo: formData.nomeCompleto,
        data_nascimento: formData.dataNascimento,
        cpf: cleanCpf || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        // New fields would go here if schema supported them directly, or in JSONB/Notes
        // For now we map health info to notes if no specific columns exist, 
        // OR assuming we only persist what connects to DB.
        // Let's allow saving core data first.
        foto_url: fotoUrl,
        ...(currentUnidade?.id ? { unidade_id: currentUnidade.id } : {}),
      });

      if (error) {
        if (error.message?.includes("idx_alunos_cpf_unique") || error.message?.includes("alunos_cpf_key")) {
          throw new Error("Já existe um aluno cadastrado com este CPF.");
        }
        throw error;
      }
    },
    onSuccess: async () => {
      // Trigger welcome email (fire and forget / robust handling)
      try {
        if (user?.email && formData.nomeCompleto) {
          const { error: emailError } = await supabase.functions.invoke("send-email", {
            body: {
              to: user.email,
              type: "welcome",
              data: {
                nomeResponsavel: user.user_metadata?.nome_completo || "Responsável",
                nomeAluno: formData.nomeCompleto,
              },
            },
          });
          if (emailError) console.error("Falha ao enviar email de boas-vindas:", emailError);
        }
      } catch (err) {
        console.error("Erro ao invocar função de email:", err);
      }

      toast({
        title: "Aluno cadastrado!",
        description: "Agora você pode solicitar matrículas para este aluno.",
      });
      queryClient.invalidateQueries({ queryKey: ["alunos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-alunos"] });
      navigate("/responsavel/nova-matricula");
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCpfChange = (value: string) => {
    // Apenas números para a máscara funcionar bem
    const onlyNumbers = value.replace(/\D/g, "");
    const formatted = formatCPF(onlyNumbers);

    setFormData({ ...formData, cpf: formatted });

    // Limpa erro ao digitar
    if (cpfError) setCpfError(null);

    // Valida apenas se tiver 11 dígitos
    const clean = unmaskCPF(formatted);
    if (clean.length === 11) {
      if (!validateCPF(clean)) {
        setCpfError("CPF inválido.");
      }
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.nomeCompleto.trim()) {
        toast({ title: "Campo obrigatório", description: "Preencha o Nome Completo.", variant: "destructive" });
        return false;
      }
      if (!formData.dataNascimento) {
        toast({ title: "Campo obrigatório", description: "Preencha a Data de Nascimento.", variant: "destructive" });
        return false;
      }
      if (cpfError) {
        toast({ title: "Erro no CPF", description: "Corrija o CPF antes de continuar.", variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      saveMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Cadastrar Novo Aluno</h1>
          <p className="text-muted-foreground mt-1">Preencha as informações do aluno para matrícula.</p>
        </div>

        <WizardSteps
          currentStep={currentStep}
          steps={[
            { id: 1, title: "Dados Pessoais", description: "Informações Básicas" },
            { id: 2, title: "Saúde & Contato", description: "Médico e Endereço" },
            { id: 3, title: "Foto & Fim", description: "Identificação" }
          ]}
        />

        <Card className="overflow-hidden border-t-4 border-t-neomissio-primary">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit}>

              {/* STEP 1: DADOS PESSOAIS */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeCompleto">Nome Completo <span className="text-destructive">*</span></Label>
                      <Input
                        id="nomeCompleto"
                        value={formData.nomeCompleto}
                        onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                        placeholder="Ex: João Silva"
                        className="h-11"
                        autoFocus
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dataNascimento">Data de Nascimento <span className="text-destructive">*</span></Label>
                        <Input
                          id="dataNascimento"
                          type="date"
                          value={formData.dataNascimento}
                          onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cpf">CPF do Aluno</Label>
                        <Input
                          id="cpf"
                          value={formData.cpf}
                          onChange={(e) => handleCpfChange(e.target.value)}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          className={`h-11 ${cpfError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        {cpfError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {cpfError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SAÚDE E CONTATO */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                        placeholder="(00) 00000-0000"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endereco">Endereço Completo</Label>
                      <Textarea
                        id="endereco"
                        value={formData.endereco}
                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                        placeholder="Rua, Número, Bairro, Cidade..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="alergias">Alergias (Opcional)</Label>
                        <Input
                          id="alergias"
                          value={formData.alergias}
                          onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                          placeholder="Ex: Amendoim, Dipirona..."
                          className="h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicamentos">Medicamentos (Opcional)</Label>
                        <Input
                          id="medicamentos"
                          value={formData.medicamentos}
                          onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                          placeholder="Uso contínuo..."
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: FOTO E REVISÃO */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-center">
                  <div className="flex flex-col items-center gap-6 py-4">
                    <div className="relative group cursor-pointer w-40 h-40">
                      <Avatar className="w-40 h-40 border-4 border-white shadow-xl">
                        <AvatarImage src={fotoUrl || ""} className="object-cover" />
                        <AvatarFallback className="bg-muted text-muted-foreground text-4xl">
                          {(formData.nomeCompleto?.[0] || "A").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="photo-upload"
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full cursor-pointer backdrop-blur-sm"
                      >
                        {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8 mb-2" />}
                        <span className="text-xs font-medium">Trocar Foto</span>
                      </label>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploading}
                      />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-foreground">{formData.nomeCompleto}</h3>
                      <p className="text-muted-foreground">{formData.dataNascimento ? `Nascido em ${new Date(formData.dataNascimento).toLocaleDateString('pt-BR')}` : ''}</p>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-left w-full max-w-sm space-y-2">
                      <p><strong>CPF:</strong> {formData.cpf || "Não informado"}</p>
                      <p><strong>Contato:</strong> {formData.telefone || "Não informado"}</p>
                      <p><strong>Saúde:</strong> {[formData.alergias, formData.medicamentos].filter(Boolean).join(", ") || "Nenhuma observação"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" onClick={() => navigate("/dashboard")}>
                    Cancelar
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button type="button" onClick={nextStep} className="gap-2 bg-primary hover:bg-primary/90">
                    Próximo <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={saveMutation.isPending || uploading} className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20 w-full sm:w-auto">
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Finalizar Cadastro
                  </Button>
                )}
              </div>

            </form>
          </CardContent>
        </Card>

        {/* SUCCESS DIALOG */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-6 w-6" /> Cadastro Realizado com Sucesso!
              </AlertDialogTitle>
              <AlertDialogDescription>
                O aluno <strong>{formData.nomeCompleto}</strong> foi cadastrado. O que deseja fazer agora?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={() => navigate("/dashboard")}>Voltar ao Início</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowSuccessDialog(false);
                setCurrentStep(1);
                setFormData({
                  nomeCompleto: "",
                  dataNascimento: "",
                  cpf: "",
                  telefone: "",
                  endereco: "",
                  alergias: "",
                  medicamentos: "",
                  observacoes: "",
                });
                setFotoUrl(null);
              }}>Cadastrar Outro Aluno</AlertDialogAction>
              <AlertDialogAction className="bg-neomissio-primary" onClick={() => navigate("/responsavel/nova-matricula")}>
                Matricular em Atividade <ArrowRight className="ml-2 h-4 w-4" />
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default CadastrarAluno;
