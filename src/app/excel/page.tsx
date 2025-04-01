"use client"
import ExcelUploader from '@/components/ExcelUploader';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';

export default function DataManagementPage() {
  useSetPageTitle('Excel Upload');
  return (
    <div className="container mx-auto py-6">
      <ExcelUploader />
    </div>
  );
}