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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const formSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  funcao: z.string().min(2, "Função é obrigatória"),
  salario: z.string().min(1, "Salário é obrigatório"),
  ativo: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

interface FormFuncionarioProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionario?: {
    id: string;
    nome: string;
    funcao: string;
    salario: number;
    ativo: boolean;
  } | null;
}

export function FormFuncionario({
  open,
  onOpenChange,
  funcionario,
}: FormFuncionarioProps) {
  const queryClient = useQueryClient();
  const isEditing = !!funcionario;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: funcionario?.nome || "",
      funcao: funcionario?.funcao || "",
      salario: funcionario?.salario?.toString() || "",
      ativo: funcionario?.ativo ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        nome: data.nome,
        funcao: data.funcao,
        salario: parseFloat(data.salario),
        ativo: data.ativo,
      };

      if (isEditing && funcionario) {
        const { error } = await supabase
          .from("funcionarios")
          .update(payload)
          .eq("id", funcionario.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("funcionarios").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success(
        isEditing ? "Funcionário atualizado!" : "Funcionário cadastrado!"
      );
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao salvar funcionário:", error);
      toast.error("Erro ao salvar funcionário");
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Funcionário" : "Novo Funcionário"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="funcao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Zelador, Porteiro..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salario"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salário (R$)</FormLabel>
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
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Funcionário está ativo no momento
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
