import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const statusStyles: Record<string, string> = {
  "Disponível": "bg-success/10 text-success border-success/20",
  "Em atendimento": "bg-warning/10 text-warning border-warning/20",
};

const Tecnicos = () => {
  const [search, setSearch] = useState("");
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const { toast } = useToast();

  const fetchTecnicos = async () => {
    const { data } = await supabase.from("tecnicos").select("*").order("created_at", { ascending: false });
    setTecnicos(data || []);
  };
  useEffect(() => { fetchTecnicos(); }, []);

  const handleCreate = async () => {
    if (!nome) { toast({ title: "Informe o nome", variant: "destructive" }); return; }
    const { error } = await supabase.from("tecnicos").insert({ nome, empresa: empresa || null, telefone: telefone || null });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Técnico cadastrado!" }); setDialogOpen(false); setNome(""); setEmpresa(""); setTelefone(""); fetchTecnicos(); }
  };

  const filtered = tecnicos.filter((t) => t.nome.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Técnicos</h1>
          <p className="text-muted-foreground text-sm">Equipe técnica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Técnico</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Técnico</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2"><Label>Nome *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do técnico" /></div>
              <div className="space-y-2"><Label>Empresa</Label><Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Empresa" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" /></div>
              <Button onClick={handleCreate} className="w-full">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar técnico..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filtered.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-muted/30">
              <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Empresa</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
            </tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3 font-medium text-foreground">{t.nome}</td>
                  <td className="p-3 text-foreground">{t.empresa || "-"}</td>
                  <td className="p-3 text-foreground">{t.telefone || "-"}</td>
                  <td className="p-3"><Badge variant="outline" className={statusStyles[t.status] || ""}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum técnico cadastrado.</p>
        )}
      </div>
    </div>
  );
};

export default Tecnicos;
