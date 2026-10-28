import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Keyboard escape listener & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the modal container
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeWidths: Record<ModalSize, string> = {
    sm: '420px',
    md: '580px',
    lg: '780px',
  };

  return (
    <div
      data-ui="modal-scrim"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(28, 27, 26, 0.65)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        zIndex: 9999,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-dialog-title"
        aria-describedby={description ? 'modal-dialog-desc' : undefined}
        tabIndex={-1}
        data-ui="modal"
        style={{
          width: '100%',
          maxWidth: sizeWidths[size],
          backgroundColor: 'var(--surface)',
          border: '3px solid var(--ink)',
          boxShadow: 'var(--shadow-lift, 6px 6px 0px var(--ink))',
          borderRadius: '0px',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          outline: 'none',
          position: 'relative',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '2px solid var(--ink)',
            backgroundColor: 'var(--surface-tint)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <h2
              id="modal-dialog-title"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.35rem',
                fontWeight: 600,
                color: 'var(--ink)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-dialog-desc"
                style={{
                  margin: '0.35rem 0 0 0',
                  fontSize: '0.875rem',
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-ui)',
                }}
              >
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              padding: '0.35rem',
              border: '2px solid var(--ink)',
              backgroundColor: 'var(--surface)',
              color: 'var(--ink)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              transition: 'background-color var(--t-hover) var(--ease-out)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--surface)';
            }}
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            flex: 1,
            color: 'var(--ink)',
          }}
        >
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '2px solid var(--ink)',
              backgroundColor: 'var(--surface-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '0.75rem',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';
