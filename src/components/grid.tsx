import React from "react";

interface GridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 3 | 4 | 6 | 8;
  className?: string;
}

export function Grid({ children, cols = 2, gap = 4, className = "" }: GridProps) {
  const colsClass = `grid-cols-1 md:grid-cols-${cols}`;
  const gapClass = `gap-${gap}`;

  return (
    <div className={`grid ${colsClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}
