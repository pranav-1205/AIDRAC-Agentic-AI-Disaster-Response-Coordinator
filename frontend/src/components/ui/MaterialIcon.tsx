import { type HTMLAttributes } from 'react';

interface MaterialIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: string;
  className?: string;
}

export default function MaterialIcon({ icon, className = '', ...props }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      {...props}
      style={{
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...props.style,
      }}
    >
      {icon}
    </span>
  );
}
