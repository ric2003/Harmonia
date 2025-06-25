"use client"
import ExcelUploader from '@/components/ExcelUploader';
import { useTranslatedPageTitle } from '@/hooks/useTranslatedPageTitle';
import ProtectedRoute from '@/components/ProtectedRoute';


export default function DataManagementPage() {
  useTranslatedPageTitle('title.excelUpload');
  return (
    <ProtectedRoute>
      <div className="container mx-auto">
        <ExcelUploader />
      </div>
    </ProtectedRoute>
  );
}