
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"admin" | "atendente">("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "A senha e a confirmação devem ser iguais.",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await signUp(email, password, role);
      navigate("/dashboard");
    } catch (error) {
      // Error is already handled in the signUp function
      console.error("Registration error handling in component:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-petblue-600">PetGestor</h1>
          </Link>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">Crie sua conta</h2>
          <p className="mt-2 text-gray-600">
            Comece a usar o PetGestor gratuitamente por 7 dias.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu-email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirme a senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tipo de usuário</Label>
              <RadioGroup 
                defaultValue="admin" 
                value={role} 
                onValueChange={(value) => setRole(value as "admin" | "atendente")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin" className="cursor-pointer">Administrador</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="atendente" id="atendente" />
                  <Label htmlFor="atendente" className="cursor-pointer">Atendente</Label>
                </div>
              </RadioGroup>
              <p className="text-xs text-gray-500">
                Administradores têm acesso completo. Atendentes não podem ver relatórios financeiros.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-petblue-600 hover:bg-petblue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Criando conta...
                </span>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Já tem uma conta?{" "}
              <Link
                to="/login"
                className="text-petblue-600 hover:text-petblue-800 font-medium"
              >
                Entrar
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Ao criar uma conta, você concorda com nossos{" "}
              <Link to="#" className="text-petblue-600 hover:text-petblue-800">
                Termos de Serviço
              </Link>{" "}
              e{" "}
              <Link to="#" className="text-petblue-600 hover:text-petblue-800">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-600 hover:text-petblue-600">
            &larr; Voltar para a página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
