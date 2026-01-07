import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Megaphone, Send, Plus, Mail, MessageCircle, Users, User, Loader2, Calendar, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Comunicados = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("geral");
  const [turmaId, setTurmaId] = useState<string>("");
  const [canais, setCanais] = useState<string[]>(["email"]);
  const [agendarEnvio, setAgendarEnvio] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");
  const [recorrencia, setRecorrencia] = useState<string>("");

  const { data: comunicados = [], isLoading } = useQuery({
    queryKey: ["comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados")
        .select(`
          *,
          turmas (nome)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: turmas = [] } = useQuery({
    queryKey: ["turmas-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome")
        .eq("ativa", true)
        .order("nome");
      if (error) throw error;
      return data || [];
    },
  });

  const criarComunicado = useMutation({
    mutationFn: async () => {
      let agendadoPara: string | null = null;
      if (agendarEnvio && dataAgendamento && horaAgendamento) {
        agendadoPara = new Date(`${dataAgendamento}T${horaAgendamento}`).toISOString();
      }

      const { data, error } = await supabase
        .from("comunicados")
        .insert({
          titulo,
          mensagem,
          tipo,
          turma_id: tipo === "turma" ? turmaId : null,
          canal: canais,
          created_by: user?.id,
          agendado_para: agendadoPara,
          recorrencia: agendarEnvio && recorrencia ? recorrencia : null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Comunicado criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar comunicado: " + error.message);
    },
  });

  const enviarComunicado = useMutation({
    mutationFn: async (comunicadoId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("send-comunicado", {
        body: { comunicadoId },
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Comunicado enviado! ${data.sent} destinatários.`);
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
    },
    onError: (error) => {
      toast.error("Erro ao enviar: " + error.message);
    },
  });

  const resetForm = () => {
    setTitulo("");
    setMensagem("");
    setTipo("geral");
    setTurmaId("");
    setCanais(["email"]);
    setAgendarEnvio(false);
    setDataAgendamento("");
    setHoraAgendamento("");
    setRecorrencia("");
  };

  const toggleCanal = (canal: string) => {
    setCanais((prev) =>
      prev.includes(canal)
        ? prev.filter((c) => c !== canal)
        : [...prev, canal]
    );
  };

  const getStatusBadge = (status: string, agendadoPara?: string | null) => {
    if (agendadoPara && status === "rascunho") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />
          Agendado
        </Badge>
      );
    }
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      rascunho: "secondary",
      enviado: "default",
      parcial: "outline",
    };
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      enviado: "Enviado",
      parcial: "Parcial",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getRecorrenciaLabel = (rec: string | null) => {
    const labels: Record<string, string> = {
      diario: "Diário",
      semanal: "Semanal",
      mensal: "Mensal",
    };
    return rec ? labels[rec] || rec : null;
  };

  const getTipoIcon = (comunicadoTipo: string) => {
    if (comunicadoTipo === "turma") return <Users className="h-4 w-4" />;
    if (comunicadoTipo === "individual") return <User className="h-4 w-4" />;
    return <Megaphone className="h-4 w-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Comunicados</h1>
            <p className="text-muted-foreground">
              Envie comunicados para responsáveis via email ou WhatsApp
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Comunicado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Comunicado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="titulo">Título</Label>
                  <Input
                    id="titulo"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título do comunicado"
                  />
                </div>
                <div>
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Escreva a mensagem..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Tipo de Envio</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Geral (Todos)</SelectItem>
                      <SelectItem value="turma">Por Turma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tipo === "turma" && (
                  <div>
                    <Label>Turma</Label>
                    <Select value={turmaId} onValueChange={setTurmaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a turma" />
                      </SelectTrigger>
                      <SelectContent>
                        {turmas.map((turma) => (
                          <SelectItem key={turma.id} value={turma.id}>
                            {turma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Canais de Envio</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email"
                        checked={canais.includes("email")}
                        onCheckedChange={() => toggleCanal("email")}
                      />
                      <label htmlFor="email" className="flex items-center gap-1 text-sm">
                        <Mail className="h-4 w-4" /> Email
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="whatsapp"
                        checked={canais.includes("whatsapp")}
                        onCheckedChange={() => toggleCanal("whatsapp")}
                      />
                      <label htmlFor="whatsapp" className="flex items-center gap-1 text-sm">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </label>
                    </div>
                  </div>
                </div>

                {/* Agendamento */}
                <div className="border-t pt-4 mt-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="agendar"
                      checked={agendarEnvio}
                      onCheckedChange={(checked) => setAgendarEnvio(!!checked)}
                    />
                    <label htmlFor="agendar" className="flex items-center gap-1 text-sm font-medium">
                      <Calendar className="h-4 w-4" /> Agendar envio
                    </label>
                  </div>

                  {agendarEnvio && (
                    <div className="space-y-3 pl-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="data-agendamento">Data</Label>
                          <Input
                            id="data-agendamento"
                            type="date"
                            value={dataAgendamento}
                            onChange={(e) => setDataAgendamento(e.target.value)}
                            min={format(new Date(), "yyyy-MM-dd")}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hora-agendamento">Hora</Label>
                          <Input
                            id="hora-agendamento"
                            type="time"
                            value={horaAgendamento}
                            onChange={(e) => setHoraAgendamento(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Recorrência (opcional)</Label>
                        <Select value={recorrencia} onValueChange={setRecorrencia}>
                          <SelectTrigger>
                            <SelectValue placeholder="Envio único" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Envio único</SelectItem>
                            <SelectItem value="diario">Diário</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => criarComunicado.mutate()}
                  disabled={!titulo || !mensagem || canais.length === 0 || criarComunicado.isPending}
                  className="w-full"
                >
                  {criarComunicado.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Comunicado
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comunicados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : comunicados.length === 0 ? (
              <div className="text-center py-12">
                <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum comunicado criado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Canais</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comunicados.map((comunicado: any) => (
                    <TableRow key={comunicado.id}>
                      <TableCell>{getTipoIcon(comunicado.tipo)}</TableCell>
                      <TableCell className="font-medium">{comunicado.titulo}</TableCell>
                      <TableCell>
                        {comunicado.tipo === "geral" && "Todos"}
                        {comunicado.tipo === "turma" && (comunicado.turmas?.nome || "Turma")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {comunicado.canal?.includes("email") && (
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          )}
                          {comunicado.canal?.includes("whatsapp") && (
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(comunicado.status, comunicado.agendado_para)}
                          {comunicado.recorrencia && (
                            <span className="text-xs text-muted-foreground">
                              {getRecorrenciaLabel(comunicado.recorrencia)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{format(new Date(comunicado.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                          {comunicado.agendado_para && comunicado.status === "rascunho" && (
                            <span className="text-xs text-blue-600">
                              Envio: {format(new Date(comunicado.agendado_para), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {comunicado.status === "rascunho" && (
                          <Button
                            size="sm"
                            onClick={() => enviarComunicado.mutate(comunicado.id)}
                            disabled={enviarComunicado.isPending}
                          >
                            {enviarComunicado.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-1" /> Enviar
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comunicados;
