import React, { forwardRef } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  style,
  ...props
}, ref) => {
  const isDisabled = disabled || isLoading;

  // Base and size styles
  const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
    sm: {
      padding: '0.4rem 0.85rem',
      fontSize: '0.875rem',
      letterSpacing: '0.02em',
    },
    md: {
      padding: '0.65rem 1.4rem',
      fontSize: '1rem',
      letterSpacing: '0.01em',
    },
    lg: {
      padding: '0.85rem 1.85rem',
      fontSize: '1.125rem',
      letterSpacing: '0.01em',
    },
  };

  const variantStyles: Record<ButtonVariant, { normal: React.CSSProperties; hoverBg?: string; activeShadow?: string }> = {
    primary: {
      normal: {
        background: 'var(--accent)',
        color: 'var(--accent-ink)',
        border: '2px solid var(--ink)',
        boxShadow: isDisabled ? 'none' : 'var(--shadow-offset)',
      },
      hoverBg: 'var(--accent-hover)',
    },
    secondary: {
      normal: {
        background: 'var(--surface-dark)',
        color: 'var(--ink)',
        border: '2px solid var(--ink)',
        boxShadow: isDisabled ? 'none' : 'var(--shadow-offset)',
      },
      hoverBg: 'var(--surface-tint)',
    },
    danger: {
      normal: {
        background: 'var(--danger)',
        color: 'var(--danger-ink)',
        border: '2px solid var(--ink)',
        boxShadow: isDisabled ? 'none' : 'var(--shadow-offset)',
      },
      hoverBg: 'var(--danger-hover)',
    },
    outline: {
      normal: {
        background: 'transparent',
        color: 'var(--ink)',
        border: '2px solid var(--ink)',
        boxShadow: isDisabled ? 'none' : 'var(--shadow-offset)',
      },
      hoverBg: 'rgba(46, 74, 62, 0.08)',
    },
    ghost: {
      normal: {
        background: 'transparent',
        color: 'var(--ink)',
        border: '2px solid transparent',
        boxShadow: 'none',
      },
      hoverBg: 'rgba(28, 27, 26, 0.07)',
    },
  };

  const selectedVariant = variantStyles[variant];

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      aria-busy={isLoading}
      data-ui="button"
      data-variant={variant}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        textDecoration: 'none',
        borderRadius: '0px',
        width: fullWidth ? '100%' : 'auto',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'transform var(--t-press) var(--ease-out), box-shadow var(--t-press) var(--ease-out), background-color var(--t-hover) var(--ease-out)',
        userSelect: 'none',
        position: 'relative',
        ...sizeStyles[size],
        ...selectedVariant.normal,
        ...style,
      }}
      className={`gym-btn ${className}`}
      onMouseDown={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'translate(2px, 2px)';
          e.currentTarget.style.boxShadow = '1px 1px 0px var(--ink)';
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && variant !== 'ghost') {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'var(--shadow-offset)';
        }
      }}
      onMouseEnter={(e) => {
        if (!isDisabled && selectedVariant.hoverBg) {
          e.currentTarget.style.backgroundColor = selectedVariant.hoverBg;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = variant === 'ghost' ? 'none' : 'var(--shadow-offset)';
          e.currentTarget.style.backgroundColor = (selectedVariant.normal.background as string) || '';
        }
      }}
      {...props}
    >
      {isLoading ? (
        <span
          data-ui="spinner"
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spin 0.65s linear infinite',
          }}
          aria-hidden="true"
        />
      ) : leftIcon ? (
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {leftIcon}
        </span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? (
        <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {rightIcon}
        </span>
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
