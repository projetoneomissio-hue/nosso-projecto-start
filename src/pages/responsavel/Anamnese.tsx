import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Aluno {
  id: string;
  nome_completo: string;
}

interface AnamneseData {
  tipo_sanguineo: string;
  alergias: string;
  medicamentos: string;
  condicoes_medicas: string;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;
  contato_emergencia_relacao: string;
  observacoes: string;
}

const Anamnese = () => {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunoId, setSelectedAlunoId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anamneseId, setAnamneseId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AnamneseData>({
    tipo_sanguineo: "",
    alergias: "",
    medicamentos: "",
    condicoes_medicas: "",
    contato_emergencia_nome: "",
    contato_emergencia_telefone: "",
    contato_emergencia_relacao: "",
    observacoes: "",
  });

  useEffect(() => {
    if (user) {
      loadAlunos();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAlunoId) {
      loadAnamnese();
    }
  }, [selectedAlunoId]);

  const loadAlunos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alunos")
        .select("id, nome_completo")
        .eq("responsavel_id", user?.id)
        .order("nome_completo");

      if (error) throw error;
      setAlunos(data || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os alunos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnamnese = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("anamneses")
        .select("*")
        .eq("aluno_id", selectedAlunoId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAnamneseId(data.id);
        setFormData({
          tipo_sanguineo: data.tipo_sanguineo || "",
          alergias: data.alergias || "",
          medicamentos: data.medicamentos || "",
          condicoes_medicas: data.condicoes_medicas || "",
          contato_emergencia_nome: data.contato_emergencia_nome || "",
          contato_emergencia_telefone: data.contato_emergencia_telefone || "",
          contato_emergencia_relacao: data.contato_emergencia_relacao || "",
          observacoes: data.observacoes || "",
        });
      } else {
        // Resetar formulário se não houver anamnese
        setAnamneseId(null);
        setFormData({
          tipo_sanguineo: "",
          alergias: "",
          medicamentos: "",
          condicoes_medicas: "",
          contato_emergencia_nome: "",
          contato_emergencia_telefone: "",
          contato_emergencia_relacao: "",
          observacoes: "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar anamnese:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a anamnese",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAlunoId) {
      toast({
        title: "Atenção",
        description: "Selecione um aluno",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const anamneseData = {
        aluno_id: selectedAlunoId,
        ...formData,
      };

      if (anamneseId) {
        // Atualizar anamnese existente
        const { error } = await supabase
          .from("anamneses")
          .update(anamneseData)
          .eq("id", anamneseId);

        if (error) throw error;
      } else {
        // Criar nova anamnese
        const { data, error } = await supabase
          .from("anamneses")
          .insert(anamneseData)
          .select()
          .single();

        if (error) throw error;
        setAnamneseId(data.id);
      }

      toast({
        title: "Sucesso",
        description: "Anamnese salva com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar anamnese:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a anamnese",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = (field: keyof AnamneseData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anamnese Esportiva</h1>
          <p className="text-muted-foreground mt-1">
            Preencha as informações de saúde do aluno
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Selecione o Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedAlunoId} onValueChange={setSelectedAlunoId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos.map((aluno) => (
                  <SelectItem key={aluno.id} value={aluno.id}>
                    {aluno.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedAlunoId && (
          <Card>
            <CardHeader>
              <CardTitle>Informações de Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_sanguineo">Tipo Sanguíneo</Label>
                    <Select
                      value={formData.tipo_sanguineo}
                      onValueChange={(value) => updateFormData("tipo_sanguineo", value)}
                    >
                      <SelectTrigger id="tipo_sanguineo">
                        <SelectValue placeholder="Selecione o tipo sanguíneo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alergias">Alergias</Label>
                    <Textarea
                      id="alergias"
                      placeholder="Descreva alergias alimentares, medicamentosas, etc."
                      value={formData.alergias}
                      onChange={(e) => updateFormData("alergias", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medicamentos">Medicamentos de Uso Contínuo</Label>
                    <Textarea
                      id="medicamentos"
                      placeholder="Liste medicamentos, dosagens e horários"
                      value={formData.medicamentos}
                      onChange={(e) => updateFormData("medicamentos", e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="condicoes_medicas">Condições Médicas</Label>
                    <Textarea
                      id="condicoes_medicas"
                      placeholder="Informe problemas cardíacos, respiratórios, ósseos, cirurgias recentes, limitações físicas, etc."
                      value={formData.condicoes_medicas}
                      onChange={(e) => updateFormData("condicoes_medicas", e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold">Contato de Emergência</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contato_nome">Nome Completo</Label>
                      <Input
                        id="contato_nome"
                        placeholder="Nome do contato de emergência"
                        value={formData.contato_emergencia_nome}
                        onChange={(e) => updateFormData("contato_emergencia_nome", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_telefone">Telefone</Label>
                      <Input
                        id="contato_telefone"
                        placeholder="(00) 00000-0000"
                        value={formData.contato_emergencia_telefone}
                        onChange={(e) => updateFormData("contato_emergencia_telefone", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contato_relacao">Relação com o Aluno</Label>
                      <Input
                        id="contato_relacao"
                        placeholder="Ex: Mãe, Pai, Avó, Tio, etc."
                        value={formData.contato_emergencia_relacao}
                        onChange={(e) => updateFormData("contato_emergencia_relacao", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações Adicionais</Label>
                    <Textarea
                      id="observacoes"
                      placeholder="Outras informações relevantes sobre a saúde do aluno"
                      value={formData.observacoes}
                      onChange={(e) => updateFormData("observacoes", e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button onClick={handleSave} className="w-full" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Anamnese"
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Anamnese;
