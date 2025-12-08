import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  item: z.string().min(2, "Nome do item é obrigatório"),
  valor: z.string().min(1, "Valor é obrigatório"),
  tipo: z.enum(["fixo", "variavel"]),
  data_competencia: z.string().min(1, "Data de competência é obrigatória"),
});

type FormData = z.infer<typeof formSchema>;

interface FormCustoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custo?: {
    id: string;
    item: string;
    valor: number;
    tipo: string;
    data_competencia: string;
  } | null;
}

export function FormCusto({ open, onOpenChange, custo }: FormCustoProps) {
  const queryClient = useQueryClient();
  const isEditing = !!custo;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item: custo?.item || "",
      valor: custo?.valor?.toString() || "",
      tipo: (custo?.tipo as "fixo" | "variavel") || "fixo",
      data_competencia: custo?.data_competencia || new Date().toISOString().slice(0, 10),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        item: data.item,
        valor: parseFloat(data.valor),
        tipo: data.tipo,
        data_competencia: data.data_competencia,
      };

      if (isEditing && custo) {
        const { error } = await supabase
          .from("custos_predio")
          .update(payload)
          .eq("id", custo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custos_predio").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custos-predio"] });
      toast.success(isEditing ? "Custo atualizado!" : "Custo cadastrado!");
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      console.error("Erro ao salvar custo:", error);
      toast.error("Erro ao salvar custo");
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
            {isEditing ? "Editar Custo" : "Novo Custo do Prédio"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Água, Luz, IPTU..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixo">Fixo</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_competencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Competência</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
