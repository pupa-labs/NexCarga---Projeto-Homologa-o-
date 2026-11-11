import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Truck,
  Building2,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  FileCheck2,
  Cpu,
  Radar,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { NexLogo, PWAStatusAndInstall } from './NexBrand';
import { BRAZILIAN_VEHICLE_CATALOG, BRAZILIAN_IMPLEMENT_CATALOG } from '../domain/catalog';
import heroTruckImg from '../assets/images/nexcarga_hero_truck_1794424523948.jpg';

export type ScreenId =
  | '01_LANDING'
  | '02_LOGIN'
  | '03_REGISTER'
  | '04_ADMIN'
  | '05_DRIVER'
  | '06_COMPANY'
  | '07_AFFILIATE'
  | '08_NEXRADAR'
  | '09_NEXCOLETA'
  | '10_CHAT'
  | '11_NEXIA'
  | '12_PLANS'
  | '13_NEXVERIFY'
  | '14_CONTRACTS'
  | '15_FINANCE'
  | '16_MOBILE_PWA';

interface PublicViewsProps {
  currentScreen: '01_LANDING' | '02_LOGIN' | '03_REGISTER';
  onNavigate: (screen: ScreenId) => void;
  onLoginAsRole: (role: 'ADMIN' | 'DRIVER' | 'COMPANY' | 'AFFILIATE') => void;
}

export const PublicViews: React.FC<PublicViewsProps> = ({
  currentScreen,
  onNavigate,
  onLoginAsRole,
}) => {
  // Estado do Login (02)
  const [loginEmail, setLoginEmail] = useState('carlos.motorista@nexcarga.com.br');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginFeedback, setLoginFeedback] = useState<string | null>(null);

  // Estado do Cadastro (03)
  const [selectedProfile, setSelectedProfile] = useState<'DRIVER' | 'COMPANY' | 'AFFILIATE' | null>(null);
  const [regName, setRegName] = useState('');
  const [regDoc, setRegDoc] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('Manhuaçu - MG');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginFeedback('Informe seu e-mail e senha para autenticar.');
      return;
    }
    const lower = loginEmail.toLowerCase();
    if (lower.includes('admin')) {
      onLoginAsRole('ADMIN');
    } else if (lower.includes('empresa') || lower.includes('xyz')) {
      onLoginAsRole('COMPANY');
    } else if (lower.includes('afiliado') || lower.includes('joao')) {
      onLoginAsRole('AFFILIATE');
    } else {
      onLoginAsRole('DRIVER');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!selectedProfile) return;
    if (!regName.trim() || !regDoc.trim() || !regEmail.trim()) {
      setRegError('Preencha nome/razão social, CPF/CNPJ e e-mail corporativo.');
      return;
    }
    setRegSuccess(
      `Conta de ${
        selectedProfile === 'DRIVER'
          ? 'Motorista'
          : selectedProfile === 'COMPANY'
          ? 'Empresa / Embarcador'
          : 'Afiliado Parceiro'
      } criada com sucesso para ${regName}! Redirecionando para o seu ambiente...`
    );
    setTimeout(() => {
      onLoginAsRole(selectedProfile);
    }, 900);
  };

  // ===========================================================================
  // TELA 01 — LANDING PAGE OFICIAL (01_Landing_Page.png)
  // ===========================================================================
  if (currentScreen === '01_LANDING') {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col">
        {/* Top Bar Oficial */}
        <header className="border-b border-white/10 bg-[#111111]/95 backdrop-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-8">
            <NexLogo onClick={() => onNavigate('01_LANDING')} />

            <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-300">
              <a href="#inicio" className="text-[#FF8A00] font-semibold whitespace-nowrap shrink-0">
                Início
              </a>
              <a href="#solucoes" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                Soluções
              </a>
              <button
                type="button"
                onClick={() => onNavigate('12_PLANS')}
                className="hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Planos
              </button>
              <a href="#catalogo" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                Sobre
              </a>
              <a href="#contato" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                Contato
              </a>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <PWAStatusAndInstall />
              <button
                type="button"
                onClick={() => onNavigate('02_LOGIN')}
                className="px-4 py-2 rounded-lg bg-[#1C1F24] hover:bg-[#292929] border border-white/15 text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => onNavigate('03_REGISTER')}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-sm font-bold text-white shadow-lg shadow-[#FF8A00]/20 transition-all whitespace-nowrap shrink-0"
              >
                Cadastrar
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section fiel à referência 01_Landing_Page.png */}
        <section id="inicio" className="relative overflow-hidden border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 space-y-6 z-10">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[#FF8A00]">
                <MapPin className="w-3.5 h-3.5" />
                <span>Polo Operacional Inicial: Manhuaçu - MG e Região · Expansão Nacional</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] font-display">
                Sua carga.
                <br />
                Nossa conexão.
              </h1>

              <p className="text-base sm:text-lg text-gray-300 max-w-xl leading-relaxed">
                A plataforma que conecta empresas, motoristas e oportunidades em todo o Brasil. Contratação simplificada, negociação protegida, coletas regionais agrupadas e inteligência logística.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('03_REGISTER')}
                  className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm sm:text-base shadow-xl shadow-[#FF8A00]/25 transition-all whitespace-nowrap"
                >
                  Cadastre-se grátis
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('12_PLANS')}
                  className="px-7 py-3.5 rounded-xl bg-[#181A1E] hover:bg-[#292929] border border-[#FF8A00]/60 text-white font-semibold text-sm sm:text-base transition-colors whitespace-nowrap"
                >
                  Conheça os planos
                </button>
              </div>

              {/* Atalhos diretos para inspeção imediata dos 4 ambientes */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400 mb-2.5">
                  Acesso rápido aos 4 ambientes independentes da plataforma:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('DRIVER')}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1D22] hover:bg-[#292929] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Painel Motorista</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('COMPANY')}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1D22] hover:bg-[#292929] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Painel Empresa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('AFFILIATE')}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1D22] hover:bg-[#292929] border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-[#FF8A00]" />
                    <span>Painel Afiliado</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('ADMIN')}
                    className="px-3 py-1.5 rounded-lg bg-[#1A1D22] hover:bg-[#292929] border border-[#FF8A00]/40 text-xs font-semibold text-[#FF8A00] flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>NexCarga Control (Admin)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Imagem Hero Oficial */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#181A1E]">
                <img
                  src={heroTruckImg}
                  alt="NexCarga — Sua carga. Nossa conexão."
                  className="w-full h-[360px] sm:h-[400px] object-cover object-right"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/70 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/80 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Barra Inferior de 4 Pilares da Referência 01_Landing_Page.png */}
          <div className="max-w-7xl mx-auto px-6 pb-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-[#17191E] border border-white/10 rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-white/10">
              <button
                type="button"
                onClick={() => onNavigate('08_NEXRADAR')}
                className="p-6 flex flex-col items-center text-center hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#292929] flex items-center justify-center mb-3 group-hover:bg-[#FF8A00]/20 transition-colors">
                  <Radar className="w-5 h-5 text-white group-hover:text-[#FF8A00]" />
                </div>
                <span className="text-sm font-bold text-white">Fretes em tempo real</span>
                <span className="text-xs text-gray-400 mt-1">NexRadar geolocalizado por raio e veículo</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('10_CHAT')}
                className="p-6 flex flex-col items-center text-center hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#292929] flex items-center justify-center mb-3 group-hover:bg-[#FF8A00]/20 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-white group-hover:text-[#FF8A00]" />
                </div>
                <span className="text-sm font-bold text-white">Negociação segura</span>
                <span className="text-xs text-gray-400 mt-1">Proteção de dados sensíveis pré-pagamento</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('14_CONTRACTS')}
                className="p-6 flex flex-col items-center text-center hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#292929] flex items-center justify-center mb-3 group-hover:bg-[#FF8A00]/20 transition-colors">
                  <FileCheck2 className="w-5 h-5 text-white group-hover:text-[#FF8A00]" />
                </div>
                <span className="text-sm font-bold text-white">Gestão de contratos</span>
                <span className="text-xs text-gray-400 mt-1">Fluxo auditado em 15 etapas operacionais</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('11_NEXIA')}
                className="p-6 flex flex-col items-center text-center hover:bg-white/[0.02] transition-colors group"
              >
                <div className="w-11 h-11 rounded-full bg-[#292929] flex items-center justify-center mb-3 group-hover:bg-[#FF8A00]/20 transition-colors">
                  <Cpu className="w-5 h-5 text-white group-hover:text-[#FF8A00]" />
                </div>
                <span className="text-sm font-bold text-white">IA logística</span>
                <span className="text-xs text-gray-400 mt-1">NexIA com análise de rotas, custos e cargas</span>
              </button>
            </div>
          </div>
        </section>

        {/* Seção de Módulos Diferenciais e Telas Oficiais */}
        <section id="solucoes" className="py-14 border-b border-white/10 bg-[#14161A]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-semibold text-[#FF8A00] tracking-wider uppercase">
                  Ecossistema Completo LogTech
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1 font-display">
                  Módulos Inteligentes e Ambientes Dedicados
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md">
                Clique em qualquer módulo abaixo para inspecionar e operar a interface correspondente em tempo real.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: '08_NEXRADAR' as ScreenId, num: '08', title: 'NexRadar — Radar de Fretes', desc: 'Mapa interativo com busca por raio, veículo, implemento e oportunidades em Manhuaçu-MG.' },
                { id: '09_NEXCOLETA' as ScreenId, num: '09', title: 'NexColeta — Coletas Regionais', desc: 'Agrupamento inteligente em Manhuaçu, Reduto, Ipanema e Mutum validado por capacidade.' },
                { id: '10_CHAT' as ScreenId, num: '10', title: 'Chat Pré e Pós-Pagamento', desc: 'Comunicação direta com bloqueio automático no backend de endereço e telefone pré-taxa.' },
                { id: '11_NEXIA' as ScreenId, num: '11', title: 'NexIA — Assistente Logístico', desc: 'Inteligência baseada em Gemini no servidor para estimar custos, rotas e descrever cargas.' },
                { id: '12_PLANS' as ScreenId, num: '12', title: 'Planos e Assinaturas', desc: 'Modalidades Sem NexIA e Com NexIA (Mensal, Trimestral, Anual) e 15 dias de teste gratuito.' },
                { id: '13_NEXVERIFY' as ScreenId, num: '13', title: 'NexVerify — Documentos', desc: 'Validação segura de CNH, CRLV, ANTT e Residência com emissão do Selo Verificado.' },
                { id: '14_CONTRACTS' as ScreenId, num: '14', title: 'Contratos (15 Etapas)', desc: 'Acompanhamento completo desde a publicação até entrega, comprovante e avaliação.' },
                { id: '15_FINANCE' as ScreenId, num: '15', title: 'NexFinance & Comissões', desc: 'Livro-razão contábil imutável, taxas de manutenção, saques e comissões de afiliados.' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className="text-left p-5 rounded-xl bg-[#181A1E] hover:bg-[#1F2228] border border-white/10 hover:border-[#FF8A00]/50 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-[#FF8A00]">MÓDULO {item.num}</span>
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-[#FF8A00] transition-colors" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1.5">{item.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Catálogo Oficial de Veículos e Implementos Brasileiros */}
        <section id="catalogo" className="py-14 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-white font-display mb-2">
              Catálogo Oficial de Veículos e Implementos Brasileiros
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mb-6">
              Homologado para toda a malha rodoviária nacional com 13 categorias de veículos e 17 tipos de carrocerias/implementos.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#181A1E] border border-white/10">
                <h3 className="text-sm font-bold text-[#FF8A00] mb-3">
                  13 Tipos de Veículos ({BRAZILIAN_VEHICLE_CATALOG.length} cadastrados)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {BRAZILIAN_VEHICLE_CATALOG.map((v) => (
                    <div key={v.id} className="p-2.5 rounded-lg bg-[#111111] border border-white/5 text-xs">
                      <div className="font-semibold text-white">{v.name}</div>
                      <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                        Até {(v.maxCapacityKg / 1000).toFixed(1)}t · {v.maxVolumeM3}m³ · {v.defaultAxles} eixos
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#181A1E] border border-white/10">
                <h3 className="text-sm font-bold text-[#FF8A00] mb-3">
                  17 Tipos de Implementos ({BRAZILIAN_IMPLEMENT_CATALOG.length} cadastrados)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {BRAZILIAN_IMPLEMENT_CATALOG.map((imp) => (
                    <div key={imp.id} className="p-2.5 rounded-lg bg-[#111111] border border-white/5 text-xs">
                      <div className="font-semibold text-white">{imp.name}</div>
                      <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                        {imp.bodyType} · {(imp.maxCapacityKg / 1000).toFixed(0)}t · {imp.maxVolumeM3}m³
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rodapé Institucional */}
        <footer id="contato" className="bg-[#0D0E11] py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-3">
              <NexLogo size="sm" />
              <span>· Sua carga. Nossa conexão.</span>
            </div>
            <div>
              Desenvolvido por <strong className="text-white">PUPA LABS</strong> · Operação Inicial: Manhuaçu - MG · SaaS B2B LogTech
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ===========================================================================
  // TELA 02 — LOGIN E ACESSO (02_Login_Acesso.png)
  // ===========================================================================
  if (currentScreen === '02_LOGIN') {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-between">
        <div className="max-w-6xl w-full mx-auto my-auto px-6 py-10">
          <div className="rounded-2xl overflow-hidden bg-[#16181D] border border-white/10 shadow-2xl grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
            {/* Coluna Esquerda: Formulário de Login idêntico a 02_Login_Acesso.png */}
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
              <div className="mb-8">
                <NexLogo onClick={() => onNavigate('01_LANDING')} />
              </div>

              <h1 className="text-3xl font-bold text-white font-display">Acesse sua conta</h1>
              <p className="text-sm text-gray-400 mt-1 mb-7">Entre na sua conta NexCarga</p>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="sr-only">
                    E-mail
                  </label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="E-mail"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FF8A00]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="sr-only">
                    Senha
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPass ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Senha"
                      className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#1E2127] border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#FF8A00]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 text-gray-400 hover:text-white"
                      aria-label="Mostrar ou ocultar senha"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/20 bg-[#1E2127] text-[#FF8A00] focus:ring-[#FF8A00]"
                    />
                    <span>Lembrar-me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setLoginFeedback('Link seguro de recuperação enviado para seu e-mail cadastrado.')
                    }
                    className="text-[#FF8A00] hover:underline font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                {loginFeedback && (
                  <div className="p-3 rounded-lg bg-[#FF8A00]/15 border border-[#FF8A00]/40 text-xs text-[#FF8A00]">
                    {loginFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#FF8A00]/25 transition-all mt-2"
                >
                  Entrar
                </button>
              </form>

              <p className="text-xs text-center text-gray-400 mt-6">
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('03_REGISTER')}
                  className="text-[#FF8A00] font-semibold hover:underline"
                >
                  Cadastre-se
                </button>
              </p>

              {/* Botões de acesso rápido por perfil */}
              <div className="mt-7 pt-5 border-t border-white/10">
                <p className="text-[11px] text-gray-400 mb-2">Autenticação rápida de demonstração por perfil:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('DRIVER')}
                    className="px-2.5 py-1.5 rounded bg-[#22252C] hover:bg-[#292929] text-xs font-medium text-white border border-white/10"
                  >
                    Motorista
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('COMPANY')}
                    className="px-2.5 py-1.5 rounded bg-[#22252C] hover:bg-[#292929] text-xs font-medium text-white border border-white/10"
                  >
                    Empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('AFFILIATE')}
                    className="px-2.5 py-1.5 rounded bg-[#22252C] hover:bg-[#292929] text-xs font-medium text-white border border-white/10"
                  >
                    Afiliado
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoginAsRole('ADMIN')}
                    className="px-2.5 py-1.5 rounded bg-[#FF8A00]/15 hover:bg-[#FF8A00]/25 text-xs font-semibold text-[#FF8A00] border border-[#FF8A00]/30"
                  >
                    Admin Control
                  </button>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Arte Oficial 02_Login_Acesso.png */}
            <div className="lg:col-span-6 relative bg-[#111111] flex items-center justify-center overflow-hidden">
              <img
                src={heroTruckImg}
                alt="Acesso NexCarga"
                className="w-full h-full object-cover object-right"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#16181D] via-[#16181D]/30 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-72 h-28 bg-gradient-to-tl from-[#FF8A00]/40 via-[#E85D04]/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TELA 03 — SELEÇÃO DE PERFIL E CADASTRO (03_Cadastro_Perfil.png)
  // ===========================================================================
  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col justify-center py-12 px-6">
      <div className="max-w-5xl w-full mx-auto bg-[#15171C] border border-white/10 rounded-2xl p-8 sm:p-12 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <NexLogo size="lg" onClick={() => onNavigate('01_LANDING')} />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mt-5 font-display">
            Crie sua conta
          </h1>
          <p className="text-sm text-gray-400 mt-1.5">Escolha o tipo de cadastro</p>
        </div>

        {/* 3 Cards de Perfil idênticos a 03_Cadastro_Perfil.png */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Sou Motorista */}
          <div
            onClick={() => setSelectedProfile('DRIVER')}
            className={`cursor-pointer rounded-2xl p-7 bg-[#1A1D23] border transition-all flex flex-col items-center text-center justify-between ${
              selectedProfile === 'DRIVER'
                ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/30'
                : 'border-[#FF8A00]/50 hover:border-[#FF8A00]'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 flex items-center justify-center mb-5">
                <Truck className="w-8 h-8 text-[#FF8A00]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sou Motorista</h2>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Encontre fretes, negocie e aumente seus ganhos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProfile('DRIVER')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A00]/20"
            >
              <span>Cadastrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Sou Empresa */}
          <div
            onClick={() => setSelectedProfile('COMPANY')}
            className={`cursor-pointer rounded-2xl p-7 bg-[#1A1D23] border transition-all flex flex-col items-center text-center justify-between ${
              selectedProfile === 'COMPANY'
                ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/30'
                : 'border-white/10 hover:border-[#FF8A00]/60'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 flex items-center justify-center mb-5">
                <Building2 className="w-8 h-8 text-[#FF8A00]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sou Empresa</h2>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Publique fretes, contrate transportes e gerencie suas operações.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProfile('COMPANY')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A00]/20"
            >
              <span>Cadastrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 3: Sou Afiliado */}
          <div
            onClick={() => setSelectedProfile('AFFILIATE')}
            className={`cursor-pointer rounded-2xl p-7 bg-[#1A1D23] border transition-all flex flex-col items-center text-center justify-between ${
              selectedProfile === 'AFFILIATE'
                ? 'border-[#FF8A00] ring-2 ring-[#FF8A00]/30'
                : 'border-white/10 hover:border-[#FF8A00]/60'
            }`}
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF8A00]/10 border border-[#FF8A00]/30 flex items-center justify-center mb-5">
                <Megaphone className="w-8 h-8 text-[#FF8A00]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sou Afiliado</h2>
              <p className="text-xs text-gray-300 leading-relaxed mb-6">
                Indique a NexCarga e ganhe comissões.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProfile('AFFILIATE')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#FF8A00]/20"
            >
              <span>Cadastrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formulário complementar de cadastro quando o perfil é selecionado */}
        {selectedProfile && (
          <form
            onSubmit={handleRegisterSubmit}
            className="mt-8 pt-8 border-t border-white/10 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#FF8A00]">
                Finalizar Cadastro —{' '}
                {selectedProfile === 'DRIVER'
                  ? 'Motorista Autônomo / Transportador'
                  : selectedProfile === 'COMPANY'
                  ? 'Empresa Embarcadora / Contratante'
                  : 'Parceiro Afiliado NexCarga'}
              </h3>
              <span className="text-xs text-gray-400">Polo inicial: Manhuaçu - MG</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  {selectedProfile === 'COMPANY' ? 'Razão Social / Nome Fantasia' : 'Nome Completo'}
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={selectedProfile === 'COMPANY' ? 'Ex: Café Real Ltda' : 'Ex: Carlos Eduardo Silva'}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2127] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">
                  {selectedProfile === 'COMPANY' ? 'CNPJ' : 'CPF / CNPJ'}
                </label>
                <input
                  type="text"
                  value={regDoc}
                  onChange={(e) => setRegDoc(e.target.value)}
                  placeholder={selectedProfile === 'COMPANY' ? '00.000.000/0001-00' : '000.000.000-00'}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2127] border border-white/10 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">E-mail de Acesso</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2127] border border-white/10 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-300 mb-1">Cidade / Base Operacional</label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Manhuaçu - MG"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#1E2127] border border-white/10 text-xs text-white"
                />
              </div>
            </div>

            {regError && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-xs text-red-300">
                {regError}
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{regSuccess}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('02_LOGIN')}
                className="px-4 py-2.5 rounded-lg bg-[#292929] text-xs font-semibold text-gray-200 hover:text-white"
              >
                Já tenho conta
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-xs font-bold text-white shadow-lg"
              >
                Concluir Cadastro e Acessar Painel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
