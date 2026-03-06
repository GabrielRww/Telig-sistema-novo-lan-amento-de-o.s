import {
  LayoutDashboard, ClipboardList, Package, Car, Building2, Users, Wrench,
  Tag, Box, FileText, Search, Settings, Radio, ShieldCheck, Signal,
  BarChart3, ChevronDown, Bot,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Ordens de Serviço", url: "/ordens", icon: ClipboardList },
  { title: "Acompanhamento", url: "/acompanhamento", icon: BarChart3 },
];

const cadastroItems = [
  { title: "Empresas", url: "/empresas", icon: Building2 },
  { title: "Veículos", url: "/veiculos", icon: Car },
  { title: "Equipamentos", url: "/equipamentos", icon: Package },
  { title: "Produtos", url: "/produtos", icon: Box },
  { title: "Técnicos", url: "/tecnicos", icon: Wrench },
  { title: "Categorias Técnicos", url: "/categorias-tecnicos", icon: Tag },
  { title: "Usuários", url: "/usuarios", icon: Users },
];

const operacionalItems = [
  { title: "Estoque", url: "/estoque", icon: Package },
  { title: "Pedidos", url: "/pedidos", icon: FileText },
  { title: "Manutenções", url: "/manutencoes", icon: Settings },
  { title: "Consulta Veículos", url: "/consulta-veiculos", icon: Search },
];

const segurancaItems = [
  { title: "Contrasenha", url: "/contrasenha", icon: ShieldCheck },
  { title: "Jammer", url: "/jammer", icon: Signal },
];

interface NavGroupProps {
  label: string;
  items: typeof mainItems;
  collapsed: boolean;
  defaultOpen?: boolean;
}

const NavGroup = ({ label, items, collapsed, defaultOpen = false }: NavGroupProps) => {
  const location = useLocation();
  const hasActive = items.some((i) => location.pathname === i.url);

  return (
    <Collapsible defaultOpen={defaultOpen || hasActive}>
      <SidebarGroup>
        {!collapsed && (
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-sidebar-accent-foreground transition-colors">
              {label}
              <ChevronDown className="w-3 h-3 transition-transform group-data-[state=open]:rotate-180" />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
        )}
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent/50 transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="sidebar-gradient border-r border-sidebar-border">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-accent-foreground tracking-tight">Telig</span>
        )}
      </div>

      <SidebarContent className="py-2">
        <NavGroup label="Principal" items={mainItems} collapsed={collapsed} defaultOpen />
        <NavGroup label="Cadastros" items={cadastroItems} collapsed={collapsed} />
        <NavGroup label="Operacional" items={operacionalItems} collapsed={collapsed} />
        <NavGroup label="Segurança" items={segurancaItems} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <NavLink
                to="/assistente"
                className="hover:bg-sidebar-accent/50 transition-colors"
                activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
              >
                <Bot className="mr-2 h-4 w-4 shrink-0" />
                {!collapsed && <span>Assistente IA</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
