
import { ResponsiveFinancialTable } from './ResponsiveFinancialTable';
import { FinancialRecord } from '@/types/database.types';

interface FinancialTableProps {
  records: FinancialRecord[];
  onEditRecord: (record: FinancialRecord) => void;
  isLoading: boolean;
}

export function FinancialTable({ records, onEditRecord, isLoading }: FinancialTableProps) {
  return (
    <ResponsiveFinancialTable 
      records={records} 
      onEditRecord={onEditRecord} 
      isLoading={isLoading} 
    />
  );
}
