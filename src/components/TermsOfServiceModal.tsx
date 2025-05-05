// components/TermsOfServiceModal.tsx
import { useState } from "react";

const TermsOfServiceModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
        onClick={handleToggle}
      >
        Termos de Serviço
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

            <h2 className="text-2xl font-bold mb-4">Termos de Serviço</h2>
            <div className="text-gray-700 text-sm space-y-4 text-justify">
              <p>
                Estes Termos de Serviço regulam o uso da plataforma <strong>PetGestor</strong> por seus usuários.
                Ao acessar e utilizar nossos serviços, você concorda com os termos abaixo.
              </p>

              <p>
                <strong>1. Uso da Plataforma:</strong> O PetGestor oferece funcionalidades para gestão de petshops, como agendamento, cadastro de clientes, controle de estoque e relatórios. O uso deve respeitar a legislação vigente e a boa-fé.
              </p>

              <p>
                <strong>2. Cadastro:</strong> O usuário se compromete a fornecer informações verídicas. O acesso à conta é pessoal e intransferível.
              </p>

              <p>
                <strong>3. Responsabilidades:</strong> O usuário é responsável por todas as atividades realizadas em sua conta. É proibido usar a plataforma para fins ilegais, fraudulentos ou abusivos.
              </p>

              <p>
                <strong>4. Propriedade Intelectual:</strong> Todo o conteúdo, marca, layout e software do PetGestor são protegidos por direitos autorais. É proibido copiar, modificar ou distribuir qualquer parte sem autorização.
              </p>

              <p>
                <strong>5. Cancelamento:</strong> O usuário pode cancelar sua conta a qualquer momento. O PetGestor se reserva o direito de encerrar contas que violem estes termos.
              </p>

              <p>
                <strong>6. Alterações:</strong> Estes termos podem ser atualizados. O uso contínuo da plataforma após mudanças indica concordância.
              </p>

              <p>
                Para dúvidas ou esclarecimentos, entre em contato:{" "}
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

export default TermsOfServiceModal;
