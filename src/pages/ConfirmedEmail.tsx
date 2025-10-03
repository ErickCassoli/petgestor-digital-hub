// src/pages/ConfirmedEmail.tsx
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

const ConfirmedEmail = () => {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        // 1) Extrai os tokens do hash da URL
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (!access_token || !refresh_token) {
          throw new Error("Não foi possível encontrar os tokens de sessão.");
        }

        // 2) Seta a sessão no Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;

        // 3) Limpa o hash da barra de endereço
        window.history.replaceState({}, document.title, window.location.pathname);

        sonnerToast.success("E-mail confirmado!", {
          description: "Sua conta foi ativada com sucesso.",
        });
      } catch (error: unknown) {
        const description = error instanceof Error ? error.message : "N�o foi poss�vel confirmar o e-mail.";
        sonnerToast.error("Erro ao confirmar e-mail", {
          description,
        });
        // 4) Redireciona pro login daqui a 5s
        setTimeout(() => navigate("/login", { replace: true }), 5000);
      }
    })();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-block mb-8">
          <h1 className="text-3xl font-bold text-petblue-600">PetGestor</h1>
        </Link>
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            E-mail confirmado!
          </h2>
          <p className="text-gray-600 mb-6">
            Sua conta foi ativada com sucesso. Agora você pode fazer login.
          </p>
          <Button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full bg-petblue-600 hover:bg-petblue-700"
          >
            Ir para o login
          </Button>
        </div>
        <div className="mt-6 text-gray-500 text-sm">
          Você será redirecionado automaticamente em alguns segundos.
        </div>
        <div className="mt-4">
          <Link to="/" className="text-petblue-600 hover:text-petblue-800">
            &larr; Voltar para p�gina inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmedEmail;







