import { useEffect, useRef } from 'react';

let activeModalCount = 0;

/**
 * Retorna a contagem atual de modais abertos no ciclo de vida global.
 */
export function getActiveModalCount(): number {
  return activeModalCount;
}

/**
 * Adquire a trava de rolagem para um modal ativo.
 * Incrementa o contador de modais e bloqueia a rolagem do body/html na transição 0 -> 1.
 * Retorna uma função de liberação (`release`) que decrementa o contador e remove
 * a trava quando o último modal for fechado.
 */
export function acquireModalLock(): () => void {
  activeModalCount++;
  if (activeModalCount === 1 && typeof document !== 'undefined') {
    if (document.body) {
      document.body.style.overflow = 'hidden';
    }
    if (document.documentElement) {
      document.documentElement.style.overflow = 'hidden';
    }
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeModalCount = Math.max(0, activeModalCount - 1);
    if (activeModalCount === 0 && typeof document !== 'undefined') {
      if (document.body) {
        document.body.style.removeProperty('overflow');
      }
      if (document.documentElement) {
        document.documentElement.style.removeProperty('overflow');
      }
    }
  };
}

/**
 * Libera forçadamente qualquer trava residual de rolagem no body e documentElement,
 * redefinindo o contador de modais abertos.
 */
export function forceUnlockBodyScroll(): void {
  activeModalCount = 0;
  if (typeof document !== 'undefined') {
    if (document.body) {
      document.body.style.removeProperty('overflow');
    }
    if (document.documentElement) {
      document.documentElement.style.removeProperty('overflow');
    }
  }
}

/**
 * Hook universal para fechamento e acessibilidade de modais em mobile e desktop.
 * - Fecha com a tecla Escape.
 * - Bloqueia a rolagem do body e html de fundo enquanto houver modais ativos.
 * - Utiliza contador global de referências para suportar modais aninhados/múltiplos.
 * - Restaura a rolagem limpa ao desmontar/fechar o último modal.
 */
export function useModalDismiss(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeyDown);
    }

    const release = acquireModalLock();

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleKeyDown);
      }
      release();
    };
  }, [isOpen]);
}



