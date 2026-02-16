import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAlunos, useAlunoMutations } from "@/hooks/useAlunos";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    UserPlus,
    Search,
    Filter,
    Trash2,
    Edit2,
    MoreHorizontal,
    GraduationCap
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatCPF, unmaskCPF, validateCPF } from "@/utils/cpf";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const Alunos = () => {
    const { saveMutation, deleteMutation } = useAlunoMutations();

    // State for filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");

    // State for Add/Edit
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAluno, setEditingAluno] = useState<any>(null);
    const [formData, setFormData] = useState({
        nome: "",
        data_nascimento: "",
        cpf: "",
        telefone: "",
        endereco: "",
        alergias: "",
        medicamentos: "",
        observacoes: "",
    });
    const [cpfError, setCpfError] = useState<string | null>(null);

    const { data: alunos, isLoading } = useAlunos();

    const getAlunoStatus = (matriculas: any[]) => {
        if (!matriculas || matriculas.length === 0) return "Sem matrícula";
        if (matriculas.some(m => m.status === 'ativa')) return "Ativo";
        if (matriculas.some(m => m.status === 'pendente')) return "Pendente";
        return "Inativo";
    };

    // Filter Logic
    const filteredAlunos = alunos?.filter((aluno) => {
        const matchesSearch =
            aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (aluno.cpf && aluno.cpf.includes(searchTerm));

        const status = getAlunoStatus(aluno.matriculas);
        const matchesStatus = statusFilter === "todos" ||
            (statusFilter === "ativo" && status === "Ativo") ||
            (statusFilter === "pendente" && status === "Pendente") ||
            (statusFilter === "inativo" && status === "Inativo") ||
            (statusFilter === "sem_matricula" && status === "Sem matrícula");

        return matchesSearch && matchesStatus;
    });

    const handleCpfChange = (value: string) => {
        const formatted = formatCPF(value);
        setFormData({ ...formData, cpf: formatted });
        setCpfError(null);

        const clean = unmaskCPF(formatted);
        if (clean.length === 11 && !validateCPF(clean)) {
            setCpfError("CPF inválido");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cpfError) return;
        saveMutation.mutate(
            { id: editingAluno?.id, data: formData },
            {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingAluno(null);
                    setFormData({ nome: "", data_nascimento: "", cpf: "", telefone: "", endereco: "" });
                },
            }
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6 lg:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
                        <p className="text-muted-foreground mt-1">
                            Gerencie os alunos, matrículas e históricos.
                        </p>
                    </div>
                    <Button onClick={() => window.location.href = '/responsavel/cadastrar-aluno'} className="bg-neomissio-primary hover:bg-neomissio-primary/90">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Novo Aluno
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Listagem de Alunos</CardTitle>
                        <CardDescription>
                            Total de {filteredAlunos?.length || 0} alunos encontrados.
                        </CardDescription>

                        {/* SEARCH & FILTERS BAR */}
                        <div className="flex flex-col md:flex-row gap-4 pt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome ou CPF..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-[200px]">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos os Status</SelectItem>
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="sem_matricula">Sem Matrícula</SelectItem>
                                        <SelectItem value="inativo">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8 text-muted-foreground">Carregando alunos...</div>
                        ) : filteredAlunos?.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-20" />
                                <p className="text-muted-foreground font-medium">Nenhum aluno encontrado.</p>
                                {searchTerm && <p className="text-sm text-muted-foreground mt-1">Tente mudar os filtros de busca.</p>}
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead className="hidden md:table-cell">CPF</TableHead>
                                            <TableHead className="hidden md:table-cell">Status</TableHead>
                                            <TableHead className="hidden lg:table-cell">Turmas</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAlunos?.map((aluno) => {
                                            const status = getAlunoStatus(aluno.matriculas);
                                            const turmas = aluno.matriculas?.map((m: any) => m.turma?.nome).join(", ");

                                            return (
                                                <TableRow key={aluno.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex flex-col">
                                                            <span>{aluno.nome_completo}</span>
                                                            <span className="text-xs text-muted-foreground md:hidden">{formatCPF(aluno.cpf || "")}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">{formatCPF(aluno.cpf || "Não informado")}</TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                        <Badge variant={
                                                            status === "Ativo" ? "default" :
                                                                status === "Pendente" ? "secondary" :
                                                                    "outline"
                                                        }>
                                                            {status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground truncate max-w-[200px]" title={turmas}>
                                                        {turmas || "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                    <span className="sr-only">Menu</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => {
                                                                    setEditingAluno(aluno);
                                                                    setFormData({
                                                                        nome: aluno.nome_completo,
                                                                        data_nascimento: aluno.data_nascimento,
                                                                        cpf: formatCPF(aluno.cpf || ""),
                                                                        telefone: aluno.telefone || "",
                                                                        endereco: aluno.endereco || "",
                                                                        alergias: (aluno as any).alergias || "",
                                                                        medicamentos: (aluno as any).medicamentos || "",
                                                                        observacoes: (aluno as any).observacoes || "",
                                                                    });
                                                                    setIsDialogOpen(true);
                                                                }}>
                                                                    <Edit2 className="mr-2 h-4 w-4" /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => {
                                                                        if (confirm("Tem certeza que deseja excluir este aluno? O histórico será perdido.")) {
                                                                            deleteMutation.mutate(aluno.id);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* EDIT DIALOG (Simplified for Quick Edits) */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Aluno</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome Completo</Label>
                                <Input
                                    id="nome"
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input
                                    id="cpf"
                                    value={formData.cpf}
                                    onChange={(e) => handleCpfChange(e.target.value)}
                                    maxLength={14}
                                    className={cpfError ? "border-destructive" : ""}
                                />
                                {cpfError && <p className="text-sm text-destructive">{cpfError}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                                <Input
                                    id="data_nascimento"
                                    type="date"
                                    value={formData.data_nascimento}
                                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone</Label>
                                    <Input
                                        id="telefone"
                                        value={formData.telefone}
                                        onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endereco">Endereço</Label>
                                    <Input
                                        id="endereco"
                                        value={formData.endereco}
                                        onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                        placeholder="Endereço completo"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="alergias">Alergias</Label>
                                    <Input
                                        id="alergias"
                                        value={(formData as any).alergias || ""}
                                        onChange={(e) => setFormData({ ...formData, alergias: e.target.value } as any)}
                                        placeholder="Ex: Amendoim"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="medicamentos">Medicamentos</Label>
                                    <Input
                                        id="medicamentos"
                                        value={(formData as any).medicamentos || ""}
                                        onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value } as any)}
                                        placeholder="Ex: Dipirona"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="observacoes">Observações Gerais</Label>
                                <Input
                                    id="observacoes"
                                    value={(formData as any).observacoes || ""}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value } as any)}
                                    placeholder="Outras informações relevantes..."
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default Alunos;
