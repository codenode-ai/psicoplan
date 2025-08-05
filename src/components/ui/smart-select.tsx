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

// Hook otimizado para detectar mobile em dialog
function useIsMobileInDialog() {
  const [shouldUseNative, setShouldUseNative] = React.useState(false);

  React.useEffect(() => {
    // Usar matchMedia para detecção mais precisa
    const mobileQuery = window.matchMedia('(max-width: 768px) and (pointer: coarse)');
    
    const checkMobileInDialog = () => {
      const isMobile = mobileQuery.matches || 
                      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isInDialog = !!document.querySelector('[data-radix-dialog-content]');
      setShouldUseNative(isMobile && isInDialog);
    };

    // Check inicial
    checkMobileInDialog();

    // Listener para mudanças de media query
    const handleMediaChange = () => {
      checkMobileInDialog();
    };

    mobileQuery.addEventListener('change', handleMediaChange);

    // Observer mais simples e otimizado
    let timeoutId: NodeJS.Timeout;
    const debouncedCheck = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobileInDialog, 100);
    };

    const observer = new MutationObserver((mutations) => {
      const hasDialogChange = mutations.some(mutation => 
        mutation.type === 'childList' && (
          Array.from(mutation.addedNodes).some(node => 
            node.nodeType === 1 && (node as Element).hasAttribute('data-radix-dialog-content')
          ) ||
          Array.from(mutation.removedNodes).some(node => 
            node.nodeType === 1 && (node as Element).hasAttribute('data-radix-dialog-content')
          )
        )
      );
      
      if (hasDialogChange) {
        debouncedCheck();
      }
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      mobileQuery.removeEventListener('change', handleMediaChange);
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
          onValueChange(e.target.value);
        }}
        disabled={disabled}
        className={cn(
          "flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation min-h-[44px] appearance-none",
          "cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground",
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
        className="z-[100] max-h-[300px] overflow-y-auto"
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