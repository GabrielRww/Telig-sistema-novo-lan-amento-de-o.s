-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'atendente', 'tecnico');

-- Create equipment_status enum
CREATE TYPE public.equipment_status AS ENUM ('disponivel', 'ativo', 'retirado', 'em_manutencao', 'reinstalado');

-- Create os_type enum
CREATE TYPE public.os_type AS ENUM ('instalacao', 'retirada', 'manutencao', 'reinstalacao');

-- Create os_status enum
CREATE TYPE public.os_status AS ENUM ('aberta', 'em_andamento', 'concluida', 'cancelada');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========================
-- PROFILES TABLE
-- ========================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  cargo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================
-- USER ROLES TABLE
-- ========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'atendente' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'atendente');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- ========================
-- CATEGORIAS DE TÉCNICOS
-- ========================
CREATE TABLE public.categorias_tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categorias_tecnicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view categorias" ON public.categorias_tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categorias" ON public.categorias_tecnicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- EMPRESAS TABLE
-- ========================
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  contato TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view empresas" ON public.empresas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and atendentes can manage empresas" ON public.empresas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- TÉCNICOS TABLE
-- ========================
CREATE TABLE public.tecnicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  empresa TEXT,
  categoria_id UUID REFERENCES public.categorias_tecnicos(id),
  telefone TEXT,
  status TEXT NOT NULL DEFAULT 'Disponível',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view tecnicos" ON public.tecnicos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tecnicos" ON public.tecnicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_tecnicos_updated_at BEFORE UPDATE ON public.tecnicos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- PRODUTOS TABLE
-- ========================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view produtos" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage produtos" ON public.produtos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========================
-- VEÍCULOS TABLE
-- ========================
CREATE TABLE public.veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT NOT NULL UNIQUE,
  modelo TEXT,
  empresa_id UUID REFERENCES public.empresas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view veiculos" ON public.veiculos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and atendentes can manage veiculos" ON public.veiculos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON public.veiculos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- EQUIPAMENTOS TABLE
-- ========================
CREATE TABLE public.equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_serie TEXT NOT NULL UNIQUE,
  modelo TEXT NOT NULL,
  produto_id UUID REFERENCES public.produtos(id),
  status equipment_status NOT NULL DEFAULT 'disponivel',
  empresa_id UUID REFERENCES public.empresas(id),
  veiculo_id UUID REFERENCES public.veiculos(id),
  data_instalacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view equipamentos" ON public.equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and atendentes can manage equipamentos" ON public.equipamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_equipamentos_updated_at BEFORE UPDATE ON public.equipamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- ORDENS DE SERVIÇO TABLE
-- ========================
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  tipo os_type NOT NULL,
  status os_status NOT NULL DEFAULT 'aberta',
  empresa_id UUID REFERENCES public.empresas(id),
  empresa_faturamento_id UUID REFERENCES public.empresas(id),
  tecnico_id UUID REFERENCES public.tecnicos(id),
  veiculo_id UUID REFERENCES public.veiculos(id),
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_realizacao TIMESTAMPTZ,
  defeito_relatado TEXT,
  defeito_constatado TEXT,
  observacoes TEXT,
  responsavel_local TEXT,
  cargo_responsavel TEXT,
  uf TEXT,
  cidade TEXT,
  endereco TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view OS" ON public.ordens_servico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and atendentes can manage OS" ON public.ordens_servico FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

CREATE TRIGGER update_ordens_servico_updated_at BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================
-- OS-EQUIPAMENTOS (junction)
-- ========================
CREATE TABLE public.os_equipamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  equipamento_id UUID NOT NULL REFERENCES public.equipamentos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.os_equipamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view os_equipamentos" ON public.os_equipamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins and atendentes can manage os_equipamentos" ON public.os_equipamentos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'atendente'));

-- ========================
-- AUDIT LOG
-- ========================
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- ========================
-- Generate OS codigo sequence
-- ========================
CREATE SEQUENCE IF NOT EXISTS os_codigo_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_os_codigo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.codigo := 'OS-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEXTVAL('os_codigo_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_os_codigo
  BEFORE INSERT ON public.ordens_servico
  FOR EACH ROW
  WHEN (NEW.codigo IS NULL OR NEW.codigo = '')
  EXECUTE FUNCTION public.generate_os_codigo();