import React, { useEffect, useRef } from 'react';

interface ModalProps {
  titleId: string;
  onClose: () => void;
  dismissible?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
  initialFocusSelector?: string;
  backdropChildren?: React.ReactNode;
  children: React.ReactNode;
}

const modalStack: symbol[] = [];

let scrollLockCount = 0;
let previousOverflow = '';

function lockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (scrollLockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function unlockBodyScroll(): void {
  if (typeof document === 'undefined') return;
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}

export const Modal: React.FC<ModalProps> = ({
  titleId,
  onClose,
  dismissible = true,
  closeOnBackdrop = true,
  className = '',
  initialFocusSelector,
  backdropChildren,
  children,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<symbol>(Symbol('modal'));
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = idRef.current;
    const root = rootRef.current;
    modalStack.push(id);
    lockBodyScroll();

    const previousActive = document.activeElement as HTMLElement | null;
    const getFocusable = (): HTMLElement[] => {
      if (!root) return [];
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
    };

    const preferred =
      initialFocusSelector && root
        ? root.querySelector<HTMLElement>(initialFocusSelector)
        : null;
    const target = preferred ?? getFocusable()[0];
    target?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== id) return;

      if (event.key === 'Escape' && dismissible) {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const index = modalStack.lastIndexOf(id);
      if (index >= 0) modalStack.splice(index, 1);
      unlockBodyScroll();
      if (previousActive && document.contains(previousActive)) {
        previousActive.focus();
      }
    };
  }, [dismissible, initialFocusSelector]);

  return (
    <div
      className="mm-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) {
          onCloseRef.current();
        }
      }}
    >
      {backdropChildren}
      <div
        ref={rootRef}
        className={`mm-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
