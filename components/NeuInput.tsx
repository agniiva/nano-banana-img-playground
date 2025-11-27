import React from 'react';

interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface NeuTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="ml-1 text-sm font-bold text-neu-text/80 uppercase tracking-wide">{label}</label>}
      <input 
        className={`w-full bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-pressed focus:outline-none focus:ring-1 focus:ring-neu-accent/30 placeholder-gray-400 transition-all ${className}`}
        {...props}
      />
    </div>
  );
};

export const NeuTextarea: React.FC<NeuTextareaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <label className="ml-1 text-sm font-bold text-neu-text/80 uppercase tracking-wide">{label}</label>}
      <textarea 
        className={`w-full bg-neu-base text-neu-text px-4 py-3 rounded-xl shadow-neu-pressed focus:outline-none focus:ring-1 focus:ring-neu-accent/30 placeholder-gray-400 transition-all resize-none ${className}`}
        {...props}
      />
    </div>
  );
};
