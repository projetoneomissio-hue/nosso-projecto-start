import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield } from "lucide-react";

export default function MfaVerify() {
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const verifyMfaCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Por favor, insira um código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Get the challenge ID from location state
      const factorId = location.state?.factorId;
      const challengeId = location.state?.challengeId;
      
      if (!factorId || !challengeId) {
        throw new Error("Factor ID ou Challenge ID não encontrado");
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: verificationCode,
      });

      if (error) throw error;

      toast({
        title: "Verificação bem-sucedida!",
        description: "Você será redirecionado em instantes.",
      });

      // Redirect to dashboard after successful verification
      setTimeout(() => navigate("/dashboard"), 1000);
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        title: "Erro na verificação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && verificationCode.length === 6) {
      verifyMfaCode();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Verificação MFA</CardTitle>
          </div>
          <CardDescription>
            Insira o código do seu aplicativo autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Código de verificação</Label>
            <Input
              id="verification-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              onKeyPress={handleKeyPress}
              disabled={isVerifying}
              autoFocus
              className="text-center text-2xl tracking-widest"
            />
            <p className="text-sm text-muted-foreground">
              Insira o código de 6 dígitos do seu aplicativo autenticador
            </p>
          </div>

          <Button
            onClick={verifyMfaCode}
            disabled={isVerifying || verificationCode.length !== 6}
            className="w-full"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => navigate("/login")}
              className="text-sm"
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
