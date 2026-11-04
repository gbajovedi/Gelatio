import React, { useState, useRef, useEffect } from 'react';
import { db } from '../../db/database';
import {
  Download,
  Upload,
  RotateCcw,
  X,
  CheckCircle,
  AlertTriangle,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Mail,
  MessageCircle,
  UploadCloud,
  FileJson,
  Layers,
  Sparkles
} from 'lucide-react';
import { shareOrDownloadBackup, downloadBlob } from '../../core/backupShare';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [cachedJson, setCachedJson] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [counts, setCounts] = useState<{ recipes: number; ingredients: number; preps: number }>({
    recipes: 0,
    ingredients: 0,
    preps: 0
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega a contagem atual de itens no banco para exibir no resumo
  useEffect(() => {
    if (isOpen) {
      db.recipes.count().then(recipes => {
        db.ingredients.count().then(ingredients => {
          db.preparations.count().then(preps => {
            setCounts({ recipes, ingredients, preps });
          });
        });
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Export full JSON (Direct Download)
  const handleExport = async () => {
    try {
      setLoading(true);
      setShowShareMenu(false);
      const json = await db.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlob(blob, `gelato_backup_${dateStr}.json`);
      setStatusMessage({
        text: 'Backup exportado com sucesso! Arquivo .JSON salvo na sua pasta de Downloads.',
        type: 'success'
      });
    } catch (err) {
      setStatusMessage({ text: 'Erro ao exportar backup: ' + err, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Share full JSON (Native Share Sheet on Mobile or Share Menu on Desktop)
  const handleShare = async () => {
    try {
      setLoading(true);
      setShowShareMenu(false);
      const json = await db.exportFullBackup();
      setCachedJson(json);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `gelato_backup_${dateStr}.json`;
      const result = await shareOrDownloadBackup(json, filename);

      if (result.method === 'cancelled') {
        return;
      }

      if (result.method === 'native') {
        setStatusMessage({
          text: 'Backup compartilhado com sucesso!',
          type: 'success'
        });
      } else if (result.method === 'menu_desktop') {
        setShowShareMenu(true);
      }
    } catch (err) {
      setStatusMessage({ text: 'Erro ao compartilhar backup: ' + err, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Process imported JSON file
  const processFile = async (file: File) => {
    try {
      setLoading(true);
      setStatusMessage(null);
      const text = await file.text();
      const result = await db.importBackup(text, importMode);
      const extras: string[] = [];
      if (result.pricingImported) extras.push('parâmetros de precificação');
      if (result.customStylesImported) extras.push('balanceamentos e metas personalizadas');
      if (result.stockImported) extras.push('estoque e histórico de vendas');
      if (result.themeImported) extras.push('preferência de tema');
      const extraMsg = extras.length > 0 ? ` (incluindo ${extras.join(', ')})` : '';

      setStatusMessage({
        text: `Importação concluída com sucesso! ${result.recipesCount} receitas e ${result.ingredientsCount} insumos carregados${extraMsg}.`,
        type: 'success'
      });
      onDataChanged();
      // Atualiza os contadores locais
      db.recipes.count().then(recipes => {
        db.ingredients.count().then(ingredients => {
          db.preparations.count().then(preps => {
            setCounts({ recipes, ingredients, preps });
          });
        });
      });
    } catch (err) {
      setStatusMessage({ text: 'Erro ao importar arquivo: ' + err, type: 'error' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // File input change
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  // Restore factory defaults
  const handleRestoreFactory = async () => {
    if (
      confirm(
        'Tem certeza que deseja restaurar os dados de fábrica? Todas as receitas personalizadas, custos editados e parâmetros de precificação serão restaurados para a versão inicial da planilha.'
      )
    ) {
      try {
        setLoading(true);
        await db.restoreFactoryDefaults();
        setStatusMessage({
          text: 'Banco restaurado com sucesso para as 177 receitas, 190 insumos e parâmetros de precificação originais da planilha!',
          type: 'success'
        });
        onDataChanged();
      } catch (err) {
        setStatusMessage({ text: 'Erro ao restaurar: ' + err, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-modal-title"
        className="bg-slate-900 border border-slate-700/90 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Botão de Fechar */}
        <button
          onClick={() => {
            setShowShareMenu(false);
            setStatusMessage(null);
            onClose();
          }}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fechar"
          aria-label="Fechar diálogo de backup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 shrink-0">
            💾
          </div>
          <div>
            <h3 id="backup-modal-title" className="text-lg sm:text-xl font-black text-white tracking-tight">
              Gerenciador de Backup
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Exporte seus dados com segurança para salvar offline ou restaure em qualquer dispositivo.
            </p>
          </div>
        </div>

        {/* Barra de Abas Superiores (Tabs) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Exportar & Compartilhar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setStatusMessage(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Importar & Restaurar</span>
          </button>
        </div>

        {/* Mensagem de Feedback de Status */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* ================= ABA 1: EXPORTAR & COMPARTILHAR ================= */}
        {activeTab === 'export' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-md">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>Exportar Backup Completo</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    .JSON
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Gera um único arquivo universal contendo 100% da sua base de dados para proteção contra perdas ou transferência para outro celular/computador.
                </p>
              </div>

              {/* Inventário do que está incluso com dados reais */}
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Conteúdo Incluso no Arquivo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">🍨</span>
                    <div>
                      <span className="font-bold text-white block leading-tight font-mono">
                        {counts.recipes > 0 ? counts.recipes : '150+'} receitas
                      </span>
                      <span className="text-[10px] text-slate-400">Catálogo ativo</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">🧪</span>
                    <div>
                      <span className="font-bold text-white block leading-tight font-mono">
                        {counts.ingredients > 0 ? counts.ingredients : '190+'} insumos
                      </span>
                      <span className="text-[10px] text-slate-400">Custos e bromatologia</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">👨‍🍳</span>
                    <div>
                      <span className="font-bold text-white block leading-tight font-mono">
                        {counts.preps > 0 ? counts.preps : '15+'} pré-preparos
                      </span>
                      <span className="text-[10px] text-slate-400">Pastas & variegatos</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">💰</span>
                    <div>
                      <span className="font-bold text-amber-300 block leading-tight font-mono">
                        Custos Fixos
                      </span>
                      <span className="text-[10px] text-slate-400">5 grupos & rateio</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">💳</span>
                    <div>
                      <span className="font-bold text-cyan-300 block leading-tight font-mono">
                        Taxas Maquininha
                      </span>
                      <span className="text-[10px] text-slate-400">Mix de vendas e cartões</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <div>
                      <span className="font-bold text-purple-300 block leading-tight font-mono">
                        Metas de Estilo
                      </span>
                      <span className="text-[10px] text-slate-400">Balanceamento custom</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação Principais (Lado a Lado, bem distribuídos) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleExport}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
                  title="Baixar arquivo JSON diretamente para o seu dispositivo"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Baixar Arquivo (.JSON)</span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleShare}
                  className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
                  title="Compartilhar via WhatsApp, E-mail ou aplicativos do sistema"
                >
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>Compartilhar</span>
                </button>
              </div>

              {/* Menu de Opções de Compartilhamento no Desktop */}
              {showShareMenu && (
                <div className="mt-3 p-4 bg-slate-900 border border-amber-500/35 rounded-2xl space-y-3.5 shadow-xl animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-amber-400" />
                      <span className="text-xs sm:text-sm font-bold text-white">
                        Opções de Envio e Compartilhamento
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowShareMenu(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Fechar opções"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* 1. WhatsApp Web */}
                    <a
                      href="https://web.whatsapp.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex flex-col items-start gap-1 transition-all group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          WhatsApp Web
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400 opacity-60 group-hover:opacity-100" />
                      </div>
                      <span className="text-[11px] text-slate-400 leading-tight">
                        Abra o WhatsApp Web para enviar para um contato
                      </span>
                    </a>

                    {/* 2. Copiar Dados do JSON */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const json = cachedJson || await db.exportFullBackup();
                          await navigator.clipboard.writeText(json);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl flex flex-col items-start gap-1 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                          {copied ? 'Copiado!' : 'Copiar Dados JSON'}
                        </span>
                        <span className="text-[10px] text-cyan-400/70 font-mono">100%</span>
                      </div>
                      <span className="text-[11px] text-slate-400 leading-tight">
                        {copied ? 'Copiado para a área de transferência!' : 'Copia o texto do backup para colar onde desejar'}
                      </span>
                    </button>

                    {/* 3. Enviar por E-mail */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent('Backup Gelatio - ' + new Date().toLocaleDateString('pt-BR'))}&body=${encodeURIComponent('Segue em anexo o arquivo de backup do Gelatio gerado hoje.\n\nPara restaurar, abra o Gelatio, clique em Importar Backup e selecione o arquivo .json baixado.')}`}
                      className="p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl flex flex-col items-start gap-1 transition-all group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-purple-400" />
                          Enviar por E-mail
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-purple-400 opacity-60 group-hover:opacity-100" />
                      </div>
                      <span className="text-[11px] text-slate-400 leading-tight">
                        Abre seu e-mail padrão com modelo pronto
                      </span>
                    </a>
                  </div>

                  {/* Dica amigável sobre o anexo de arquivo no Desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>
                      💡 <strong>Como anexar no Desktop:</strong> Baixe o arquivo pelo botão <em>"Baixar Arquivo (.JSON)"</em> e arraste-o para a conversa do WhatsApp ou e-mail.
                    </span>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="text-amber-400 hover:text-amber-300 font-bold underline whitespace-nowrap self-start sm:self-auto cursor-pointer"
                    >
                      Baixar arquivo agora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= ABA 2: IMPORTAR & RESTAURAR ================= */}
        {activeTab === 'import' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Card de Importação */}
            <div className="bg-slate-850 p-4 sm:p-5 rounded-2xl border border-slate-700/80 space-y-4 shadow-md">
              <div>
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <span>Carregar Arquivo de Backup</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    Restauração
                  </span>
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Carregue um arquivo <code className="font-mono text-amber-300 font-bold">.JSON</code> para restaurar receitas, insumos, custos, precificação e balanceamentos personalizados.
                </p>
              </div>

              {/* Seletor Moderno de Modo de Importação (Segmented Cards) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Escolha o Modo de Importação:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setImportMode('merge')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'merge'
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-amber-300">
                        <span>🔄</span>
                        <span>Mesclar Dados</span>
                      </span>
                      {importMode === 'merge' && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                      Preserva as receitas e custos atuais e adiciona os novos itens do arquivo.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      importMode === 'replace'
                        ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-750'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs flex items-center gap-1.5 text-rose-300">
                        <span>⚠️</span>
                        <span>Substituir Tudo</span>
                      </span>
                      {importMode === 'replace' && <span className="w-2 h-2 rounded-full bg-rose-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">
                      Apaga os dados atuais e substitui integralmente pelo conteúdo do backup.
                    </p>
                  </button>
                </div>
              </div>

              {/* Input file invisível */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Dropzone Drag & Drop Moderna */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-400 bg-amber-500/15 scale-[1.01]'
                    : 'border-slate-700 hover:border-slate-500 bg-slate-950/50 hover:bg-slate-950/80'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/90 border border-slate-700 flex items-center justify-center text-amber-400 shadow-md">
                  <UploadCloud className="w-6 h-6 text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-bold text-white">
                    Clique para selecionar ou arraste o arquivo <span className="font-mono text-amber-300">.json</span> aqui
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Processamento local e instantâneo no seu navegador
                  </p>
                </div>
              </div>
            </div>

            {/* Zona de Segurança: Restaurar Padrões de Fábrica */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Restaurar Biblioteca Original de Fábrica</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Retorna o banco aos 177 gelatos, 190 insumos e parâmetros de precificação originais da planilha.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleRestoreFactory}
                className="px-3.5 py-2 border border-slate-700 hover:border-rose-500/50 bg-slate-800/80 hover:bg-rose-500/10 text-slate-300 hover:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Fábrica</span>
              </button>
            </div>
          </div>
        )}

        {/* Rodapé do Modal */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
