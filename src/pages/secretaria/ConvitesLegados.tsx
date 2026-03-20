import { DashboardLayout } from "@/components/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ConvitesLegados = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [inviting, setInviting] = useState<string | null>(null);

  const { data: invitations, isLoading, refetch } = useQuery({
    queryKey: ["legacy-invitations"],
    queryFn: async () => {
      // Fetch invitations for legacy parents
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("role", "responsavel")
        .is("used_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredInvitations = invitations?.filter(
    (i) =>
      i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredInvitations) {
      setSelectedEmails(filteredInvitations.map((i) => i.email));
    } else {
      setSelectedEmails([]);
    }
  };

  const handleSelectOne = (email: string, checked: boolean) => {
    if (checked) {
      setSelectedEmails((prev) => [...prev, email]);
    } else {
      setSelectedEmails((prev) => prev.filter((e) => e !== email));
    }
  };

  const handleInvite = async (email: string) => {
    const invite = invitations?.find(i => i.email === email);
    if (!invite) return;

    setInviting(email);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error("Sessão não encontrada. Por favor, faça login novamente.");
        setInviting(null);
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-invitation-email', {
        body: { 
          to: email, 
          role: 'responsavel', 
          inviteToken: invite.token, 
          nomeResponsavel: 'Responsável Legado',
          origin: window.location.origin
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;
      toast.success(`Convite enviado para ${email}`);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setInviting(null);
    }
  };

  const handleInviteSelected = async () => {
    if (selectedEmails.length === 0) return;
    
    const confirm = window.confirm(`Deseja enviar convites para ${selectedEmails.length} responsáveis?`);
    if (!confirm) return;

    for (const email of selectedEmails) {
      await handleInvite(email);
      // Wait for 1 second between invites to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }
    setSelectedEmails([]);
    toast.success("Processamento de convites em massa concluído.");
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            Convites de Pais (Legado)
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie o envio de convites para os 255 pais importados da planilha.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por e-mail..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            disabled={selectedEmails.length === 0}
            onClick={handleInviteSelected}
            className="w-full md:w-auto"
          >
            Convidar Selecionados ({selectedEmails.length})
          </Button>
        </div>

        <div className="border border-white/10 rounded-xl bg-card/50 backdrop-blur-xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedEmails.length === filteredInvitations?.length && filteredInvitations?.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    className="border-white/20 data-[state=checked]:bg-primary"
                  />
                </TableHead>
                <TableHead className="text-foreground/70 font-bold uppercase tracking-wider text-[11px]">E-mail</TableHead>
                <TableHead className="text-foreground/70 font-bold uppercase tracking-wider text-[11px]">Token</TableHead>
                <TableHead className="text-foreground/70 font-bold uppercase tracking-wider text-[11px]">Expira em</TableHead>
                <TableHead className="text-right text-foreground/70 font-bold uppercase tracking-wider text-[11px]">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  </TableCell>
                </TableRow>
              ) : filteredInvitations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhum convite pendente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvitations?.map((invite) => (
                  <TableRow key={invite.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedEmails.includes(invite.email)}
                        onCheckedChange={(checked) => handleSelectOne(invite.email, !!checked)}
                        className="border-white/20 data-[state=checked]:bg-primary"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-foreground/90">{invite.email}</TableCell>
                    <TableCell>
                      <code className="bg-primary/20 text-primary px-2 py-1 rounded-md text-xs font-mono border border-primary/30">
                        {invite.token}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInvite(invite.email)}
                        disabled={inviting === invite.email}
                        className="hover:bg-primary/20 hover:text-primary transition-all rounded-lg"
                      >
                        {inviting === invite.email ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        Convidar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ConvitesLegados;
