import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusStyles: Record<string, string> = {
  ativo: "bg-success/10 text-success border-success/20",
  disponivel: "bg-info/10 text-info border-info/20",
  em_manutencao: "bg-warning/10 text-warning border-warning/20",
  retirado: "bg-muted text-muted-foreground border-border",
  reinstalado: "bg-primary/10 text-primary border-primary/20",
};
const statusLabels: Record<string, string> = {
  ativo: "Ativo", disponivel: "Disponível", em_manutencao: "Em manutenção", retirado: "Retirado", reinstalado: "Reinstalado",
};

const Equipamentos = () => {
  const [search, setSearch] = useState("");
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [serial, setSerial] = useState("");
  const [modelo, setModelo] = useState("");
  const { toast } = useToast();

  const fetch = async () => {
    const { data } = await supabase.from("equipamentos").select("*, empresas(nome), veiculos(placa)").order("created_at", { ascending: false });
    setEquipamentos(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!serial || !modelo) { toast({ title: "Preencha serial e modelo", variant: "destructive" }); return; }
    const { error } = await supabase.from("equipamentos").insert({ numero_serie: serial, modelo });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Equipamento cadastrado!" }); setDialogOpen(false); setSerial(""); setModelo(""); fetch(); }
  };

  const filtered = equipamentos.filter((eq) => eq.numero_serie.toLowerCase().includes(search.toLowerCase()) || eq.modelo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipamentos</h1>
          <p className="text-muted-foreground text-sm">Cadastro e controle de equipamentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Equipamento</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Equipamento</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Número de Série *</Label><Input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Ex: RAT-4G-001" /></div>
              <div className="space-y-2"><Label>Modelo *</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Rastreador 4G" /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por serial ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                <th className="text-left p-3 font-medium text-muted-foreground">Serial</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Modelo</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Veículo</th>
              </tr></thead>
              <tbody>
                {filtered.map((eq) => (
                  <tr key={eq.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-mono text-xs text-primary font-medium">{eq.numero_serie}</td>
                    <td className="p-3 text-foreground">{eq.modelo}</td>
                    <td className="p-3"><Badge variant="outline" className={statusStyles[eq.status]}>{statusLabels[eq.status]}</Badge></td>
                    <td className="p-3 text-foreground">{(eq.empresas as any)?.nome || "-"}</td>
                    <td className="p-3 font-mono text-xs text-foreground">{(eq.veiculos as any)?.placa || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum equipamento cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default Equipamentos;
