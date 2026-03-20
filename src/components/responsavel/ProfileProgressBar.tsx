import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ChevronRight, UserCog, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";

export const ProfileProgressBar = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ cpf: "", telefone: "" });
  const [cpfError, setCpfError] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("nome_completo, email, cpf, telefone")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const mutation = useMutation({
    mutationFn: async (data: { cpf: string; telefone: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      
      const { error } = await supabase
        .from("profiles")
        .update({
          cpf: data.cpf,
          telefone: data.telefone,
        })
        .eq("id", user.id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile-progress", user?.id] });
      setIsModalOpen(false);
      toast.success("Perfil atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });

  if (isLoading || !profile) return null;

  // Calculate progress
  const fields = [
    { key: 'nome_completo', label: 'Nome', value: profile.nome_completo },
    { key: 'email', label: 'E-mail', value: profile.email },
    { key: 'cpf', label: 'CPF', value: profile.cpf },
    { key: 'telefone', label: 'Telefone', value: profile.telefone },
  ];

  const filledFields = fields.filter(f => !!f.value && f.value.trim() !== "");
  const missingFields = fields.filter(f => !f.value || f.value.trim() === "");
  
  const progressPercentage = Math.round((filledFields.length / fields.length) * 100);
  const isComplete = progressPercentage === 100;

  // If 100% complete, don't show the annoying banner, save screen estate!
  if (isComplete) return null;

  const handleOpenModal = () => {
    setFormData({
      cpf: profile.cpf ? formatCPF(profile.cpf) : "",
      telefone: profile.telefone || "",
    });
    setCpfError("");
    setIsModalOpen(true);
  };

  const handleCpfChange = (val: string) => {
    const formatted = formatCPF(val);
    setFormData({ ...formData, cpf: formatted });
    setCpfError("");
    
    const clean = unmaskCPF(formatted);
    if (clean.length === 11 && !validateCPF(clean)) {
      setCpfError("CPF inválido");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cpfError) return;
    
    mutation.mutate({
      cpf: unmaskCPF(formData.cpf), // Salvar apenas os números no banco
      telefone: formData.telefone,
    });
  };

  return (
    <>
      {/* Banner */}
      <Card className="border-warning/30 bg-warning/5 animate-in fade-in slide-in-from-top-4 duration-500 shadow-sm mb-6">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          
          <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <UserCog className="h-6 w-6 text-warning" />
          </div>
          
          <div className="flex-1 w-full space-y-2">
            <div className="flex justify-between items-end mb-1">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  Seu perfil está {progressPercentage}% completo
                  <AlertCircle className="h-4 w-4 text-warning" />
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Faltam {missingFields.length} informações pendentes: {missingFields.map(f => f.label).join(", ")}
                </p>
              </div>
              <span className="text-sm font-bold text-warning">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5 bg-warning/20" indicatorClassName="bg-warning" />
          </div>

          <Button 
            className="w-full sm:w-auto shrink-0 shadow-md bg-warning hover:bg-warning/90 text-warning-foreground font-bold"
            onClick={handleOpenModal}
          >
            Completar Agora
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>

        </CardContent>
      </Card>

      {/* Quick Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Completar Perfil
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo. Essas informações são essenciais para matrículas e cobranças.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cpf-progress">CPF</Label>
              <Input
                id="cpf-progress"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => handleCpfChange(e.target.value)}
                maxLength={14}
              />
              {cpfError && <p className="text-xs text-destructive">{cpfError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tel-progress">Telefone Celular</Label>
              <Input
                id="tel-progress"
                placeholder="(41) 99999-9999"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Fazer depois
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar Dados
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
