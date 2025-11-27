import React from 'react';

interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ReactNode;
}

export const NeuButton: React.FC<NeuButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon,
  ...props 
}) => {
  
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200 active:scale-95 outline-none focus:ring-2 focus:ring-neu-accent/50 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-neu-base text-neu-accent shadow-neu-btn active:shadow-neu-btn-active hover:text-indigo-600",
    secondary: "bg-neu-base text-neu-text shadow-neu-btn active:shadow-neu-btn-active hover:text-gray-800",
    danger: "bg-neu-base text-red-500 shadow-neu-btn active:shadow-neu-btn-active hover:text-red-700"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-5 h-5">{icon}</span>}
      {children}
    </button>
  );
};
