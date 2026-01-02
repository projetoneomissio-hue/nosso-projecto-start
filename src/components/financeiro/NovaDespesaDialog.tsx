import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, DollarSign, Calendar, FileText } from "lucide-react";

export function NovaDespesaDialog() {
    const [open, setOpen] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        item: "",
        valor: "",
        data_competencia: new Date().toISOString().split("T")[0],
        tipo: "fixo",
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from("custos_predio").insert({
                item: formData.item,
                valor: parseFloat(formData.valor),
                data_competencia: formData.data_competencia,
                tipo: formData.tipo,
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Despesa registrada",
                description: "O custo foi adicionado ao sistema.",
            });
            queryClient.invalidateQueries({ queryKey: ["custos-predio"] });
            setOpen(false);
            setFormData({
                item: "",
                valor: "",
                data_competencia: new Date().toISOString().split("T")[0],
                tipo: "fixo",
            });
        },
        onError: (error) => {
            toast({
                title: "Erro ao registrar",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.item || !formData.valor) {
            toast({ title: "Preencha todos os campos", variant: "destructive" });
            return;
        }
        saveMutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Despesa
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Registrar Despesa / Custo</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="item">Descrição</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="item"
                                placeholder="Ex: Conta de Luz, Reparo Ar-condicionado"
                                className="pl-9"
                                value={formData.item}
                                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="valor">Valor (R$)</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    className="pl-9"
                                    placeholder="0.00"
                                    value={formData.valor}
                                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="data_competencia">Data</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="data_competencia"
                                    type="date"
                                    className="pl-9"
                                    value={formData.data_competencia}
                                    onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo</Label>
                        <Select
                            value={formData.tipo}
                            onValueChange={(val) => setFormData({ ...formData, tipo: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="fixo">Fixo</SelectItem>
                                <SelectItem value="variavel">Variável</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                        {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Despesa
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
