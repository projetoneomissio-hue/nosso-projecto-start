import { useState, useMemo, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { infinitePayService } from "@/services/infinitepay.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, Eye, Search, Phone, Calendar, User, Activity, AlertCircle, Link as LinkIcon, Loader2, Copy 
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { matriculasService } from "@/services/matriculas.service";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativa": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
    case "pendente": return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
    case "cancelada": return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const DetalhesMatriculaSheet = ({ matricula, open, onOpenChange }: any) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCheckoutUrl(null);
      setIsGenerating(false);
    }
  }, [open]);

  if (!matricula) return null;

  const aluno = matricula.aluno;
  const health = aluno?.anamneses?.[0];
  const responsavel = aluno?.responsavel;
  
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto custom-scrollbar p-0 bg-background/95 backdrop-blur-xl border-l border-primary/10">
        <SheetTitle className="sr-only">Detalhes da Matrícula</SheetTitle>
        <SheetDescription className="sr-only">Painel de visualização avançada com resumo de contatos e log financeiro da matrícula e aluno.</SheetDescription>
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-primary/5 flex items-end p-6 border-b border-primary/10">
          <Badge className={cn("absolute top-6 right-6 font-bold uppercase tracking-widest text-[10px] border-none shadow-sm", getStatusColor(matricula.status))}>
            {matricula.status}
          </Badge>
          <div className="flex items-center gap-4 translate-y-8">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
              <AvatarImage src={aluno?.foto_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">
                {aluno?.nome_completo?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="p-6 pt-12 space-y-8">
          {/* Header Info */}
          <div>
            <h2 className="text-2xl font-black text-foreground">{aluno?.nome_completo}</h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {aluno?.data_nascimento ? format(new Date(aluno.data_nascimento), "dd/MM/yyyy") : "Não informado"} 
                {aluno?.data_nascimento && ` (${new Date().getFullYear() - new Date(aluno.data_nascimento).getFullYear()} anos)`}
              </span>
            </div>
          </div>

          {/* Enrolment Info */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-primary/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Activity className="h-3 w-3" /> Dados da Matrícula
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Turma</p>
                <p className="text-sm font-semibold">{matricula.turma?.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{matricula.turma?.horario} • {matricula.turma?.dias_semana?.join(", ")}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Atividade</p>
                <p className="text-sm font-semibold">{matricula.turma?.atividade?.nome}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Data de Início</p>
                <p className="text-sm">{matricula.data_inicio ? format(new Date(matricula.data_inicio), "dd/MM/yyyy") : "-"}</p>
              </div>
            </div>
          </div>

          {/* Responsible Info */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-2xl border border-primary/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" /> Contato Responsável
            </h3>
            {responsavel ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold">{responsavel.nome_completo}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{responsavel.telefone || "Não informado"}</span>
                </div>
                {responsavel.telefone && (
                  <Button 
                    className="w-full mt-2 gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white shadow-xl shadow-[#25D366]/20 font-bold"
                    onClick={() => {
                      const cleanPhone = responsavel.telefone.replace(/\D/g, "");
                      const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                      const msg = encodeURIComponent(`Olá ${responsavel.nome_completo}, referente à matrícula de ${aluno.nome_completo}...`);
                      window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    Falar no WhatsApp
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Nenhum responsável vinculado.</p>
            )}
          </div>

          {/* Financial Actions */}
          {matricula.status === "pendente" && (
            <div className="space-y-3 p-4 bg-green-500/5 rounded-2xl border border-green-500/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center gap-2">
                <LinkIcon className="h-3 w-3" /> Recuperação de Cobrança
              </h3>
              
              {!checkoutUrl ? (
                  <Button 
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white shadow-xl shadow-green-600/20 font-bold"
                    onClick={async () => {
                      try {
                        setIsGenerating(true);
                        // Verifica se existe um pagamento pendente
                        let pagId = matricula.pagamentos?.find((p: any) => p.status === "pendente")?.id;
                        
                        // Se não existe, cria um na hora! (Excelente para recuperar perdidos ou isentos)
                        if (!pagId) {
                            const { data: newPag, error } = await supabase.from("pagamentos").insert({
                                matricula_id: matricula.id,
                                valor: 25.00,
                                status: "pendente",
                                data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                                referencia: "TAXA-MATRICULA"
                            }).select().single();
                            
                            if (error) throw error;
                            pagId = newPag.id;
                        }

                        const result = await infinitePayService.createCheckoutLink(pagId);
                        setCheckoutUrl(result.gateway_url);
                      } catch(e: any) {
                        toast({ variant: "destructive", title: "Erro InfinitePay", description: e.message || "Erro desconhecido" });
                      } finally {
                        setIsGenerating(false);
                      }
                    }}
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <LinkIcon className="h-5 w-5" />}
                    Gerar Pix / Cartão InfinitePay
                  </Button>
              ) : (
                  <div className="space-y-3 mt-2 animate-in fade-in zoom-in-95">
                      <div className="flex bg-background border rounded-lg p-2 items-center gap-2">
                          <LinkIcon className="h-4 w-4 text-muted-foreground ml-2" />
                          <input readOnly value={checkoutUrl} className="bg-transparent border-none flex-1 text-xs outline-none truncate font-mono text-muted-foreground" />
                          <Button size="icon" variant="secondary" className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                  onClick={() => {
                                      navigator.clipboard.writeText(checkoutUrl);
                                      toast({ title: "Link Copiado!" });
                                  }}>
                              <Copy className="h-4 w-4" />
                          </Button>
                      </div>
                      {responsavel?.telefone && (
                          <Button 
                            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white font-black uppercase text-xs h-10 rounded-xl shadow-xl shadow-[#25D366]/20 gap-2"
                            onClick={() => {
                                const cleanPhone = responsavel.telefone.replace(/\D/g, "");
                                const phone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                                const msg = encodeURIComponent(`Olá ${responsavel.nome_completo}! Parabéns, a matrícula de ${aluno.nome_completo} foi aprovada no Neo Missio 🎉\n\nPara concluir o ingresso na modalidade de ${matricula.turma?.atividade?.nome || 'Geral'}, você precisa realizar o pagamento da *Taxa de Matrícula (R$ 25,00)*.\n\nAcesse o link seguro a seguir para pagar via Pix ou Cartão:\n${checkoutUrl}\n\nApós o pagamento o acesso ao sistema será liberado automaticamente!`);
                                window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                            }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                            Enviar Cobrança (Pix/Cartão)
                          </Button>
                      )}
                  </div>
              )}
            </div>
          )}

          {/* Health Info */}
          {(health?.is_pne || health?.alergias || health?.doenca_cronica) && (
            <div className="space-y-3 p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                <AlertCircle className="h-3 w-3" /> Atenção Médica
              </h3>
              <ul className="space-y-2 text-sm">
                {health.is_pne && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-500">PNE:</span> 
                    <span className="text-muted-foreground">{health.pne_cid || "Sim (CID não informado)"}</span>
                  </li>
                )}
                {health.alergias && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-500">Alergias:</span> 
                    <span className="text-muted-foreground">{health.alergias}</span>
                  </li>
                )}
                {health.doenca_cronica && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-red-500">Doença Crônica:</span> 
                    <span className="text-muted-foreground">{health.doenca_cronica}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
};

const Matriculas = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todas");
  const [selectedMatricula, setSelectedMatricula] = useState<any>(null);
  
  const navigate = useNavigate();

  const { data: matriculas, isLoading } = useQuery({
    queryKey: ["matriculas-premium"],
    queryFn: matriculasService.fetchAll,
  });

  const filteredData = useMemo(() => {
    if (!matriculas) return [];
    
    return matriculas.filter((m: any) => {
      // Tab filter
      if (activeTab !== "todas" && m.status !== activeTab) return false;
      
      // Search filter
      if (search) {
        const query = search.toLowerCase();
        const nomeAluno = m.aluno?.nome_completo?.toLowerCase() || "";
        const nomeTurma = m.turma?.nome?.toLowerCase() || "";
        const nomeAtividade = m.turma?.atividade?.nome?.toLowerCase() || "";
        
        return nomeAluno.includes(query) || nomeTurma.includes(query) || nomeAtividade.includes(query);
      }
      
      return true;
    });
  }, [matriculas, search, activeTab]);

  const handleWhatsApp = (e: React.MouseEvent, matricula: any) => {
    e.stopPropagation();
    const phone = matricula.aluno?.responsavel?.telefone?.replace(/\D/g, "");
    if (!phone) {
       alert("Responsável não possui telefone cadastrado.");
       return;
    }
    const cleanPhone = phone.startsWith('55') ? phone : `55${phone}`;
    const msg = encodeURIComponent(`Olá ${matricula.aluno?.responsavel?.nome_completo || ''}, falo do projeto Neo Missio sobre a matrícula de ${matricula.aluno?.nome_completo}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-6 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">Matrículas</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gestão centralizada de alunos e inscrições
            </p>
          </div>
          <Button 
            onClick={() => navigate('/direcao/pre-cadastro')}
            className="gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Nova Matrícula
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 bg-muted/30 p-2 rounded-2xl border border-primary/5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="bg-transparent h-11">
              <TabsTrigger value="todas" className="rounded-xl px-4 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Todas</TabsTrigger>
              <TabsTrigger value="ativa" className="rounded-xl px-4 font-bold data-[state=active]:bg-green-500/10 data-[state=active]:text-green-600">Ativas</TabsTrigger>
              <TabsTrigger value="pendente" className="rounded-xl px-4 font-bold data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600">Pendentes</TabsTrigger>
              <TabsTrigger value="cancelada" className="rounded-xl px-4 font-bold data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600">Canceladas</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Buscar por aluno, turma ou atividade..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background/50 border-primary/10 focus-visible:ring-primary/20 rounded-xl"
            />
          </div>
        </div>

        {/* Data Table / List View */}
        <div className="rounded-2xl border border-primary/10 overflow-hidden bg-card/30 backdrop-blur-sm shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aluno</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Turma / Atividade</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Data</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-4"><Skeleton className="h-8 w-full rounded-xl" /></td>
                    </tr>
                  ))
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <p className="font-bold">Nenhuma matrícula encontrada.</p>
                      <p className="text-sm">Mude seus filtros ou busque por outro termo.</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((m: any) => (
                    <tr 
                      key={m.id} 
                      className="hover:bg-primary/[0.02] transition-colors cursor-pointer group"
                      onClick={() => setSelectedMatricula(m)}
                    >
                      <td className="px-6 py-4">
                        <Badge className={cn("text-[10px] uppercase font-bold tracking-widest border-none px-2 py-1", getStatusColor(m.status))}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/10">
                            <AvatarImage src={m.aluno?.foto_url} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                              {m.aluno?.nome_completo?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-black text-sm text-foreground">{m.aluno?.nome_completo}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5 max-w-[200px] truncate">
                              {m.aluno?.responsavel?.nome_completo || "Sem Responsável"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <p className="font-bold text-sm text-foreground">{m.turma?.nome}</p>
                        <p className="text-[10px] text-primary/60 uppercase font-black tracking-widest mt-0.5">{m.turma?.atividade?.nome}</p>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell text-sm text-muted-foreground font-medium">
                        {m.data_inicio ? format(new Date(m.data_inicio), "dd/MM/yyyy") : "-"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-[#25D366] hover:bg-[#25D366]/10"
                            onClick={(e) => handleWhatsApp(e, m)}
                            title="WhatsApp"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10"
                            title="Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-primary/5">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-center"><Skeleton className="h-5 w-20" /><Skeleton className="h-5 w-16" /></div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-1/2" />
                </div>
              ))
            ) : filteredData.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <p className="font-bold">Nenhuma matrícula encontrada.</p>
              </div>
            ) : (
              filteredData.map((m: any) => (
                <div 
                  key={m.id} 
                  className="p-4 space-y-4 hover:bg-primary/[0.02] active:bg-primary/[0.05] transition-colors"
                  onClick={() => setSelectedMatricula(m)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-primary/10">
                        <AvatarImage src={m.aluno?.foto_url} />
                        <AvatarFallback className="bg-primary/5 text-primary text-base font-black">
                          {m.aluno?.nome_completo?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-black text-foreground leading-tight">{m.aluno?.nome_completo}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                          Início: {m.data_inicio ? format(new Date(m.data_inicio), "dd/MM/yyyy") : "-"}
                        </p>
                      </div>
                    </div>
                    <Badge className={cn("text-[8px] uppercase font-black tracking-widest border-none h-5 px-1.5", getStatusColor(m.status))}>
                      {m.status}
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-primary/5 flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium uppercase tracking-tighter">Atividade</span>
                      <span className="font-black text-primary">{m.turma?.atividade?.nome}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-primary/5 pt-1 mt-1">
                      <span className="text-muted-foreground font-medium uppercase tracking-tighter">Turma</span>
                      <span className="font-bold text-foreground">{m.turma?.nome}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button 
                      variant="secondary" 
                      className="flex-1 h-10 gap-2 font-bold bg-primary/10 hover:bg-primary/20 text-primary border-none"
                    >
                      <Eye className="h-4 w-4" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-10 w-10 border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/10"
                      onClick={(e) => handleWhatsApp(e, m)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      <DetalhesMatriculaSheet 
        matricula={selectedMatricula} 
        open={!!selectedMatricula} 
        onOpenChange={(open: boolean) => !open && setSelectedMatricula(null)} 
      />
    </DashboardLayout>
  );
};

export default Matriculas;
