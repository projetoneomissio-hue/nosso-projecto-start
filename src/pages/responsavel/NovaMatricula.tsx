import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const matriculaSchema = z.object({
  nomeAluno: z.string().trim().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }).max(100, { message: "Nome muito longo" }),
  dataNascimento: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 0 && age <= 100;
  }, { message: "Data de nascimento inválida" }),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, { message: "CPF inválido" }).optional().or(z.literal("")),
  atividade: z.string().min(1, { message: "Selecione uma atividade" }),
  turma: z.string().min(1, { message: "Selecione uma turma" }),
});


const NovaMatricula = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nomeAluno: "",
    dataNascimento: "",
    cpf: "",
    atividade: "",
    turma: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = matriculaSchema.safeParse(formData);
    
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Matrícula solicitada!",
      description: "Aguarde a aprovação da coordenação",
    });
    
    setFormData({
      nomeAluno: "",
      dataNascimento: "",
      cpf: "",
      atividade: "",
      turma: "",
    });
  };
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Matrícula</h1>
          <p className="text-muted-foreground mt-1">
            Inscreva seu filho em uma atividade
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados da Matrícula</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="aluno">Nome do Aluno</Label>
                <Input 
                  id="aluno" 
                  placeholder="Nome completo"
                  value={formData.nomeAluno}
                  onChange={(e) => setFormData({ ...formData, nomeAluno: e.target.value })}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nascimento">Data de Nascimento</Label>
                  <Input 
                    id="nascimento" 
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input 
                    id="cpf" 
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="atividade">Atividade</Label>
                <Select value={formData.atividade} onValueChange={(value) => setFormData({ ...formData, atividade: value })}>
                  <SelectTrigger id="atividade">
                    <SelectValue placeholder="Selecione uma atividade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jiujitsu">Jiu-Jitsu</SelectItem>
                    <SelectItem value="bale">Balé</SelectItem>
                    <SelectItem value="musica">Música</SelectItem>
                    <SelectItem value="desenho">Desenho</SelectItem>
                    <SelectItem value="reforco">Reforço Escolar</SelectItem>
                    <SelectItem value="pilates">Pilates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="turma">Turma/Horário</Label>
                <Select value={formData.turma} onValueChange={(value) => setFormData({ ...formData, turma: value })}>
                  <SelectTrigger id="turma">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seg-qua-14">Segunda e Quarta 14h-15h</SelectItem>
                    <SelectItem value="ter-qui-15">Terça e Quinta 15h-16h</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full">Solicitar Matrícula</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default NovaMatricula;
