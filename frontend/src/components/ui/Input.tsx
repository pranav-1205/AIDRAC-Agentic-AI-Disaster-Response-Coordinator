import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="label-stitch">{label}</label>}
        <input
          ref={ref}
          className={`input-stitch ${error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-500">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-on-surface-variant/70">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
