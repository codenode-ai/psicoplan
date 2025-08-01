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

// Hook para detectar se está em mobile dentro de um dialog
function useIsMobileInDialog() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isInDialog, setIsInDialog] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const checkDialog = () => {
      setIsInDialog(!!document.querySelector('[data-radix-dialog-content]'));
    };

    checkMobile();
    checkDialog();

    window.addEventListener('resize', checkMobile);
    
    // Observer para detectar quando dialog é aberto
    const observer = new MutationObserver(checkDialog);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);

  return isMobile && isInDialog;
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
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "touch-manipulation", // Melhora interação no mobile
          className
        )}
      >
        {placeholder && <option value="">{placeholder}</option>}
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
      <SelectTrigger className={cn("touch-manipulation", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start">
        {children}
      </SelectContent>
    </Select>
  );
}

export function SmartSelectItem({ value, children }: SmartSelectItemProps) {
  return <SelectItem value={value}>{children}</SelectItem>;
}