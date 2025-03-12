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
    <div className="p-6 max-w-md mx-auto bg-backgroundColor rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-darkGray">Upload Excel Data Manually</h2>
      
      <div className="mb-4">
        <label htmlFor="excel-file" className="block text-sm font-medium text-gray700 mb-2">
          Select Excel File
        </label>
        <input
          type="file"
          id="excel-file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue50 file:text-primary
            file:hover:bg-blue200 file:hover:text-primary
            "
        />
        {file && (
          <p className="mt-2 text-sm text-gray500">
            Selected file: {file.name}
          </p>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={loading || !file}
        className={`w-full py-2 px-4 rounded-md font-medium text-white 
          ${loading || !file 
            ? 'bg-gray400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? 'Uploading...' : 'Upload Excel'}
      </button>

      {message && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
}