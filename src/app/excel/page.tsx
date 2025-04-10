"use client"
import ExcelUploader from '@/components/ExcelUploader';
import { useSetPageTitle } from '@/hooks/useSetPageTitle';
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';


export default function DataManagementPage() {
  useTranslatedPageTitle('title.excelUpload');
  return (
    <div className="container mx-auto py-6">
      <ExcelUploader />
    </div>
  );
}