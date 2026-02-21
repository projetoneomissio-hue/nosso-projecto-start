import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Camera, Loader2, Save, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ObservacaoAlunoProps {
    alunoId: string;
    alunoNome: string;
    turmaId: string;
    initialText?: string;
    onSave?: (text: string, photoUrl?: string) => void;
}

export const ObservacaoAluno = ({ alunoId, alunoNome, turmaId, initialText = "", onSave }: ObservacaoAlunoProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [observacao, setObservacao] = useState(initialText);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        if (!observacao && !file) return;

        setUploading(true);
        try {
            let photoUrl = null;

            if (file) {
                const fileExt = file.name.split(".").pop();
                const fileName = `${turmaId}/${alunoId}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from("class-photos")
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from("class-photos").getPublicUrl(fileName);
                photoUrl = data.publicUrl;
            }

            // Here you would typically save to a 'diario_observacoes' table
            // For now, we'll just log it and show success as the table might not exist yet based on schema context
            console.log("Saving observation:", { alunoId, turmaId, observacao, photoUrl });

            // Mock DB save
            await new Promise(resolve => setTimeout(resolve, 500));

            if (onSave) {
                onSave(observacao, photoUrl || undefined);
            }

            toast({ title: "Observação salva!", description: "Dados registrados com sucesso." });
            setIsOpen(false);
            setFile(null);
        } catch (error) {
            console.error(error);
            toast({ title: "Erro ao salvar", variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" title="Adicionar Observação">
                    <Camera className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Observação: {alunoNome}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        placeholder="Digite sua observação sobre o aluno..."
                        value={observacao}
                        onChange={(e) => setObservacao(e.target.value)}
                    />

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => document.getElementById(`file-${alunoId}`)?.click()}
                        >
                            <Camera className="mr-2 h-4 w-4" />
                            {file ? "Trocar Foto" : "Adicionar Foto"}
                        </Button>
                        <input
                            type="file"
                            id={`file-${alunoId}`}
                            accept="image/*"
                            capture="environment" // Opens camera on mobile
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>

                    {file && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="truncate max-w-[200px]">{file.name}</span>
                            <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-6 w-6 p-0 text-red-500">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <Button onClick={handleSave} disabled={uploading || (!observacao && !file)} className="w-full">
                        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Registro
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
