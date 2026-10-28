import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  mono?: boolean;
  prefixElement?: React.ReactNode;
  suffixElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  mono = false,
  prefixElement,
  suffixElement,
  id,
  className = '',
  disabled,
  required,
  style,
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error);

  return (
    <div
      data-ui="input-wrapper"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        width: '100%',
        textAlign: 'left',
      }}
      className={className}
    >
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.925rem',
            color: 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            userSelect: 'none',
          }}
        >
          <span>{label}</span>
          {required && (
            <span
              style={{ color: 'var(--danger)', fontWeight: 'bold' }}
              aria-label="required"
            >
              *
            </span>
          )}
        </label>
      )}

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {prefixElement && (
          <div
            style={{
              position: 'absolute',
              left: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--faint)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {prefixElement}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          required={required}
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          data-ui="input"
          style={{
            width: '100%',
            padding: prefixElement
              ? '0.65rem 0.85rem 0.65rem 2.4rem'
              : suffixElement
              ? '0.65rem 2.4rem 0.65rem 0.85rem'
              : '0.65rem 0.85rem',
            background: disabled ? 'var(--surface-dark)' : 'var(--surface)',
            color: 'var(--ink)',
            fontFamily: mono ? 'var(--font-mono)' : 'var(--font-text)',
            fontSize: mono ? '0.95rem' : '1rem',
            fontWeight: 400,
            letterSpacing: mono ? '0.05em' : 'normal',
            border: hasError
              ? '2px solid var(--danger)'
              : '2px solid var(--ink)',
            borderRadius: '0px',
            boxShadow: 'none',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.65 : 1,
            transition: 'border-color var(--t-hover) var(--ease-out)',
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '3px solid var(--accent)';
            e.currentTarget.style.outlineOffset = '2px';
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none';
          }}
          {...props}
        />

        {suffixElement && (
          <div
            style={{
              position: 'absolute',
              right: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              color: 'var(--faint)',
              zIndex: 1,
            }}
          >
            {suffixElement}
          </div>
        )}
      </div>

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          style={{
            margin: 0,
            fontSize: '0.825rem',
            color: 'var(--danger)',
            fontWeight: 500,
            fontFamily: 'var(--font-ui)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}
        >
          <span aria-hidden="true">●</span> {error}
        </p>
      ) : helperText ? (
        <p
          id={helperId}
          style={{
            margin: 0,
            fontSize: '0.825rem',
            color: 'var(--faint)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
