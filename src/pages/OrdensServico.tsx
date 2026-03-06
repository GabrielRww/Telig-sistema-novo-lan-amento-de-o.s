import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

const statusStyles: Record<string, string> = {
  aberta: "bg-info/10 text-info border-info/20",
  em_andamento: "bg-warning/10 text-warning border-warning/20",
  concluida: "bg-success/10 text-success border-success/20",
  cancelada: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta", em_andamento: "Em andamento", concluida: "Concluída", cancelada: "Cancelada",
};

const tipoLabels: Record<string, string> = {
  instalacao: "Instalação", retirada: "Retirada", manutencao: "Manutenção", reinstalacao: "Reinstalação",
};

const OrdensServico = () => {
  const [search, setSearch] = useState("");
  const [osList, setOsList] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Form state
  const [tipo, setTipo] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [defeitoRelatado, setDefeitoRelatado] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const fetchOS = async () => {
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, empresas(nome), veiculos(placa), tecnicos(nome)")
      .order("created_at", { ascending: false });
    setOsList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOS();
    supabase.from("empresas").select("id, nome").then(({ data }) => setEmpresas(data || []));
    supabase.from("veiculos").select("id, placa, modelo").then(({ data }) => setVeiculos(data || []));
    supabase.from("tecnicos").select("id, nome").then(({ data }) => setTecnicos(data || []));
  }, []);

  const handleCreate = async () => {
    if (!tipo) { toast({ title: "Selecione o tipo de serviço", variant: "destructive" }); return; }

    const { error } = await supabase.from("ordens_servico").insert({
      codigo: "",
      tipo: tipo as any,
      empresa_id: empresaId || null,
      veiculo_id: veiculoId || null,
      tecnico_id: tecnicoId || null,
      defeito_relatado: defeitoRelatado || null,
      observacoes: observacoes || null,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: "Erro ao criar OS", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "OS criada com sucesso!" });
      setDialogOpen(false);
      setTipo(""); setEmpresaId(""); setVeiculoId(""); setTecnicoId("");
      setDefeitoRelatado(""); setObservacoes("");
      fetchOS();
    }
  };

  const filtered = osList.filter(
    (os) =>
      os.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      (os.empresas as any)?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      (os.veiculos as any)?.placa?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ordens de Serviço</h1>
          <p className="text-muted-foreground text-sm">Gerencie todas as ordens de serviço</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova OS</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Ordem de Serviço</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Tipo de Serviço *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacao">Instalação</SelectItem>
                    <SelectItem value="retirada">Retirada</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="reinstalacao">Reinstalação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Veículo</Label>
                <Select value={veiculoId} onValueChange={setVeiculoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {veiculos.map((v) => <SelectItem key={v.id} value={v.id}>{v.placa} - {v.modelo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Técnico</Label>
                <Select value={tecnicoId} onValueChange={setTecnicoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {tecnicos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Defeito Relatado</Label>
                <Textarea value={defeitoRelatado} onChange={(e) => setDefeitoRelatado(e.target.value)} placeholder="Descreva o problema..." />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações adicionais..." />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Ordem de Serviço</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por código, empresa ou veículo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
        ) : filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 font-medium text-muted-foreground">Código</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Empresa</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Veículo</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Técnico</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((os) => (
                  <tr key={os.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-primary font-medium">{os.codigo}</td>
                    <td className="p-3 text-foreground">{tipoLabels[os.tipo] || os.tipo}</td>
                    <td className="p-3 text-foreground">{(os.empresas as any)?.nome || "-"}</td>
                    <td className="p-3 font-mono text-xs text-foreground">{(os.veiculos as any)?.placa || "-"}</td>
                    <td className="p-3 text-foreground">{(os.tecnicos as any)?.nome || "-"}</td>
                    <td className="p-3"><Badge variant="outline" className={statusStyles[os.status]}>{statusLabels[os.status]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma OS encontrada. Clique em "Nova OS" para começar.</p>
        )}
      </div>
    </div>
  );
};

export default OrdensServico;
