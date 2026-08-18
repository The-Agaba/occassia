import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { guestsApi } from '../api';
import type { ImportResult } from '../types';
import EventTabs from '../components/EventTabs';
import { useUiStore } from '../store/uiStore';
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Download, HelpCircle, AlertTriangle } from 'lucide-react';

export default function GuestImportPage() {
  const { id } = useParams<{ id: string }>();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoadingState] = useState(false);
  const [error, setError] = useState('');
  const setLoading = useUiStore((s) => s.setLoading);
  const showToast = useUiStore((s) => s.showToast);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async () => {
    if (!id || !file) return;
    setLoadingState(true);
    setLoading(true);
    setError('');
    try {
      const res = await guestsApi.import(id, file);
      setResult(res.data);
      showToast('Guests imported successfully', 'success');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to upload file. Please check format and try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoadingState(false);
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadErrorReport = () => {
    if (!result || result.errors.length === 0) return;
    
    const headers = 'Row,Field,Error,Suggestion\n';
    const csvContent = result.errors.map(e => 
      `${e.row},"${e.field || ''}","${e.reason.replace(/"/g, '""')}","${e.suggestion?.replace(/"/g, '""') || ''}"`
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `import_errors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadTemplate = () => {
    const headers = [
      'full_name',
      'category_name',
      'attendance_type',
      'table_number',
      'meal_preference',
      'notes',
      'email',
      'phone',
    ];
    const sample = [
      'Jane Doe',
      'VIP',
      'SINGLE',
      '12',
      'Vegetarian',
      'Allergic to nuts',
      'jane.doe@example.com',
      '+1234567890',
    ];
    const csvContent = `${headers.join(',')}\n${sample.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')}\n`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'guest-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <EventTabs />
      <div className="p-4 sm:p-8 max-w-4xl mx-auto">
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0c0f14]">Import Guests</h2>
          <p className="text-sm text-slate-500 mt-1">
            Bulk upload guests via CSV. Ensure your columns match the required format.
          </p>
        </div>

        {!result && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  file ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setFile(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileSpreadsheet size={48} className="text-indigo-500 mb-4" />
                    <p className="font-medium text-slate-800">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleReset(); }}
                      className="mt-4 text-xs text-red-500 hover:underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud size={48} className="text-slate-300 mb-4" />
                    <p className="font-medium text-slate-700">Click or drag CSV file to upload</p>
                    <p className="text-xs text-slate-500 mt-2">Maximum file size 5MB</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
                  <AlertCircle size={18} className="shrink-0" /> {error}
                </div>
              )}

              <div className="mt-6 flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="w-full sm:w-auto px-8 py-3 bg-[#0c0f14] text-white rounded-lg disabled:opacity-50 font-medium hover:bg-[#161b24] transition-colors"
                >
                  {loading ? 'Processing Import...' : 'Import Guests'}
                </button>
                <button
                  onClick={downloadTemplate}
                  type="button"
                  className="w-full sm:w-auto px-8 py-3 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Download template
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 h-fit">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-slate-800 mb-4">
                <HelpCircle size={16} className="text-slate-500" /> Format Guide
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <p><strong>Required columns:</strong><br/>`full_name`, `category_name`</p>
                <p><strong>Optional columns:</strong><br/>`attendance_type`, `table_number`, `meal_preference`, `notes`</p>
                <div className="bg-slate-200 h-px my-2" />
                <ul className="list-disc pl-4 space-y-1">
                  <li>`attendance_type` must be SINGLE or DOUBLE</li>
                  <li>`category_name` must match an existing category exactly (case-sensitive)</li>
                  <li>`table_number` must be a valid integer</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Import Results</h3>
              <button onClick={handleReset} className="text-sm font-medium text-indigo-600 hover:underline">
                Import Another File
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border rounded-xl p-5 text-center shadow-sm">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                <p className="text-3xl font-bold text-slate-900">{result.imported}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Successfully Imported</p>
              </div>
              
              <div className={`bg-white border rounded-xl p-5 text-center shadow-sm ${result.failed > 0 ? 'border-red-200 ring-1 ring-red-100' : ''}`}>
                <AlertCircle size={24} className={`mx-auto mb-2 ${result.failed > 0 ? 'text-red-500' : 'text-slate-300'}`} />
                <p className="text-3xl font-bold text-slate-900">{result.failed}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Failed Rows</p>
              </div>
              
              <div className="bg-white border rounded-xl p-5 text-center shadow-sm">
                <AlertTriangle size={24} className="mx-auto text-amber-500 mb-2" />
                <p className="text-3xl font-bold text-slate-900">{result.skipped || 0}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mt-1">Skipped (Duplicates)</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-white border border-red-100 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
                  <h4 className="font-semibold text-red-900 flex items-center gap-2">
                    <AlertCircle size={18} /> Error Details
                  </h4>
                  <button 
                    onClick={downloadErrorReport}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-100 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Download size={14} /> Download CSV Report
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 w-16 text-slate-500 font-semibold">Row</th>
                        <th className="text-left p-3 w-1/4 text-slate-500 font-semibold">Field</th>
                        <th className="text-left p-3 w-1/3 text-slate-500 font-semibold">Error</th>
                        <th className="text-left p-3 text-slate-500 font-semibold">Suggestion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-900">{e.row}</td>
                          <td className="p-3 text-slate-700 font-mono text-xs">{e.field || '—'}</td>
                          <td className="p-3 text-red-600 font-medium">{e.reason}</td>
                          <td className="p-3 text-slate-500 text-xs">{e.suggestion || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
