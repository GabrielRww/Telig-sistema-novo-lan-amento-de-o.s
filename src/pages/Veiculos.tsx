import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Cpu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const Veiculos = () => {
  const [search, setSearch] = useState("");
  const [veiculos, setVeiculos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const { toast } = useToast();

  // Equipment dialog state
  const [equipDialogOpen, setEquipDialogOpen] = useState(false);
  const [selectedVeiculo, setSelectedVeiculo] = useState<any>(null);
  const [veiculoEquipamentos, setVeiculoEquipamentos] = useState<any[]>([]);
  const [availableEquipamentos, setAvailableEquipamentos] = useState<any[]>([]);
  const [selectedEquipId, setSelectedEquipId] = useState("");

  const fetchVeiculos = async () => {
    const { data } = await supabase.from("veiculos").select("*, empresas(nome), equipamentos(id, numero_serie, modelo, status)").order("created_at", { ascending: false });
    setVeiculos(data || []);
  };

  useEffect(() => {
    fetchVeiculos();
    supabase.from("empresas").select("id, nome").then(({ data }) => setEmpresas(data || []));
  }, []);

  const handleCreate = async () => {
    if (!placa) { toast({ title: "Informe a placa", variant: "destructive" }); return; }
    const { error } = await supabase.from("veiculos").insert({ placa: placa.toUpperCase(), modelo, empresa_id: empresaId || null });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Veículo cadastrado!" }); setDialogOpen(false); setPlaca(""); setModelo(""); setEmpresaId(""); fetchVeiculos(); }
  };

  const openEquipDialog = async (veiculo: any) => {
    setSelectedVeiculo(veiculo);
    setVeiculoEquipamentos(veiculo.equipamentos || []);
    // Fetch available (unlinked) equipamentos
    const { data } = await supabase.from("equipamentos").select("id, numero_serie, modelo").is("veiculo_id", null);
    setAvailableEquipamentos(data || []);
    setSelectedEquipId("");
    setEquipDialogOpen(true);
  };

  const handleLinkEquip = async () => {
    if (!selectedEquipId || !selectedVeiculo) return;
    const { error } = await supabase.from("equipamentos").update({ veiculo_id: selectedVeiculo.id, status: "ativo" as any }).eq("id", selectedEquipId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Equipamento vinculado!" });
    // Refresh
    await fetchVeiculos();
    const { data: updated } = await supabase.from("equipamentos").select("id, numero_serie, modelo, status").eq("veiculo_id", selectedVeiculo.id);
    setVeiculoEquipamentos(updated || []);
    const { data: avail } = await supabase.from("equipamentos").select("id, numero_serie, modelo").is("veiculo_id", null);
    setAvailableEquipamentos(avail || []);
    setSelectedEquipId("");
  };

  const handleUnlinkEquip = async (equipId: string) => {
    const { error } = await supabase.from("equipamentos").update({ veiculo_id: null, status: "disponivel" as any }).eq("id", equipId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Equipamento desvinculado!" });
    await fetchVeiculos();
    const { data: updated } = await supabase.from("equipamentos").select("id, numero_serie, modelo, status").eq("veiculo_id", selectedVeiculo.id);
    setVeiculoEquipamentos(updated || []);
    const { data: avail } = await supabase.from("equipamentos").select("id, numero_serie, modelo").is("veiculo_id", null);
    setAvailableEquipamentos(avail || []);
  };

  const filtered = veiculos.filter((v) => v.placa.toLowerCase().includes(search.toLowerCase()) || v.modelo?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Veículos</h1>
          <p className="text-muted-foreground text-sm">Cadastro e histórico de veículos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Veículo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Veículo</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Placa *</Label><Input value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="ABC-1234" /></div>
              <div className="space-y-2"><Label>Modelo</Label><Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Ex: Fiat Strada" /></div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por placa ou modelo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 ? filtered.map((v) => (
          <div key={v.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-lg font-bold text-foreground">{v.placa}</span>
              <button
                onClick={() => openEquipDialog(v)}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium hover:bg-primary/20 transition-colors cursor-pointer"
              >
                <Cpu className="w-3 h-3 inline mr-1" />
                {(v.equipamentos as any[])?.length || 0} equip.
              </button>
            </div>
            <p className="text-sm text-foreground">{v.modelo || "Sem modelo"}</p>
            <p className="text-xs text-muted-foreground mt-1">{(v.empresas as any)?.nome || "Sem empresa"}</p>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhum veículo cadastrado.</p>
        )}
      </div>

      {/* Equipment Dialog */}
      <Dialog open={equipDialogOpen} onOpenChange={setEquipDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Equipamentos — {selectedVeiculo?.placa}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Linked equipamentos */}
            {veiculoEquipamentos.length > 0 ? (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Vinculados</Label>
                {veiculoEquipamentos.map((eq: any) => (
                  <div key={eq.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{eq.modelo}</p>
                      <p className="text-xs text-muted-foreground font-mono">{eq.numero_serie}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{eq.status}</Badge>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 px-2 text-xs" onClick={() => handleUnlinkEquip(eq.id)}>
                        Desvincular
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum equipamento vinculado.</p>
            )}

            {/* Add equipment */}
            {availableEquipamentos.length > 0 && (
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Vincular novo equipamento</Label>
                <div className="flex gap-2">
                  <Select value={selectedEquipId} onValueChange={setSelectedEquipId}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um equipamento..." /></SelectTrigger>
                    <SelectContent>
                      {availableEquipamentos.map((eq) => (
                        <SelectItem key={eq.id} value={eq.id}>{eq.modelo} — {eq.numero_serie}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={handleLinkEquip} disabled={!selectedEquipId} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {availableEquipamentos.length === 0 && veiculoEquipamentos.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">Não há equipamentos disponíveis para vincular.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Veiculos;
