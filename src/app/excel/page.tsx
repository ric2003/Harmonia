// app/data-management/page.tsx
import ExcelUploader from '@/components/ExcelUploader';

export default function DataManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Data Management</h1>
      <div>
        <ExcelUploader />
      </div>
    </div>
  );
}