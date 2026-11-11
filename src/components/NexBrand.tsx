import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Download,
  WifiOff,
  CheckCircle2,
  X,
  Eye,
  Sparkles,
} from 'lucide-react';

export const NexLogo: React.FC<{
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}> = ({ subtitle, size = 'md', onClick }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 text-left group focus:outline-none"
      aria-label="NexCarga Início"
    >
      <div
        className={`${iconSize} rounded-lg bg-[#1A1D22] border border-white/10 flex items-center justify-center shadow-inner shrink-0`}
      >
        <svg viewBox="0 0 64 64" className="w-4/5 h-4/5" fill="none">
          <defs>
            <linearGradient id="nexLogoGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FF8A00" />
              <stop offset="100%" stopColor="#E85D04" />
            </linearGradient>
          </defs>
          <path
            d="M10 50L19 14H30L40 36L45 14H55L46 50H35L25 28L20 50H10Z"
            fill="url(#nexLogoGrad)"
          />
        </svg>
      </div>
      <div className="leading-none">
        <span className={`${textSize} font-bold tracking-tight text-white font-display block whitespace-nowrap`}>
          NexCarga
        </span>
        {subtitle && (
          <span className="text-xs font-semibold text-[#FF8A00] tracking-wide block mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </button>
  );
};

export interface AssistedSessionInfo {
  id: string;
  adminName: string;
  targetUserId: string;
  targetUserName: string;
  targetRole: 'DRIVER' | 'COMPANY' | 'AFFILIATE';
  justification: string;
  startedAtIso: string;
  expiresAtIso: string;
  active: boolean;
}

export const AssistedSessionBanner: React.FC<{
  session: AssistedSessionInfo | null;
  onEndSession: () => void;
}> = ({ session, onEndSession }) => {
  if (!session || !session.active) return null;

  return (
    <div
      role="region"
      aria-label="Alerta de Sessão de Acesso Assistido"
      className="bg-gradient-to-r from-[#E85D04] via-[#FF8A00] to-[#E85D04] text-[#111111] px-4 py-2 text-xs md:text-sm font-medium flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-lg border-b border-black/20"
    >
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0 text-[#111111]" />
        <span>
          <strong>ACESSO ADMINISTRATIVO ASSISTIDO ATIVO</strong> · Sessão{' '}
          <span className="font-mono font-bold">{session.id}</span> · Conta:{' '}
          <strong>{session.targetUserName}</strong> · Motivo: &ldquo;{session.justification}&rdquo; ·{' '}
          <span className="underline">Todas as ações estão sendo auditadas</span>
        </span>
      </div>
      <button
        type="button"
        onClick={onEndSession}
        className="px-3 py-1 rounded bg-[#111111] text-white text-xs font-semibold hover:bg-[#292929] transition-colors whitespace-nowrap shrink-0"
      >
        Encerrar Acesso Assistido
      </button>
    </div>
  );
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAStatusAndInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker opcional no preview
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#E85D04] px-3.5 py-2 text-xs font-semibold text-white shadow-xl">
          <WifiOff className="w-4 h-4" />
          <span>Modo Offline — Dados em cache local ativos</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#292929] hover:bg-[#363636] border border-white/10 text-xs font-medium text-white transition-colors whitespace-nowrap shrink-0"
        title="Instalar Aplicativo PWA NexCarga"
      >
        <Download className="w-3.5 h-3.5 text-[#FF8A00]" />
        <span>Instalar App</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl bg-[#181A1E] border border-white/15 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#FF8A00]" />
                <h3 className="text-base font-bold text-white">Instalar NexCarga (PWA)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Fechar modal de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              A plataforma <strong>NexCarga</strong> possui suporte nativo PWA com Manifesto e Service Worker ativos para Desktop, Android e iPhone/iPad:
            </p>
            <ul className="text-xs text-gray-300 space-y-2 mb-5 bg-[#111111] p-3.5 rounded-lg border border-white/10">
              <li>• <strong>Chrome / Edge (Desktop e Android)</strong>: Clique no ícone de instalação na barra de endereço ou no menu &ldquo;Instalar aplicativo&rdquo;.</li>
              <li>• <strong>Safari (iPhone / iPad)</strong>: Toque em <strong>Compartilhar</strong> e selecione <strong>Adicionar à Tela de Início</strong>.</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#FF8A00] to-[#E85D04] text-white text-xs font-bold hover:opacity-95 transition-opacity"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const ReferencePreviewModal: React.FC<{
  title: string;
  imageUrl: string;
  onClose: () => void;
}> = ({ title, imageUrl, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-xl bg-[#181A1E] border border-white/15 p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#FF8A00]" />
            <h3 className="text-sm font-bold text-white">
              Referência Visual Oficial Anexada — {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-[#292929] text-gray-300 hover:text-white"
            aria-label="Fechar referência visual"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="rounded-lg overflow-hidden border border-white/10 bg-[#111111]">
          <img
            src={imageUrl}
            alt={`Referência oficial ${title}`}
            className="w-full h-auto max-h-[72vh] object-contain mx-auto"
          />
        </div>
      </div>
    </div>
  );
};

export const DemoModeNotice: React.FC<{
  activeRoleLabel: string;
  hasActiveSub: boolean;
  onToggleSub: () => void;
  onOpenReference: () => void;
}> = ({ activeRoleLabel, hasActiveSub, onToggleSub, onOpenReference }) => {
  return (
    <div className="bg-[#16181D] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-[#FF8A00]/15 text-[#FF8A00] font-semibold border border-[#FF8A00]/30">
          Ambiente Demonstrativo Auditável
        </span>
        <span>
          Perfil ativo: <strong className="text-white">{activeRoleLabel}</strong> · Operação inicial: <strong>Manhuaçu-MG e Região</strong>
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSub}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
            hasActiveSub
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-[#292929] border-white/10 text-gray-300 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span>{hasActiveSub ? 'Plano: Assinante Com NexIA' : 'Plano: Gratuito (NexPoint 3/24h)'}</span>
        </button>
        <button
          type="button"
          onClick={onOpenReference}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#292929] hover:bg-[#383838] text-gray-200 border border-white/10 transition-colors"
        >
          <Eye className="w-3.5 h-3.5 text-[#FF8A00]" />
          <span>Ver Arte Oficial da Tela</span>
        </button>
      </div>
    </div>
  );
};
