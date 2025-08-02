import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SmartSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

interface SmartSelectItemProps {
  value: string;
  children: React.ReactNode;
}

// Hook melhorado para detectar mobile em dialog
function useIsMobileInDialog() {
  const [shouldUseNative, setShouldUseNative] = React.useState(false);

  React.useEffect(() => {
    const checkMobileInDialog = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                      (window.innerWidth <= 768 && 'ontouchstart' in window);
      const isInDialog = !!document.querySelector('[data-radix-dialog-content]');
      setShouldUseNative(isMobile && isInDialog);
    };

    // Check imediatamente
    checkMobileInDialog();

    // Observer otimizado apenas para mudanças do dialog
    const observer = new MutationObserver((mutations) => {
      const hasDialogChange = mutations.some(mutation => 
        Array.from(mutation.addedNodes).some(node => 
          node.nodeType === 1 && (node as Element).hasAttribute('data-radix-dialog-content')
        ) ||
        Array.from(mutation.removedNodes).some(node => 
          node.nodeType === 1 && (node as Element).hasAttribute('data-radix-dialog-content')
        )
      );
      
      if (hasDialogChange) {
        checkMobileInDialog();
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });

    // Listener para mudanças de orientação
    window.addEventListener('orientationchange', checkMobileInDialog);
    window.addEventListener('resize', checkMobileInDialog);

    return () => {
      observer.disconnect();
      window.removeEventListener('orientationchange', checkMobileInDialog);
      window.removeEventListener('resize', checkMobileInDialog);
    };
  }, []);

  return shouldUseNative;
}

export function SmartSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className,
  disabled = false 
}: SmartSelectProps) {
  const shouldUseNative = useIsMobileInDialog();

  if (shouldUseNative) {
    // Extrair options do children para o select nativo
    const options: { value: string; label: string }[] = [];
    
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.props.value) {
        options.push({
          value: child.props.value,
          label: child.props.children
        });
      }
    });

    return (
      <select
        value={value || ''}
        onChange={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onValueChange(e.target.value);
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        disabled={disabled}
        style={{ touchAction: 'manipulation' }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation min-h-[44px]", // Área de toque mínima de 44px
          className
        )}
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  // Desktop: usar Radix Select normal
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("touch-manipulation min-h-[44px]", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent 
        position="popper" 
        side="bottom" 
        align="start"
        className="z-[9999]"
        container={document.querySelector('[data-radix-dialog-content]') || undefined}
      >
        {children}
      </SelectContent>
    </Select>
  );
}

export function SmartSelectItem({ value, children }: SmartSelectItemProps) {
  return <SelectItem value={value}>{children}</SelectItem>;
}