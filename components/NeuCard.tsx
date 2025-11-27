import React from 'react';

interface NeuCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
}

export const NeuCard: React.FC<NeuCardProps> = ({ children, className = '', title, actions }) => {
  return (
    <div className={`bg-neu-base rounded-2xl shadow-neu-flat p-6 ${className}`}>
      {(title || actions) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h3 className="text-lg font-bold text-neu-text">{title}</h3>}
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
