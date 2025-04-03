'use client';

import { useState } from 'react';

export default function ExcelUploader() {
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
      {!showModal ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-darkGray">Upload Excel Data Manually</h2>
            <button
              onClick={() => setShowModal(true)}
              className="p-1 text-gray600 hover:text-primary transition-colors"
              title="File Requirements Info"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
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
                : 'bg-primary hover:bg-secondary'}`}
          >
            {loading ? 'Uploading...' : 'Upload Excel'}
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
              <span>📌 </span> &#8203; Upload de Ficheiros
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
              Aceitamos ficheiros Excel (.xlsx) com colunas específicas: Barragem, Data, Cota, Volume, Enchimento, Fonte, Bacia e DRAP. O ficheiro deve ter cabeçalhos corretos e estar bem estruturado.
            </p>

            <div>
              <h4 className="text-sm font-medium text-darkGray flex items-center gap-2 mb-2">
                <span>📥</span> Exemplo de Ficheiro
              </h4>
              <p className="text-sm text-gray600 mb-3">
                Veja um modelo válido antes de fazer o upload:
              </p>
              <a
                href="/explicador.xlsx"
                download
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue50 text-primary hover:bg-blue200 rounded-md text-sm font-medium transition-colors"
              >
                <span>📥</span>
                Download explicador.xlsx
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}