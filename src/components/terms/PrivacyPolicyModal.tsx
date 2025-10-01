import { useState } from "react";

const PrivacyPolicyModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        className="text-blue-600 underline cursor-pointer hover:text-blue-800"
        onClick={handleToggle}
      >
        Termos de Política e Privacidade
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

            <h2 className="text-2xl font-bold mb-4">Política de Privacidade</h2>
            <div className="text-gray-700 text-sm space-y-4 text-justify">
              <p>
                Esta Política de Privacidade descreve como o <strong>PetGestor</strong> coleta, usa, armazena, compartilha e protege as informações pessoais dos usuários da plataforma.
              </p>

              <p>
                <strong>1. Coleta de Informações:</strong> Podemos coletar dados pessoais como nome, e-mail, telefone, CPF, endereço IP, localização, dados de navegação e comportamento no site ou aplicativo. A coleta ocorre quando você se cadastra, preenche formulários ou utiliza nossos serviços.
              </p>

              <p>
                <strong>2. Finalidade da Coleta:</strong> As informações são utilizadas para:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Fornecer e melhorar os serviços oferecidos;</li>
                  <li>Realizar atendimento ao cliente e suporte técnico;</li>
                  <li>Personalizar a experiência do usuário;</li>
                  <li>Enviar comunicações promocionais (com consentimento);</li>
                  <li>Cumprir obrigações legais e regulatórias.</li>
                </ul>
              </p>

              <p>
                <strong>3. Compartilhamento de Dados:</strong> Não vendemos dados pessoais. Compartilhamos apenas com parceiros de confiança, prestadores de serviço sob contrato de confidencialidade e autoridades legais, quando exigido por lei.
              </p>

              <p>
                <strong>4. Segurança das Informações:</strong> Adotamos medidas técnicas e administrativas adequadas para proteger seus dados contra acessos não autorizados, destruição, perda, alteração ou divulgação indevida.
              </p>

              <p>
                <strong>5. Seus Direitos:</strong> Em conformidade com a LGPD, você pode:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Acessar seus dados pessoais;</li>
                  <li>Solicitar a correção ou exclusão de dados;</li>
                  <li>Revogar consentimentos dados anteriormente;</li>
                  <li>Solicitar portabilidade de dados.</li>
                </ul>
                Para exercer seus direitos, envie e-mail para:
                <a
                  href="mailto:contato@petgestor.com"
                  className="text-blue-600 underline ml-1"
                >
                  contato@petgestor.com
                </a>
              </p>

              <p>
                <strong>6. Cookies e Tecnologias:</strong> Utilizamos cookies e tecnologias semelhantes para análise de tráfego, personalização de conteúdo e marketing. Você pode desativar cookies no seu navegador.
              </p>

              <p>
                <strong>7. Retenção de Dados:</strong> Os dados são mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política, salvo quando houver obrigações legais específicas para retenção.
              </p>

              <p>
                <strong>8. Alterações na Política:</strong> Esta Política de Privacidade pode ser atualizada periodicamente. Recomendamos a leitura regular. Notificações serão enviadas em caso de alterações significativas.
              </p>

              <p className="italic text-gray-500">
                Última atualização: 05 de maio de 2025.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacyPolicyModal;
