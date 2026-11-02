/**
 * Utilitário de Compartilhamento e Download de Backups do Gelatio.
 * Suporta a Web Share API Level 2 (Android, iOS e Windows 10/11) com fallback inteligente.
 */

export interface ShareBackupResult {
  success: boolean;
  method: 'native' | 'download_with_whatsapp_prompt' | 'cancelled';
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
 * Compartilha o arquivo de backup nativamente (WhatsApp, Drive, Email, etc.)
 * ou executa o fallback de download com sugestão para o WhatsApp Web.
 */
export async function shareOrDownloadBackup(
  jsonContent: string,
  filename: string
): Promise<ShareBackupResult> {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const file = new File([blob], filename, { type: 'application/json' });

  // 1. Tenta compartilhamento nativo (Android, iOS, Windows 10/11 via Chromium)
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
      // Se o usuário simplesmente cancelou o diálogo de compartilhamento, não é erro
      if (error && error.name === 'AbortError') {
        return {
          success: false,
          method: 'cancelled',
          message: 'Compartilhamento cancelado.'
        };
      }
      console.warn('Erro ao compartilhar nativamente, usando fallback de download:', err);
    }
  }

  // 2. Fallback para Desktop (Windows sem WhatsApp App / Firefox): Baixa e sugere WhatsApp Web
  downloadBlob(blob, filename);

  return {
    success: true,
    method: 'download_with_whatsapp_prompt',
    message: 'Arquivo de backup baixado em Downloads! Você pode anexá-lo diretamente no WhatsApp Web ou enviá-lo por e-mail.'
  };
}
