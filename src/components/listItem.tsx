import React from "react";

interface ListItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function ListItem({ children, className = "", onClick, selected = false }: ListItemProps) {
  return (
    <div
      className={`p-4 bg-gray-50 rounded-lg ${onClick ? 'cursor-pointer hover:bg-gray-100' : ''} ${
        selected ? 'ring-2 ring-gray-800' : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface ListItemHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ListItemHeader({ children, className = "" }: ListItemHeaderProps) {
  return <div className={`flex justify-between items-center ${className}`}>{children}</div>;
}

interface ListItemContentProps {
  children: React.ReactNode;
  className?: string;
}

export function ListItemContent({ children, className = "" }: ListItemContentProps) {
  return <div className={className}>{children}</div>;
}
