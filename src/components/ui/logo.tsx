import { Brain } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} bg-gradient-primary rounded-lg p-1.5 flex items-center justify-center shadow-primary`}>
        <Brain className="text-white w-full h-full" />
      </div>
      {showText && (
        <span className={`font-bold ${textSizes[size]} bg-gradient-primary bg-clip-text text-transparent`}>
          Psicoplan
        </span>
      )}
    </div>
  );
}