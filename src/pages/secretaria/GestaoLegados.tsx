import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ArrowRightLeft,
  Loader2,
  Ghost,
  UserCheck,
  AlertTriangle,
  Trash2,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface OrphanStudent {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  ghost_profile_id: string;
  ghost_email: string;
  ghost_name: string;
}

interface RealParent {
  id: string;
  nome_completo: string;
  email: string;
}

const GHOST_NAMES = ["Responsável Legado", "LEGADO - Pendente de Responsável"];

const GestaoLegados = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    aluno: OrphanStudent | null;
  }>({ open: false, aluno: null });
  const [parentSearch, setParentSearch] = useState("");
  const [dissolveModal, setDissolveModal] = useState<{
    open: boolean;
    profileId: string;
    profileEmail: string;
  }>({ open: false, profileId: "", profileEmail: "" });

  // Fetch ALL orphaned students (in ghost profiles) in one flat list
  const { data: orphanStudents, isLoading } = useQuery({
    queryKey: ["orphan-students"],
    queryFn: async () => {
      // Get ghost profile IDs
      const { data: ghosts, error: gErr } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .in("nome_completo", GHOST_NAMES);

      if (gErr) throw gErr;
      if (!ghosts || ghosts.length === 0) return { students: [], ghosts: [] };

      const ghostIds = ghosts.map((g) => g.id);

      // Get all students in ghost profiles
      const { data: alunos, error: aErr } = await supabase
        .from("alunos")
        .select("id, nome_completo, data_nascimento, responsavel_id")
        .in("responsavel_id", ghostIds)
        .order("nome_completo");

      if (aErr) throw aErr;

      const ghostMap = Object.fromEntries(ghosts.map((g) => [g.id, g]));

      const students: OrphanStudent[] = (alunos || []).map((a) => ({
        id: a.id,
        nome_completo: a.nome_completo,
        data_nascimento: a.data_nascimento,
        ghost_profile_id: a.responsavel_id!,
        ghost_email: ghostMap[a.responsavel_id!]?.email || "",
        ghost_name: ghostMap[a.responsavel_id!]?.nome_completo || "",
      }));

      return { students, ghosts };
    },
  });

  // Search real parents for transfer
  const { data: realParents } = useQuery({
    queryKey: ["real-parents", parentSearch],
    enabled: parentSearch.length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome_completo, email")
        .not("nome_completo", "in", '("Responsável Legado","LEGADO - Pendente de Responsável")')
        .or(`nome_completo.ilike.%${parentSearch}%,email.ilike.%${parentSearch}%`)
        .limit(10);

      if (error) throw error;
      return (data || []) as RealParent[];
    },
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async ({ alunoId, newParentId }: { alunoId: string; newParentId: string }) => {
      const { error } = await supabase
        .from("alunos")
        .update({ responsavel_id: newParentId })
        .eq("id", alunoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orphan-students"] });
      setTransferModal({ open: false, aluno: null });
      setParentSearch("");
      toast.success("Aluno transferido com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao transferir: " + error.message);
    },
  });

  // Dissolve mutation
  const dissolveMutation = useMutation({
    mutationFn: async (profileId: string) => {
      const { count } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("responsavel_id", profileId);

      if (count && count > 0) {
        throw new Error("Este perfil ainda possui alunos. Transfira todos antes de dissolver.");
      }

      await supabase.from("user_roles").delete().eq("user_id", profileId);
      const { error } = await supabase.from("profiles").delete().eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orphan-students"] });
      setDissolveModal({ open: false, profileId: "", profileEmail: "" });
      toast.success("Perfil fantasma removido!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter students by search
  const filtered = useMemo(() => {
    if (!orphanStudents?.students) return [];
    if (!searchTerm) return orphanStudents.students;
    const term = searchTerm.toLowerCase();
    return orphanStudents.students.filter(
      (s) =>
        s.nome_completo.toLowerCase().includes(term) ||
        s.ghost_email.toLowerCase().includes(term)
    );
  }, [orphanStudents?.students, searchTerm]);

  // Stats
  const totalStudents = orphanStudents?.students?.length || 0;
  const totalGhosts = orphanStudents?.ghosts?.length || 0;
  const emptyGhosts = orphanStudents?.ghosts?.filter((g) => {
    return !orphanStudents.students.some((s) => s.ghost_profile_id === g.id);
  }) || [];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Ghost className="h-8 w-8 text-purple-500" />
            Gestão de Perfis Legados
          </h1>
          <p className="text-muted-foreground mt-1">
            Busque pelo nome do aluno e transfira para o responsável correto
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Alunos Pendentes</p>
              <p className="text-3xl font-bold text-orange-500">{totalStudents}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Perfis Fantasma</p>
              <p className="text-3xl font-bold text-purple-500">{totalGhosts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Perfis Vazios</p>
              <p className="text-3xl font-bold text-green-500">{emptyGhosts.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Resultados</p>
              <p className="text-3xl font-bold text-foreground">{filtered.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty ghosts dissolve bar */}
        {emptyGhosts.length > 0 && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground mb-2">
                {emptyGhosts.length} perfil(s) fantasma sem alunos — prontos para dissolver:
              </p>
              <div className="flex flex-wrap gap-2">
                {emptyGhosts.map((g) => (
                  <Button
                    key={g.id}
                    variant="outline"
                    size="sm"
                    className="text-red-500 border-red-500/30 hover:bg-red-500/10"
                    onClick={() =>
                      setDissolveModal({
                        open: true,
                        profileId: g.id,
                        profileEmail: g.email || "Sem e-mail",
                      })
                    }
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {g.email || "Sem e-mail"}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do aluno ou e-mail do responsável fantasma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base"
            autoFocus
          />
        </div>

        {/* Student Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="hidden sm:table-cell">Nascimento</TableHead>
                    <TableHead>Perfil Fantasma</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 50).map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{student.nome_completo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {student.data_nascimento
                          ? new Date(student.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">
                          {student.ghost_email}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                          onClick={() =>
                            setTransferModal({ open: true, aluno: student })
                          }
                        >
                          <ArrowRightLeft className="h-4 w-4 mr-1" />
                          Transferir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filtered.length > 50 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Mostrando 50 de {filtered.length} resultados. Use a busca para refinar.
              </div>
            )}
          </Card>
        ) : searchTerm ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-foreground font-medium">Nenhum aluno encontrado para "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-1">Tente buscar por outro nome ou e-mail</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <UserCheck className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-semibold text-foreground">
                Todos os alunos já têm responsáveis reais! 🎉
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transfer Modal */}
      <Dialog
        open={transferModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setTransferModal({ open: false, aluno: null });
            setParentSearch("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-blue-500" />
              Transferir Aluno
            </DialogTitle>
            <DialogDescription>
              Escolha o responsável real para <strong>{transferModal.aluno?.nome_completo}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail do responsável..."
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {parentSearch.length >= 2 && (
              <div className="max-h-60 overflow-y-auto space-y-1 border rounded-md p-2">
                {realParents && realParents.length > 0 ? (
                  realParents.map((parent) => (
                    <button
                      key={parent.id}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-accent transition-colors"
                      onClick={() =>
                        transferMutation.mutate({
                          alunoId: transferModal.aluno!.id,
                          newParentId: parent.id,
                        })
                      }
                      disabled={transferMutation.isPending}
                    >
                      <p className="font-medium text-sm text-foreground">{parent.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">{parent.email}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum responsável encontrado
                  </p>
                )}
              </div>
            )}

            {parentSearch.length < 2 && (
              <p className="text-xs text-muted-foreground text-center">
                Digite pelo menos 2 caracteres para buscar
              </p>
            )}
          </div>

          {transferMutation.isPending && (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">Transferindo...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dissolve Modal */}
      <Dialog
        open={dissolveModal.open}
        onOpenChange={(open) => {
          if (!open) setDissolveModal({ open: false, profileId: "", profileEmail: "" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Dissolver Perfil Fantasma
            </DialogTitle>
            <DialogDescription>
              Remover <strong>{dissolveModal.profileEmail}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setDissolveModal({ open: false, profileId: "", profileEmail: "" })}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => dissolveMutation.mutate(dissolveModal.profileId)}
              disabled={dissolveMutation.isPending}
            >
              {dissolveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Dissolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GestaoLegados;
