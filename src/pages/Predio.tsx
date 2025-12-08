import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { FormCusto } from "@/components/predio/FormCusto";
import { FormFuncionario } from "@/components/predio/FormFuncionario";
import { FormLocacao } from "@/components/predio/FormLocacao";
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

type Custo = {
  id: string;
  item: string;
  valor: number;
  tipo: string;
  data_competencia: string;
};

type Funcionario = {
  id: string;
  nome: string;
  funcao: string;
  salario: number;
  ativo: boolean;
};

type Locacao = {
  id: string;
  evento: string;
  responsavel_nome: string;
  responsavel_telefone: string | null;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  valor: number;
  observacoes: string | null;
};

const Predio = () => {
  const queryClient = useQueryClient();

  // Modal states
  const [custoDialogOpen, setCustoDialogOpen] = useState(false);
  const [funcionarioDialogOpen, setFuncionarioDialogOpen] = useState(false);
  const [locacaoDialogOpen, setLocacaoDialogOpen] = useState(false);

  // Edit states
  const [editingCusto, setEditingCusto] = useState<Custo | null>(null);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [editingLocacao, setEditingLocacao] = useState<Locacao | null>(null);

  // Delete confirmation states
  const [deletingCusto, setDeletingCusto] = useState<string | null>(null);
  const [deletingFuncionario, setDeletingFuncionario] = useState<string | null>(null);
  const [deletingLocacao, setDeletingLocacao] = useState<string | null>(null);

  const { data: custos, isLoading: loadingCustos } = useQuery({
    queryKey: ["custos-predio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("custos_predio")
        .select("*")
        .order("data_competencia", { ascending: false });

      if (error) throw error;

      const total = (data || []).reduce((acc, c) => acc + Number(c.valor), 0);
      return { items: data || [], total };
    },
  });

  const { data: funcionarios, isLoading: loadingFunc } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data || [];
    },
  });

  const { data: locacoes, isLoading: loadingLoc } = useQuery({
    queryKey: ["locacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("locacoes")
        .select("*")
        .order("data", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Delete mutations
  const deleteCustoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custos_predio").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos-predio"] });
      toast.success("Custo excluído!");
      setDeletingCusto(null);
    },
    onError: () => {
      toast.error("Erro ao excluir custo");
    },
  });

  const deleteFuncionarioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário excluído!");
      setDeletingFuncionario(null);
    },
    onError: () => {
      toast.error("Erro ao excluir funcionário");
    },
  });

  const deleteLocacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("locacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locacoes"] });
      toast.success("Locação excluída!");
      setDeletingLocacao(null);
    },
    onError: () => {
      toast.error("Erro ao excluir locação");
    },
  });

  const getTipoLabel = (tipo: string) => {
    return tipo === "fixo" ? "Fixo" : "Variável";
  };

  const handleEditCusto = (custo: Custo) => {
    setEditingCusto(custo);
    setCustoDialogOpen(true);
  };

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setFuncionarioDialogOpen(true);
  };

  const handleEditLocacao = (locacao: Locacao) => {
    setEditingLocacao(locacao);
    setLocacaoDialogOpen(true);
  };

  const handleCustoDialogChange = (open: boolean) => {
    setCustoDialogOpen(open);
    if (!open) setEditingCusto(null);
  };

  const handleFuncionarioDialogChange = (open: boolean) => {
    setFuncionarioDialogOpen(open);
    if (!open) setEditingFuncionario(null);
  };

  const handleLocacaoDialogChange = (open: boolean) => {
    setLocacaoDialogOpen(open);
    if (!open) setEditingLocacao(null);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão do Prédio</h1>
          <p className="text-muted-foreground mt-1">
            Controle de custos, funcionários e locações
          </p>
        </div>

        <Tabs defaultValue="custos" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="custos">Custos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="locacoes">Locações</TabsTrigger>
          </TabsList>

          <TabsContent value="custos" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Custos do Prédio</h2>
              <Button className="gap-2" onClick={() => setCustoDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Custo
              </Button>
            </div>

            {loadingCustos ? (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : !custos?.items.length ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhum custo cadastrado</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-4">
                  {custos?.items.map((custo) => (
                    <Card key={custo.id}>
                      <CardContent className="p-4 flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{custo.item}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(custo.data_competencia), "MMMM yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              R$ {Number(custo.valor).toFixed(2).replace(".", ",")}
                            </p>
                            <Badge variant="secondary">{getTipoLabel(custo.tipo)}</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCusto(custo)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingCusto(custo.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Total</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">
                      R$ {custos?.total.toFixed(2).replace(".", ",")}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="funcionarios" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Funcionários do Prédio</h2>
              <Button className="gap-2" onClick={() => setFuncionarioDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Adicionar Funcionário
              </Button>
            </div>

            {loadingFunc ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-16 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !funcionarios || funcionarios.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">
                    Nenhum funcionário cadastrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {funcionarios.map((func) => (
                  <Card key={func.id}>
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{func.nome}</h3>
                        <p className="text-sm text-muted-foreground">{func.funcao}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            R$ {Number(func.salario).toFixed(2).replace(".", ",")}
                          </p>
                          <Badge variant={func.ativo ? "default" : "secondary"}>
                            {func.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditFuncionario(func)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingFuncionario(func.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="locacoes" className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Locações Agendadas</h2>
              <Button className="gap-2" onClick={() => setLocacaoDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Nova Locação
              </Button>
            </div>

            {loadingLoc ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !locacoes || locacoes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground">Nenhuma locação agendada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {locacoes.map((loc) => (
                  <Card key={loc.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{loc.evento}</h3>
                          <p className="text-sm text-muted-foreground">
                            {loc.responsavel_nome}
                            {loc.responsavel_telefone && ` - ${loc.responsavel_telefone}`}
                          </p>
                          <div className="text-sm text-muted-foreground mt-2">
                            <p>
                              Data: {format(new Date(loc.data), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p>
                              Horário: {loc.horario_inicio} - {loc.horario_fim}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4">
                          <p className="text-lg font-bold">
                            R$ {Number(loc.valor).toFixed(2).replace(".", ",")}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditLocacao(loc)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingLocacao(loc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Formulários */}
      <FormCusto
        open={custoDialogOpen}
        onOpenChange={handleCustoDialogChange}
        custo={editingCusto}
      />
      <FormFuncionario
        open={funcionarioDialogOpen}
        onOpenChange={handleFuncionarioDialogChange}
        funcionario={editingFuncionario}
      />
      <FormLocacao
        open={locacaoDialogOpen}
        onOpenChange={handleLocacaoDialogChange}
        locacao={editingLocacao}
      />

      {/* Diálogos de confirmação de exclusão */}
      <AlertDialog open={!!deletingCusto} onOpenChange={() => setDeletingCusto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCusto && deleteCustoMutation.mutate(deletingCusto)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingFuncionario}
        onOpenChange={() => setDeletingFuncionario(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir funcionário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingFuncionario && deleteFuncionarioMutation.mutate(deletingFuncionario)
              }
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingLocacao} onOpenChange={() => setDeletingLocacao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir locação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingLocacao && deleteLocacaoMutation.mutate(deletingLocacao)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Predio;
