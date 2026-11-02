/**
 * Utilitário de Compartilhamento e Download de Backups do Gelatio.
 * Suporta a Web Share API Level 2 (Android, iOS) com fallback amigável para Desktop.
 */

export interface ShareBackupResult {
  success: boolean;
  method: 'native' | 'menu_desktop' | 'cancelled';
  message: string;
}

/**
 * Dispara o download tradicional de um Blob no navegador.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Verifica se o navegador atual suporta compartilhamento nativo de arquivos.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) {
    return false;
  }
  try {
    const testFile = new File(['{}'], 'test.json', { type: 'application/json' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Compartilha o arquivo de backup nativamente (WhatsApp, Drive, Email no Mobile)
 * ou orienta a abertura do menu de opções no Desktop sem forçar download redundante.
 */
export async function shareOrDownloadBackup(
  jsonContent: string,
  filename: string
): Promise<ShareBackupResult> {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });

  // 1. Tenta compartilhamento nativo de arquivos (Android/iOS onde suportado)
  if (canShareFiles()) {
    try {
      await navigator.share({
        files: [file],
        title: 'Backup Gelatio',
        text: 'Backup completo do catálogo de gelatos, insumos, pré-preparos e precificação.'
      });
      return {
        success: true,
        method: 'native',
        message: 'Backup compartilhado com sucesso!'
      };
    } catch (err: unknown) {
      const error = err as Error;
      if (error && error.name === 'AbortError') {
        return {
          success: false,
          method: 'cancelled',
          message: 'Compartilhamento cancelado.'
        };
      }
      console.warn('Erro ao compartilhar nativamente, usando menu desktop:', err);
    }
  }

  // 2. No Desktop (Windows/Mac/Linux): não faz download forçado, abre o menu de compartilhamento
  return {
    success: true,
    method: 'menu_desktop',
    message: 'Escolha uma opção de compartilhamento abaixo.'
  };
}

export const shareOrPrepareBackup = shareOrDownloadBackup;
