"use client"
import ExcelUploader from '@/components/ExcelUploader';
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';


export default function DataManagementPage() {
  useTranslatedPageTitle('title.excelUpload');
  return (
    <div className="container mx-auto">
      <ExcelUploader />
    </div>
  );
}