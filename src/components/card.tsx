import type { ReactNode, CSSProperties } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
}

export function Card({ children, style, onClick }: CardProps) {
  const cardStyle: CSSProperties = {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div style={cardStyle} onClick={onClick}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
}

export function CardHeader({ children, action }: CardHeaderProps) {
  const headerStyle: CSSProperties = {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const titleStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  };

  return (
    <div style={headerStyle}>
      <h3 style={titleStyle}>{children}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function CardContent({ children, style }: CardContentProps) {
  const contentStyle: CSSProperties = {
    padding: '24px',
    ...style,
  };

  return <div style={contentStyle}>{children}</div>;
}
