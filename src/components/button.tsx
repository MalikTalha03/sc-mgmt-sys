import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: ReactNode;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
}

const baseStyle: CSSProperties = {
  fontWeight: '500',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  transition: 'all 0.2s',
};

const sizes: Record<string, CSSProperties> = {
  sm: { fontSize: '13px', padding: '8px 14px' },
  md: { fontSize: '14px', padding: '10px 18px' },
  lg: { fontSize: '15px', padding: '12px 24px' },
};

const variants: Record<string, CSSProperties> = {
  primary: { background: '#4f46e5', color: 'white' },
  secondary: { background: '#f3f4f6', color: '#374151' },
  danger: { background: '#dc2626', color: 'white' },
  ghost: { background: 'transparent', color: '#6b7280' },
};

export function Button({ 
  variant = "primary", 
  children, 
  fullWidth = false,
  size = "md",
  disabled,
  style,
  ...props 
}: ButtonProps) {
  const buttonStyle: CSSProperties = {
    ...baseStyle,
    ...sizes[size],
    ...variants[variant],
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };

  return (
    <button
      style={buttonStyle}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
