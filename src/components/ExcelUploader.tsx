'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ExcelUploader() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('excelUploader.errors.selectFile'));
      return;
    }

    // Check if it's an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError(t('excelUploader.errors.excelOnly'));
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      setMessage(data.message);
      setFile(null);

      // Reset the file input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : t('excelUploader.errors.unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-backgroundColor rounded-lg shadow-md">
        <>
          <div className="relative mb-8">
            <div className="space-y-4">
            <div className="flex justify-between mb-2">
              <h3 className="text-lg font-semibold text-darkGray flex items-center gap-2x">
                <span>📌 </span> &#8203; {t('excelUploader.modal.title')}
              </h3>
            </div>
              <p className="text-sm text-gray600">
                {t('excelUploader.modal.description')}
              </p>

              <div>
                <h4 className="text-sm font-medium text-darkGray flex items-center gap-2 mb-2">
                  {t('excelUploader.modal.exampleTitle')}
                </h4>
                <p className="text-sm text-gray600 mb-3">
                  {t('excelUploader.modal.exampleDescription')}
                </p>
                <a
                  href="/explicador.xlsx"
                  download
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue50 text-primary hover:bg-blue200 rounded-md text-sm font-medium transition-colors"
                >
                  <span>📥</span>
                  {t('excelUploader.modal.downloadButton')}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-darkGray">{t('excelUploader.title')}</h2>
          </div>

          <div className="mb-3">
            <label htmlFor="excel-file" className="block text-xs font-medium text-gray700 mb-1.5">
              {t('excelUploader.selectFile')}
            </label>
            <div className="relative">
              <input
                type="file"
                id="excel-file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label={t('excelUploader.selectFile')}
              />
              <div className="flex items-center border border-gray300 rounded-md overflow-hidden">
                <span className="bg-blue50 text-primary hover:bg-blue200 py-1.5 px-3 text-xs font-semibold">
                  {t('excelUploader.chooseFile')}
                </span>
                <span className="px-3 text-xs text-gray500 truncate">
                  {file ? file.name : t('excelUploader.noFileSelected')}
                </span>
              </div>
            </div>

          </div>

          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className={`w-full py-1.5 px-3 rounded-md font-medium text-white text-xs
              ${loading || !file
                ? 'bg-gray400 cursor-not-allowed'
                : 'bg-primary hover:bg-secondary'}`}
          >
            {loading ? t('excelUploader.uploading') : t('excelUploader.uploadButton')}
          </button>

          {message && (
            <div className="mt-3 p-2 bg-blue50 text-primary rounded-md text-xs">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md text-xs">
              {error}
            </div>
          )}
        </>
    </div>
  );
}