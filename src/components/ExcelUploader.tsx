'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function ExcelUploader() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

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
      {!showModal ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-darkGray">{t('excelUploader.title')}</h2>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-gray600 hover:text-primary"
              title={t('excelUploader.infoButton')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
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
      ) : (
        <div className="relative">


          <div className="space-y-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-semibold text-darkGray flex items-center gap-2x">
              <span>📌 </span> &#8203; {t('excelUploader.modal.title')}
            </h3>
            <button
              onClick={() => setShowModal(false)}
              className="p-1 text-gray600 hover:text-primary transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

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
      )}
    </div>
  );
}