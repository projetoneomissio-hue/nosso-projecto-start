/**
 * Invitation Management Page
 * Allows 'direcao' to create invitation tokens for admin users
 */

import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }).max(255),
  role: z.enum(["direcao", "coordenacao", "professor"], { message: "Selecione um papel válido" }),
});

export default function Convites() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"direcao" | "coordenacao" | "professor">("coordenacao");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invitations
  const { data: invitations, isLoading } = useQuery({
    queryKey: ["invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          profiles:created_by(nome_completo)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: async (formData: { email: string; role: string }) => {
      const validation = inviteSchema.safeParse(formData);
      if (!validation.success) {
        throw new Error(validation.error.errors[0].message);
      }

      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("invitations")
        .insert({
          email: validation.data.email,
          role: validation.data.role,
          token,
          created_by: user?.id,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke('send-invitation-email', {
          body: {
            to: validation.data.email,
            inviteToken: token,
            role: validation.data.role,
            origin: window.location.origin,
          },
        });

        if (emailError) {
          console.error('Error sending invitation email:', emailError);
          // Don't fail the invitation creation if email fails
        }
      } catch (emailError) {
        console.error('Error invoking email function:', emailError);
        // Continue even if email fails
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Convite criado e enviado!",
        description: `Email enviado para ${data.email} com o token de convite.`,
      });
      setOpen(false);
      setEmail("");
      setRole("coordenacao");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast({
        title: "Convite deletado",
        description: "O convite foi removido com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deletar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvitation.mutate({ email, role });
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: "Token copiado!",
      description: "Token copiado para a área de transferência",
    });
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      direcao: "Direção",
      coordenacao: "Coordenação",
      professor: "Professor",
    };
    return labels[role] || role;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Convites</h1>
            <p className="text-muted-foreground">
              Gerencie convites para novos usuários administrativos
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Novo Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Criar Convite</DialogTitle>
                  <DialogDescription>
                    Crie um convite para um novo usuário administrativo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@exemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Papel</Label>
                    <Select value={role} onValueChange={(value: any) => setRole(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="coordenacao">Coordenação</SelectItem>
                        <SelectItem value="professor">Professor</SelectItem>
                        <SelectItem value="direcao">Direção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createInvitation.isPending}>
                    {createInvitation.isPending ? "Criando..." : "Criar Convite"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Convites Ativos</CardTitle>
            <CardDescription>
              Gerencie os convites pendentes e enviados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : !invitations || invitations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum convite criado ainda
              </p>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{invitation.email}</p>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {getRoleLabel(invitation.role)}
                        </span>
                        {invitation.used_at && (
                          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-600 rounded">
                            Usado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Criado em {format(new Date(invitation.created_at), "dd/MM/yyyy")} •
                        Expira em {format(new Date(invitation.expires_at), "dd/MM/yyyy")}
                      </p>
                      {!invitation.used_at && (
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {invitation.token}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToken(invitation.token)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!invitation.used_at && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInvitation.mutate(invitation.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
