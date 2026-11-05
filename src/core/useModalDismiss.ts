import { useEffect } from 'react';

/**
 * Hook universal para fechamento e acessibilidade de modais em mobile e desktop.
 * - Fecha com a tecla Escape.
 * - Bloqueia a rolagem do body de fundo enquanto o modal estiver aberto.
 * - Restaura a rolagem limpa ao desmontar/fechar.
 */
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Salvar overflow anterior e travar rolagem da página de fundo
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);
}

