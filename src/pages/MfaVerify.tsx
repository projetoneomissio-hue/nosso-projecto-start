import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Key } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MfaVerify() {
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [recoveryCode, setRecoveryCode] = useState<string>("");
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

      setTimeout(() => navigate("/"), 1000);
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

  const verifyRecoveryCode = async () => {
    if (!recoveryCode || recoveryCode.length < 6) {
      toast({
        title: "Código inválido",
        description: "Por favor, insira um código de recuperação válido",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Valida código de recuperação
      const { data: isValid, error } = await supabase.rpc("validate_recovery_code", {
        _user_id: user.id,
        _code: recoveryCode.toUpperCase(),
      });

      if (error) throw error;

      if (isValid) {
        toast({
          title: "Código de recuperação aceito!",
          description: "Você será redirecionado. Considere reconfigurar o MFA.",
        });

        setTimeout(() => navigate("/"), 1000);
      } else {
        toast({
          title: "Código inválido",
          description: "Este código de recuperação é inválido ou já foi usado.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying recovery code:", error);
      toast({
        title: "Erro na verificação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === "Enter") {
      callback();
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
            Insira o código do seu aplicativo autenticador ou use um código de recuperação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="authenticator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="authenticator">
                <Shield className="h-4 w-4 mr-2" />
                Autenticador
              </TabsTrigger>
              <TabsTrigger value="recovery">
                <Key className="h-4 w-4 mr-2" />
                Recuperação
              </TabsTrigger>
            </TabsList>

            <TabsContent value="authenticator" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de verificação</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  onKeyPress={(e) => handleKeyPress(e, verifyMfaCode)}
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
            </TabsContent>

            <TabsContent value="recovery" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="recovery-code">Código de recuperação</Label>
                <Input
                  id="recovery-code"
                  type="text"
                  placeholder="ABCD1234"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => handleKeyPress(e, verifyRecoveryCode)}
                  disabled={isVerifying}
                  className="text-center text-xl tracking-wider uppercase"
                />
                <p className="text-sm text-muted-foreground">
                  Insira um dos códigos de recuperação salvos durante a configuração do MFA
                </p>
              </div>

              <Button
                onClick={verifyRecoveryCode}
                disabled={isVerifying || recoveryCode.length < 6}
                className="w-full"
              >
                {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verificar Código de Recuperação
              </Button>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-4">
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
