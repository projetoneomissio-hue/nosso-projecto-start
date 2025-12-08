import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  evento: z.string().min(2, "Nome do evento é obrigatório"),
  responsavel_nome: z.string().min(2, "Nome do responsável é obrigatório"),
  responsavel_telefone: z.string().optional(),
  data: z.string().min(1, "Data é obrigatória"),
  horario_inicio: z.string().min(1, "Horário de início é obrigatório"),
  horario_fim: z.string().min(1, "Horário de término é obrigatório"),
  valor: z.string().min(1, "Valor é obrigatório"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FormLocacaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locacao?: {
    id: string;
    evento: string;
    responsavel_nome: string;
    responsavel_telefone: string | null;
    data: string;
    horario_inicio: string;
    horario_fim: string;
    valor: number;
    observacoes: string | null;
  } | null;
}

export function FormLocacao({ open, onOpenChange, locacao }: FormLocacaoProps) {
  const queryClient = useQueryClient();
  const isEditing = !!locacao;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      evento: locacao?.evento || "",
      responsavel_nome: locacao?.responsavel_nome || "",
      responsavel_telefone: locacao?.responsavel_telefone || "",
      data: locacao?.data || "",
      horario_inicio: locacao?.horario_inicio || "",
      horario_fim: locacao?.horario_fim || "",
      valor: locacao?.valor?.toString() || "",
      observacoes: locacao?.observacoes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        evento: data.evento,
        responsavel_nome: data.responsavel_nome,
        responsavel_telefone: data.responsavel_telefone || null,
        data: data.data,
        horario_inicio: data.horario_inicio,
        horario_fim: data.horario_fim,
        valor: parseFloat(data.valor),
        observacoes: data.observacoes || null,
      };

      if (isEditing && locacao) {
        const { error } = await supabase
          .from("locacoes")
          .update(payload)
          .eq("id", locacao.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("locacoes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locacoes"] });
      toast.success(isEditing ? "Locação atualizada!" : "Locação cadastrada!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao salvar locação:", error);
      toast.error("Erro ao salvar locação");
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Locação" : "Nova Locação"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="responsavel_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do responsável" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsavel_telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="horario_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="horario_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário Fim</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a locação..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
