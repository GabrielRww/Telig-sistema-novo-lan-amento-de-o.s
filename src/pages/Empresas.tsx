import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Empresas = () => {
  const [search, setSearch] = useState("");
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contato, setContato] = useState("");
  const { toast } = useToast();

  // Veículos dialog
  const [veiculosDialogOpen, setVeiculosDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [empresaVeiculos, setEmpresaVeiculos] = useState<any[]>([]);

  const fetchEmpresas = async () => {
    const { data } = await supabase.from("empresas").select("*, veiculos(id)").order("created_at", { ascending: false });
    setEmpresas(data || []);
  };
  useEffect(() => { fetchEmpresas(); }, []);

  const handleCreate = async () => {
    if (!nome) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const { error } = await supabase.from("empresas").insert({ nome, cnpj: cnpj || null, contato: contato || null });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Empresa cadastrada!" }); setDialogOpen(false); setNome(""); setCnpj(""); setContato(""); fetchEmpresas(); }
  };

  const openVeiculosDialog = async (empresa: any) => {
    setSelectedEmpresa(empresa);
    const { data } = await supabase.from("veiculos").select("id, placa, modelo").eq("empresa_id", empresa.id).order("placa");
    setEmpresaVeiculos(data || []);
    setVeiculosDialogOpen(true);
  };

  const filtered = empresas.filter((e) => e.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground text-sm">Cadastro de empresas clientes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Empresa</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da empresa" /></div>
              <div className="space-y-2"><Label>CNPJ</Label><Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
              <div className="space-y-2"><Label>Contato</Label><Input value={contato} onChange={(e) => setContato(e.target.value)} placeholder="(00) 0000-0000" /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? filtered.map((e) => (
          <div key={e.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{e.nome}</h3>
                <p className="text-xs text-muted-foreground font-mono">{e.cnpj || "Sem CNPJ"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{e.contato || "Sem contato"}</span>
              <button
                onClick={() => openVeiculosDialog(e)}
                className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full hover:bg-secondary/80 transition-colors cursor-pointer"
              >
                {(e.veiculos as any[])?.length || 0} veículos
              </button>
            </div>
          </div>
        )) : (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Nenhuma empresa cadastrada.</p>
        )}
      </div>

      {/* Veículos da empresa dialog */}
      <Dialog open={veiculosDialogOpen} onOpenChange={setVeiculosDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Veículos — {selectedEmpresa?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {empresaVeiculos.length > 0 ? empresaVeiculos.map((v) => (
              <div key={v.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                <span className="font-mono font-bold text-foreground">{v.placa}</span>
                <span className="text-xs text-muted-foreground">{v.modelo || "—"}</span>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum veículo vinculado.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Empresas;
