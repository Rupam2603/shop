/**
 * BulkProductUploadModal.tsx
 * -----------------------------------------------------------------------
 * Admin panel > Products > "Upload Excel" flow.
 *
 * Usage in AdminDashboard.tsx:
 *   const [showBulkUpload, setShowBulkUpload] = useState(false);
 *   ...
 *   <button onClick={() => setShowBulkUpload(true)}>Upload Excel</button>
 *   {showBulkUpload && (
 *     <BulkProductUploadModal
 *       supabase={supabase}
 *       onClose={() => setShowBulkUpload(false)}
 *       onImported={() => { setShowBulkUpload(false); refetchProducts(); }}
 *     />
 *   )}
 * -----------------------------------------------------------------------
 */

import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { parseProductExcel, ParsedProductRow } from '../lib/productExcelImport';
import { bulkInsertProducts } from '../lib/bulkInsertProducts';

type Step = 'upload' | 'preview' | 'importing' | 'done';

interface Props {
  supabase?: any;
  onClose: () => void;
  onImported: () => void;
}

export default function BulkProductUploadModal({ supabase, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedProductRow[]>([]);
  const [parseError, setParseError] = useState('');
  const [importOutcome, setImportOutcome] = useState<{
    insertedCount: number;
    failedCount: number;
    imagesDownloaded: number;
    imagesFailed: number;
  } | null>(null);
  const [progressMsg, setProgressMsg] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setParseError('');
    setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseProductExcel(buffer);
      if (result.rows.length === 0) {
        setParseError('No product rows found in this file.');
        return;
      }
      setRows(result.rows);
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read this file.');
    }
  }, []);

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const validRows = rows.filter((r) => r.isValid);
  const invalidRows = rows.filter((r) => !r.isValid);

  const fetchAndUploadImage = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/upload-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, folder: 'products' }),
      });
      const data = await res.json();
      if (res.ok && data.url) return data.url;
      return null;
    } catch (e) {
      return null;
    }
  };

  const handleConfirmImport = async () => {
    setStep('importing');
    setProgressMsg('Preparing import...');
    
    let imagesDownloaded = 0;
    let imagesFailed = 0;

    // We will process the validRows in chunks of 5 for image downloading to avoid overwhelming the network
    const concurrency = 5;
    let processed = 0;
    
    // We modify a copy of validRows to have the uploaded Vercel Blob URL
    const updatedRows = [...validRows];
    
    const downloadImageQueue = [];
    for (let i = 0; i < updatedRows.length; i++) {
      const row = updatedRows[i];
      // Only process if there's at least one image URL. We use the first valid URL
      const firstUrl = row.imageUrls?.[0];
      if (firstUrl) {
        downloadImageQueue.push(async () => {
          try {
            const newUrl = await fetchAndUploadImage(firstUrl);
            if (newUrl) {
              row.productImage = newUrl;
              imagesDownloaded++;
            } else {
              imagesFailed++;
              row.warnings.push('Failed to download image from URL');
            }
          } catch (e) {
            imagesFailed++;
            row.warnings.push('Failed to download image from URL');
          }
          processed++;
          setProgressMsg(`Processing ${processed}/${validRows.length} products, downloading images...`);
        });
      } else {
        processed++;
        setProgressMsg(`Processing ${processed}/${validRows.length} products...`);
      }
    }

    // Process the queue with concurrency limit
    for (let i = 0; i < downloadImageQueue.length; i += concurrency) {
      const batch = downloadImageQueue.slice(i, i + concurrency);
      await Promise.all(batch.map(fn => fn()));
    }

    setProgressMsg('Inserting records into database...');
    const outcome = await bulkInsertProducts(supabase, updatedRows);
    
    setImportOutcome({
      insertedCount: outcome.insertedCount,
      failedCount: validRows.length - outcome.insertedCount,
      imagesDownloaded,
      imagesFailed,
    });
    setStep('done');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#dce7db] animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#e5eee4] bg-[#f8fbf8]">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-200">
              <Upload className="w-5 h-5 text-[#006a39]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-['Manrope',sans-serif] font-black text-[#073b4c]">
                Upload Pharmaceutical Product List (Excel)
              </h2>
              <p className="text-xs sm:text-sm text-[#5a6d5f] font-medium mt-0.5">
                Bulk import products directly using the Product Master Sheet (.xlsx) template.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-[#dce7db] flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-[#006a39]/40 hover:border-[#006a39] rounded-3xl p-10 text-center bg-emerald-50/30 hover:bg-emerald-50/50 transition-all flex flex-col items-center justify-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-3 shadow-xs">
                <Upload className="w-7 h-7 text-[#006a39]" />
              </div>
              <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base">
                Click or drag your .xlsx file here
              </p>
              <p className="text-xs text-[#627566] mt-1 max-w-md">
                Supports the Product Master Sheet template. Column headers are automatically detected even with title rows.
              </p>
              <label className="inline-block mt-4 px-5 py-2.5 rounded-2xl bg-white border border-[#006a39] text-[#006a39] text-xs sm:text-sm font-extrabold cursor-pointer hover:bg-emerald-50 shadow-2xs transition-all active:scale-95">
                Choose Excel File
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFileInputChange} />
              </label>
              {fileName && (
                <p className="text-xs text-emerald-800 font-semibold mt-3 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Selected: {fileName}
                </p>
              )}
              {parseError && (
                <p className="text-sm text-red-600 mt-4 flex items-center justify-center gap-1.5 bg-red-50 px-4 py-2 rounded-xl border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {parseError}
                </p>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {validRows.length} ready to import
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> {invalidRows.length} flagged (will be skipped)
                  </span>
                )}
              </div>

              <div className="border border-[#dce7db] rounded-2xl overflow-x-auto shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8fbf8] text-[#556959] border-b border-[#dce7db] font-bold">
                    <tr>
                      <th className="p-2.5 whitespace-nowrap">Row</th>
                      <th className="p-2.5 min-w-[160px]">Product Name</th>
                      <th className="p-2.5 whitespace-nowrap">Category</th>
                      <th className="p-2.5 text-right whitespace-nowrap">MRP</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Retailer</th>
                      <th className="p-2.5 text-right whitespace-nowrap">Retailer Off%</th>
                      <th className="p-2.5 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf3ed]">
                    {rows.map((r) => (
                      <tr key={r.rowNumber} className={`hover:bg-white/80 transition-colors ${!r.isValid ? 'bg-red-50/70' : ''}`}>
                        <td className="p-2.5 text-gray-400 font-mono text-[11px]">{r.rowNumber}</td>
                        <td className="p-2.5 font-bold text-[#073b4c] max-w-[200px] truncate" title={r.productName}>
                          {r.productName || '—'}
                          {r.packSize && <span className="block text-[10px] text-gray-500 font-normal">{r.packSize}</span>}
                        </td>
                        <td className="p-2.5 whitespace-nowrap text-gray-700">{r.category || '—'}</td>
                        <td className="p-2.5 text-right whitespace-nowrap font-mono font-semibold">₹{r.mrp || 0}</td>
                        <td className="p-2.5 text-right whitespace-nowrap font-mono font-bold text-sky-800">₹{r.retailerPrice || 0}</td>
                        <td className="p-2.5 text-right whitespace-nowrap font-semibold text-sky-700">
                          {r.retailerOfferPercent !== null ? `${r.retailerOfferPercent}%` : '—'}
                        </td>
                        <td className="p-2.5 text-[11px] whitespace-nowrap">
                          {r.isValid ? (
                            r.warnings.length > 0 ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title={r.warnings.join(', ')}>
                                ⚠️ {r.warnings[0]}
                              </span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                                ✓ OK
                              </span>
                            )
                          ) : (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold" title={r.errors.join(', ')}>
                              ✕ {r.errors[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-[#728575] mt-3">
                Discounts and retailer margins are recalculated from MRP baseline to ensure consistency across the catalog.
              </p>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-[#006a39] animate-spin mb-3" />
              <p className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-base">
                {progressMsg || `Importing ${validRows.length} products…`}
              </p>
              <p className="text-xs text-gray-500 mt-1">Updating catalog and inventory tables in real-time</p>
            </div>
          )}

          {step === 'done' && importOutcome && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-[#006a39]" />
              </div>
              <p className="text-xl font-['Manrope',sans-serif] font-black text-[#073b4c]">
                {importOutcome.insertedCount} product{importOutcome.insertedCount !== 1 ? 's' : ''} successfully imported
              </p>
              
              <div className="flex gap-4 mt-4 text-sm bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3">
                <div className="text-emerald-800">
                  <span className="font-bold">{importOutcome.imagesDownloaded}</span> image(s) uploaded
                </div>
                {importOutcome.imagesFailed > 0 && (
                  <div className="text-amber-700">
                    <span className="font-bold">{importOutcome.imagesFailed}</span> image(s) failed
                  </div>
                )}
              </div>

              {importOutcome.failedCount > 0 && (
                <p className="text-sm text-rose-600 mt-3 bg-rose-50 px-4 py-1.5 rounded-xl border border-rose-200">
                  {importOutcome.failedCount} row(s) encountered an error during database write.
                </p>
              )}
              {invalidRows.length > 0 && (
                <p className="text-xs text-amber-700 mt-2">
                  {invalidRows.length} invalid row(s) with missing required fields were skipped.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-[#e5eee4] bg-[#f8fbf8]">
          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                type="button"
                className="px-5 py-2.5 rounded-2xl border border-[#dce7db] text-xs sm:text-sm font-bold text-gray-700 hover:bg-white transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={validRows.length === 0}
                type="button"
                className="px-6 py-2.5 rounded-2xl bg-[#006a39] hover:bg-[#00542d] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/15 disabled:opacity-40 transition-all cursor-pointer"
              >
                Import {validRows.length} Product{validRows.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {step === 'done' && (
            <button
              onClick={onImported}
              type="button"
              className="px-6 py-2.5 rounded-2xl bg-[#006a39] hover:bg-[#00542d] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-emerald-950/15 transition-all cursor-pointer"
            >
              Done & Refresh Catalog
            </button>
          )}
          {(step === 'upload' || step === 'importing') && (
            <button
              onClick={onClose}
              type="button"
              className="px-5 py-2.5 rounded-2xl border border-[#dce7db] text-xs sm:text-sm font-bold text-gray-700 hover:bg-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
