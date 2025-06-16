'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, BarChart3, Table, ChevronDown, ChevronUp } from 'lucide-react';

export default function ExcelUploader() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPurposeExpanded, setIsPurposeExpanded] = useState(false);

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
    <div className="p-4 max-w-2xl mx-auto glass-card">
      {/* Purpose and Data Flow Explanation - Collapsible */}
      <div className="mb-6 glass-card rounded-lg border border-primary/20 overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsPurposeExpanded(!isPurposeExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors duration-200"
        >
          <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Database className="w-5 h-5" />
            {t('excelUploader.purpose.title')}
          </h3>
          {isPurposeExpanded ? (
            <ChevronUp className="w-5 h-5 text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary" />
          )}
        </button>

        {/* Collapsible Content */}
        {isPurposeExpanded && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {t('excelUploader.purpose.description')}
            </p>
            
            {/* Data Flow Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                  1
                </div>
                <span className="text-gray-600 dark:text-gray-300">{t('excelUploader.dataFlow.step1')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="text-gray-600 dark:text-gray-300">{t('excelUploader.dataFlow.step2')}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-xs">
                  3
                </div>
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-primary" />
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-gray-600 dark:text-gray-300">{t('excelUploader.dataFlow.step3')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Format Information */}
      <div className="relative mb-6">
        <div className="space-y-4">
          <div className="flex justify-between mb-2">
            <h3 className="text-lg font-semibold text-darkGray flex items-center gap-2">
              <span>📌</span>
              {t('excelUploader.modal.title')}
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
              className="inline-flex items-center gap-2 px-3 py-1.5 glass-light text-primary hover:glass-frosted rounded-md text-sm font-medium transition-all duration-200"
            >
              <span>📥</span>
              {t('excelUploader.modal.downloadButton')}
            </a>
          </div>
        </div>
      </div>

      {/* Upload Section */}
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
          <div className="flex items-center glass-transparent rounded-md overflow-hidden border-0">
            <span className="glass-light text-primary hover:glass-frosted py-1.5 px-3 text-xs font-semibold transition-all duration-200">
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
        className={`w-full py-1.5 px-3 rounded-md font-medium text-white text-xs transition-all duration-200
          ${loading || !file
            ? 'bg-gray400 cursor-not-allowed opacity-50'
            : 'bg-primary hover:bg-secondary glass-light hover:glass-frosted'}`}
      >
        {loading ? t('excelUploader.uploading') : t('excelUploader.uploadButton')}
      </button>

      {message && (
        <div className="mt-3 p-2 glass-light text-primary rounded-md text-xs">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md text-xs glass-transparent">
          {error}
        </div>
      )}
    </div>
  );
}