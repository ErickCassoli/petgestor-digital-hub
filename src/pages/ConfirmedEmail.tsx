import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ConfirmedEmail = () => {
  const navigate = useNavigate();

  // Optional: redirect to login after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 5000);
    return () => clearTimeout(timer);
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
            onClick={() => navigate("/login")}
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
            &larr; Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ConfirmedEmail;
