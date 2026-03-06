import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList, CheckCircle2, Wrench, Users, Package,
  TrendingUp, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const barData = [
  { name: "Jan", instalacoes: 40, retiradas: 12, manutencoes: 8 },
  { name: "Fev", instalacoes: 35, retiradas: 15, manutencoes: 10 },
  { name: "Mar", instalacoes: 50, retiradas: 8, manutencoes: 14 },
  { name: "Abr", instalacoes: 45, retiradas: 20, manutencoes: 6 },
  { name: "Mai", instalacoes: 55, retiradas: 10, manutencoes: 12 },
  { name: "Jun", instalacoes: 60, retiradas: 18, manutencoes: 9 },
];

const statusColors: Record<string, string> = {
  "aberta": "bg-info/10 text-info",
  "em_andamento": "bg-warning/10 text-warning",
  "concluida": "bg-success/10 text-success",
  "cancelada": "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  "aberta": "Aberta",
  "em_andamento": "Em andamento",
  "concluida": "Concluída",
  "cancelada": "Cancelada",
};

const tipoLabels: Record<string, string> = {
  "instalacao": "Instalação",
  "retirada": "Retirada",
  "manutencao": "Manutenção",
  "reinstalacao": "Reinstalação",
};

const Dashboard = () => {
  const { profile } = useAuth();
  const [counts, setCounts] = useState({ osAbertas: 0, equipAtivos: 0, tecnicos: 0, equipDisponiveis: 0, equipManutencao: 0 });
  const [recentOS, setRecentOS] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [osRes, eqRes, tecRes, osListRes] = await Promise.all([
        supabase.from("ordens_servico").select("id", { count: "exact" }).in("status", ["aberta", "em_andamento"]),
        supabase.from("equipamentos").select("status"),
        supabase.from("tecnicos").select("id", { count: "exact" }).eq("status", "Disponível"),
        supabase.from("ordens_servico").select("codigo, tipo, status, veiculos(placa), tecnicos(nome)").order("created_at", { ascending: false }).limit(5),
      ]);

      setCounts({
        osAbertas: osRes.count || 0,
        equipAtivos: eqRes.data?.filter((e) => e.status === "ativo").length || 0,
        tecnicos: tecRes.count || 0,
        equipDisponiveis: eqRes.data?.filter((e) => e.status === "disponivel").length || 0,
        equipManutencao: eqRes.data?.filter((e) => e.status === "em_manutencao").length || 0,
      });

      const eqData = eqRes.data || [];
      setPieData([
        { name: "Ativos", value: eqData.filter((e) => e.status === "ativo").length, color: "hsl(173, 58%, 39%)" },
        { name: "Estoque", value: eqData.filter((e) => e.status === "disponivel").length, color: "hsl(210, 100%, 52%)" },
        { name: "Manutenção", value: eqData.filter((e) => e.status === "em_manutencao").length, color: "hsl(38, 92%, 50%)" },
        { name: "Retirados", value: eqData.filter((e) => e.status === "retirado").length, color: "hsl(220, 10%, 46%)" },
      ]);

      setRecentOS(osListRes.data || []);
    };
    fetchData();
  }, []);

  const kpis = [
    { label: "OS Abertas", value: counts.osAbertas, icon: ClipboardList, color: "text-info" },
    { label: "Equip. Ativos", value: counts.equipAtivos, icon: TrendingUp, color: "text-primary" },
    { label: "Equip. Estoque", value: counts.equipDisponiveis, icon: Package, color: "text-success" },
    { label: "Em Manutenção", value: counts.equipManutencao, icon: Wrench, color: "text-warning" },
    { label: "Técnicos Disp.", value: counts.tecnicos, icon: Users, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Bem-vindo, {profile?.full_name || "Usuário"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Serviços por Mês</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 90%)" />
              <XAxis dataKey="name" tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <YAxis tick={{ fill: "hsl(220, 10%, 46%)", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 90%)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="instalacoes" fill="hsl(173, 58%, 39%)" radius={[4, 4, 0, 0]} name="Instalações" />
              <Bar dataKey="retiradas" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Retiradas" />
              <Bar dataKey="manutencoes" fill="hsl(210, 100%, 52%)" radius={[4, 4, 0, 0]} name="Manutenções" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Status dos Equipamentos</h3>
          {pieData.some((d) => d.value > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 90%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">Nenhum equipamento cadastrado</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Ordens de Serviço Recentes</h3>
        </div>
        {recentOS.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Veículo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Técnico</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOS.map((os) => (
                  <tr key={os.codigo} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-primary font-medium">{os.codigo}</td>
                    <td className="p-3 text-foreground">{tipoLabels[os.tipo] || os.tipo}</td>
                    <td className="p-3 font-mono text-xs text-foreground">{(os.veiculos as any)?.placa || "-"}</td>
                    <td className="p-3 text-foreground">{(os.tecnicos as any)?.nome || "-"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[os.status] || ""}`}>
                        {statusLabels[os.status] || os.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma OS registrada ainda. Comece criando sua primeira ordem de serviço!</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
