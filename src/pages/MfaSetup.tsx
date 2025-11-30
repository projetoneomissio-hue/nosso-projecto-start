import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Shield, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    enrollMfa();
  }, [user, navigate]);

  const enrollMfa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Neo Missio MFA",
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
      }
    } catch (error: any) {
      console.error("Error enrolling MFA:", error);
      toast({
        title: "Erro ao configurar MFA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnableMfa = async () => {
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
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: verificationCode,
      });

      if (error) throw error;

      toast({
        title: "MFA ativado com sucesso!",
        description: "Sua conta agora está protegida com autenticação de dois fatores.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error verifying MFA:", error);
      toast({
        title: "Erro ao verificar código",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const downloadRecoveryCodes = async () => {
    // In a real implementation, you would generate and display recovery codes
    toast({
      title: "Códigos de recuperação",
      description: "Em desenvolvimento: Salve seus códigos de recuperação em local seguro",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Configurar MFA</CardTitle>
          </div>
          <CardDescription>
            Configure a autenticação de dois fatores para maior segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Use um aplicativo autenticador como Google Authenticator, Authy ou Microsoft Authenticator.
            </AlertDescription>
          </Alert>

          {qrCode && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              <div className="space-y-2">
                <Label>Ou insira o código manualmente:</Label>
                <div className="p-3 bg-muted rounded-md">
                  <code className="text-sm font-mono break-all">{secret}</code>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-code">Código de verificação</Label>
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  disabled={isVerifying}
                />
                <p className="text-sm text-muted-foreground">
                  Insira o código de 6 dígitos do seu aplicativo autenticador
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={verifyAndEnableMfa}
                  disabled={isVerifying || verificationCode.length !== 6}
                  className="w-full"
                >
                  {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verificar e Ativar MFA
                </Button>

                <Button
                  variant="outline"
                  onClick={downloadRecoveryCodes}
                  className="w-full"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Códigos de Recuperação
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
