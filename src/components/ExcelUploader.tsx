'use client';

import { useState } from 'react';

export default function ExcelUploader() {
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
      setError('Please select a file first');
      return;
    }

    // Check if it's an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Please upload an Excel file (.xlsx or .xls)');
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
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto bg-backgroundColor rounded-lg shadow-md">
      <h2 className="text-base font-bold mb-3 text-darkGray">Upload Excel Data Manually</h2>
      
      <div className="mb-3">
        <label htmlFor="excel-file" className="block text-xs font-medium text-gray700 mb-1.5">
          Select Excel File
        </label>
        <input
          type="file"
          id="excel-file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-xs text-gray500
            file:mr-3 file:py-1.5 file:px-3
            file:rounded-md file:border-0
            file:text-xs file:font-semibold
            file:bg-blue50 file:text-primary
            file:hover:bg-blue200 file:hover:text-primary
            "
        />
        {file && (
          <p className="mt-1.5 text-xs text-gray500">
            Selected file: {file.name}
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className={`w-full py-1.5 px-3 rounded-md font-medium text-white text-xs
          ${loading || !file 
            ? 'bg-gray400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Uploading...' : 'Upload Excel'}
      </button>

      {message && (
        <div className="mt-3 p-2 bg-green-100 text-green-700 rounded-md text-xs">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded-md text-xs">
          {error}
        </div>
      )}
    </div>
  );
}