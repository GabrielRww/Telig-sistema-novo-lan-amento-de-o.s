import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

const titles: Record<string, string> = {
  "/acompanhamento": "Acompanhamento",
  "/estoque": "Estoque",
  "/pedidos": "Pedidos",
  "/manutencoes": "Manutenções",
  "/consulta-veiculos": "Consulta de Veículos",
  "/contrasenha": "Contrasenha",
  "/jammer": "Jammer Contrasenha",
  "/produtos": "Produtos",
  "/categorias-tecnicos": "Categorias de Técnicos",
  "/usuarios": "Usuários",
};

const PlaceholderPage = () => {
  const { pathname } = useLocation();
  const title = titles[pathname] || "Módulo";

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Este módulo está em desenvolvimento e será disponibilizado em breve.
      </p>
    </div>
  );
};

export default PlaceholderPage;
