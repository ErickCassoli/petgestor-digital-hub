// components/CookiesPolicyModal.tsx
import { useState } from "react";

const CookiesPolicyModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
        onClick={handleToggle}
      >
        Política de Cookies
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white max-w-2xl w-full rounded-xl p-6 relative shadow-lg overflow-y-auto max-h-[90vh]">
            <button
              onClick={handleToggle}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl font-bold"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold mb-4">Política de Cookies</h2>
            <div className="text-gray-700 text-sm space-y-4 text-justify">
              <p>
                Esta Política de Cookies explica como o <strong>PetGestor</strong> utiliza cookies e tecnologias semelhantes para reconhecer usuários ao visitar nosso site.
              </p>

              <p>
                <strong>1. O que são cookies?</strong> Cookies são pequenos arquivos de texto armazenados no seu navegador que ajudam a lembrar preferências, analisar tráfego e personalizar conteúdo.
              </p>

              <p>
                <strong>2. Tipos de cookies que usamos:</strong>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Essenciais:</strong> Necessários para funcionamento do site.</li>
                  <li><strong>Desempenho:</strong> Coletam dados anônimos sobre como o site é usado.</li>
                  <li><strong>Funcionais:</strong> Guardam preferências do usuário.</li>
                  <li><strong>Marketing:</strong> Ajudam a entregar anúncios mais relevantes.</li>
                </ul>
              </p>

              <p>
                <strong>3. Gerenciamento:</strong> Você pode desativar cookies nas configurações do seu navegador. A desativação pode afetar algumas funcionalidades do site.
              </p>

              <p>
                <strong>4. Consentimento:</strong> Ao continuar navegando em nosso site, você concorda com o uso de cookies, conforme descrito nesta política.
              </p>

              <p>
                Para mais informações, entre em contato:{" "}
                <a href="mailto:contato@petgestor.com" className="text-blue-600 underline">
                  contato@petgestor.com
                </a>
              </p>

              <p className="italic text-gray-500">Última atualização: 05 de maio de 2025.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookiesPolicyModal;
