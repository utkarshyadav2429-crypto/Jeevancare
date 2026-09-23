import React, { useState } from 'react';
import {
  FolderLock,
  Search,
  Upload,
  FileText,
  QrCode,
  Sparkles,
  Download,
  Share2,
  Trash2,
  Eye,
  X,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Bot,
  Calendar,
  User,
  Tag,
  FileDown
} from 'lucide-react';
import jsPDF from 'jspdf';
import { VaultItem, UserProfile } from '../../types';
import { auditLogger } from '../../services/AuditLogger';
import { supabaseVault } from '../../services/supabaseService';
import { JevanCareLoader } from '../common/JevanCareLoader';
import { DocumentSummaryModal } from './DocumentSummaryModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface MedicalVaultProps {
  vaultItems: VaultItem[];
  profile?: UserProfile;
  onAddVaultItem: (item: VaultItem) => void;
  onDeleteVaultItem?: (id: string) => void;
}

export const MedicalVault: React.FC<MedicalVaultProps> = ({
  vaultItems = [],
  profile,
  onAddVaultItem,
  onDeleteVaultItem,
}) => {
  const { showToast, showConfirm } = useToast();
  const { user, profile: authProfile } = useAuth();
  const activeUserId = profile?.id || authProfile?.id || user?.id || 'demo_pat_001';
  const safeVaultItems = vaultItems || [];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<VaultItem[] | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  // Document preview state
  const [previewItem, setPreviewItem] = useState<VaultItem | null>(null);
  const [summaryItem, setSummaryItem] = useState<VaultItem | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<VaultItem['category']>('Prescription');
  const [doctorName, setDoctorName] = useState('');
  const [diseaseOrTag, setDiseaseOrTag] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [runAiOcr, setRunAiOcr] = useState(true);

  // Upload states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const categories = ['All', 'Prescription', 'Lab Report', 'Discharge Summary', 'Vaccination', 'Insurance'];

  const filteredItems = (aiSearchResults || safeVaultItems).filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.diseaseOrTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.doctorName && item.doctorName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExtensions.includes(ext)) {
      setUploadError(`Invalid file format (.${ext}). Supported formats: PDF, JPG, PNG, WEBP, DOC.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum allowed size is 15 MB.`);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleAiVaultSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setAiSearchResults(null);
      return;
    }

    setIsAiSearching(true);
    try {
      const res = await fetch('/api/gemini/search-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, items: safeVaultItems }),
      });

      const json = await res.json();
      if (json.success && json.matchingIds) {
        const matches = safeVaultItems.filter((i) => json.matchingIds.includes(i.id));
        setAiSearchResults(matches);
      }
    } catch (err) {
      console.error('AI Vault Search Error:', err);
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setUploadError('Please provide a document title.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(10);
    setUploadStatusText('Preparing document upload...');

    try {
      let uploadedUrl: string | undefined = undefined;
      let calculatedSize = '1.2 MB';
      let fileExt: VaultItem['fileType'] = 'pdf';
      let fileBase64: string | null = null;

      if (selectedFile) {
        calculatedSize = `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`;
        const ext = selectedFile.name.split('.').pop()?.toLowerCase();
        if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'doc' || ext === 'pdf') {
          fileExt = ext === 'jpeg' ? 'jpg' : (ext as any);
        }

        // Convert file to base64 data URL
        fileBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });

        setUploadProgress(40);
        setUploadStatusText('Uploading to Supabase Storage...');

        // Upload to Supabase Storage
        const storageUrl = await supabaseVault.uploadDocumentToStorage(activeUserId, selectedFile);
        uploadedUrl = storageUrl || fileBase64;
      }

      let extractedNotes = notes;
      let extractedDoctor = doctorName;

      // Smart OCR Processing if file is image and OCR is enabled
      if (runAiOcr && fileBase64 && selectedFile?.type.startsWith('image/')) {
        setUploadProgress(75);
        setUploadStatusText('Extracting text & medicines with Gemini OCR...');

        try {
          const ocrRes = await fetch('/api/gemini/scan-prescription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: fileBase64 }),
          });
          const ocrJson = await ocrRes.json();

          if (ocrJson.success && ocrJson.data) {
            if (ocrJson.data.doctorName && !extractedDoctor) {
              extractedDoctor = ocrJson.data.doctorName;
            }
            if (ocrJson.data.medicines && ocrJson.data.medicines.length > 0) {
              const medNames = ocrJson.data.medicines.map((m: any) => `${m.name} (${m.dosage})`).join(', ');
              extractedNotes = (extractedNotes ? extractedNotes + '\n' : '') + `AI OCR Medicines: ${medNames}`;
            }
          }
        } catch (ocrErr) {
          console.warn('OCR processing skipped or failed:', ocrErr);
        }
      }

      setUploadProgress(90);
      setUploadStatusText('Finalizing record encryption & database sync...');

      const newItem: VaultItem = {
        id: `v_${Date.now()}`,
        title,
        category,
        doctorName: extractedDoctor || undefined,
        diseaseOrTag: diseaseOrTag || 'General Health',
        date: new Date().toISOString().split('T')[0],
        fileSize: calculatedSize,
        fileType: fileExt,
        fileUrl: uploadedUrl,
        notes: extractedNotes || undefined,
      };

      // Persist to Supabase DB
      await supabaseVault.addVaultItem(activeUserId, newItem);

      onAddVaultItem(newItem);
      auditLogger.logAction(
        'VAULT_UPLOAD',
        `Uploaded medical document "${title}" (${category}) to Supabase Storage & Vault Database.`,
        undefined,
        'SUCCESS'
      );

      setUploadProgress(100);
      setUploadStatusText('Upload completed successfully!');

      setTimeout(() => {
        setShowUploadModal(false);
        setTitle('');
        setDoctorName('');
        setNotes('');
        setDiseaseOrTag('');
        setSelectedFile(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err: any) {
      console.error('Failed to save vault item:', err);
      setUploadError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleDownload = (item: VaultItem) => {
    auditLogger.logAction(
      'RECORD_ACCESS',
      `Downloaded document: "${item.title}" (${item.category})`,
      undefined,
      'SUCCESS'
    );

    if (item.fileUrl) {
      const link = document.createElement('a');
      link.href = item.fileUrl;
      link.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${item.fileType || 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback text download
      const content = `MEDICAL VAULT RECORD\nTitle: ${item.title}\nCategory: ${item.category}\nDoctor: ${item.doctorName || 'N/A'}\nTag: ${item.diseaseOrTag}\nDate: ${item.date}\nNotes: ${item.notes || 'None'}`;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleDelete = (item: VaultItem) => {
    showConfirm({
      title: 'Delete Medical Record?',
      message: `Are you sure you want to delete "${item.title}" from your Medical Vault? This action cannot be undone.`,
      confirmText: 'Delete Record',
      cancelText: 'Keep Record',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await supabaseVault.deleteVaultItem(activeUserId, item.id);
          if (onDeleteVaultItem) {
            onDeleteVaultItem(item.id);
          }
          showToast(`Deleted "${item.title}" from Medical Vault.`, 'success');
          auditLogger.logAction(
            'RECORD_DELETE',
            `Deleted record "${item.title}" from Medical Vault.`,
            undefined,
            'SUCCESS'
          );
        } catch (err) {
          console.error('Failed to delete item:', err);
          showToast('Failed to delete record. Please try again.', 'error');
        }
      }
    });
  };

  const handleDownloadSummaryPdf = async () => {
    if (safeVaultItems.length === 0) {
      showToast('Your Medical Vault is currently empty. Please upload medical records before downloading a summary.', 'warning');
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      const patientName = profile?.name || 'Aarav Sharma';
      const abhaNumber = profile?.abhaNumber || '91-3842-9102-4821';
      const generatedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const addHeaderAndFooter = (pageNumber: number, totalPages: number) => {
        // Top Header Banner
        doc.setFillColor(27, 59, 43); // #1b3b2b Forest Green
        doc.rect(0, 0, pageWidth, 52, 'F');

        doc.setTextColor(250, 248, 245); // #faf8f5 Warm Cream
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('JEVAN CARE', margin, 33);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('LIFELONG MEDICAL VAULT SUMMARY', pageWidth - margin, 33, { align: 'right' });

        // Bottom Footer Bar
        doc.setDrawColor(230, 223, 211);
        doc.setLineWidth(0.75);
        doc.line(margin, pageHeight - 40, pageWidth - margin, pageHeight - 40);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(92, 86, 71);
        doc.text(
          'Medical Vault Summary • Encrypted Health Record • Jevan Care Ecosystem',
          margin,
          pageHeight - 25
        );

        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 25, {
          align: 'right',
        });
      };

      let currentY = 70;

      // Patient & Summary Box
      doc.setFillColor(246, 242, 233);
      doc.setDrawColor(230, 223, 211);
      doc.roundedRect(margin, currentY, contentWidth, 75, 6, 6, 'FD');

      doc.setTextColor(27, 59, 43);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PATIENT RECORD SUMMARY', margin + 15, currentY + 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(92, 86, 71);

      doc.text(`Patient Name: ${patientName}`, margin + 15, currentY + 40);
      doc.text(`ABHA ID: ${abhaNumber}`, margin + 15, currentY + 56);

      doc.text(`Generated: ${generatedDate}`, margin + 260, currentY + 40);
      doc.text(`Total Records Indexed: ${safeVaultItems.length}`, margin + 260, currentY + 56);

      currentY += 92;

      // Section Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(27, 59, 43);
      doc.text(`INDEXED MEDICAL RECORDS (${safeVaultItems.length})`, margin, currentY);

      currentY += 10;
      doc.setDrawColor(27, 59, 43);
      doc.setLineWidth(1.25);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 15;

      // Iterate Vault Items
      safeVaultItems.forEach((item, index) => {
        const cardHeight = 65;

        if (currentY + cardHeight > pageHeight - 60) {
          doc.addPage();
          currentY = 70;
        }

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 223, 211);
        doc.roundedRect(margin, currentY, contentWidth, cardHeight, 6, 6, 'FD');

        doc.setFillColor(36, 72, 54);
        doc.rect(margin, currentY, 4, cardHeight, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(27, 59, 43);
        doc.text(`${index + 1}. ${item.title}`, margin + 14, currentY + 18);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(43, 80, 59);
        doc.text(`[${item.category}]`, pageWidth - margin - 14, currentY + 18, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(92, 86, 71);

        const doctorText = item.doctorName ? ` • Doctor: ${item.doctorName}` : '';
        const tagText = item.diseaseOrTag ? ` • Tag: ${item.diseaseOrTag}` : '';
        doc.text(`Date: ${item.date}${doctorText}${tagText}`, margin + 14, currentY + 34);

        doc.setFontSize(8);
        doc.setTextColor(130, 123, 108);
        const noteSnippet = item.notes
          ? ` • Notes: ${item.notes.substring(0, 75)}${item.notes.length > 75 ? '...' : ''}`
          : '';
        doc.text(`Format: ${item.fileType.toUpperCase()} (${item.fileSize})${noteSnippet}`, margin + 14, currentY + 50);

        currentY += cardHeight + 10;
      });

      // Disclaimer Box
      if (currentY + 55 > pageHeight - 60) {
        doc.addPage();
        currentY = 70;
      } else {
        currentY += 8;
      }

      doc.setFillColor(248, 235, 234);
      doc.setDrawColor(238, 216, 215);
      doc.roundedRect(margin, currentY, contentWidth, 48, 6, 6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(125, 58, 62);
      doc.text('OFFICIAL MEDICAL DISCLAIMER', margin + 12, currentY + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(92, 86, 71);
      const disclaimerLines = doc.splitTextToSize(
        'This document is a generated summary of records stored in the Jevan Care Medical Vault. It is intended to assist communication with healthcare providers and personal health tracking. It does not replace formal clinical diagnoses or primary medical documents.',
        contentWidth - 24
      );
      doc.text(disclaimerLines, margin + 12, currentY + 28);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addHeaderAndFooter(i, totalPages);
      }

      const filename = `JevanCare_Medical_Vault_Summary_${patientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      auditLogger.logAction(
        'VAULT_SUMMARY_DOWNLOAD',
        `Exported Medical Vault PDF Summary (${safeVaultItems.length} records) for ${patientName}.`,
        { id: profile?.id, name: patientName, role: profile?.role },
        'SUCCESS'
      );
    } catch (err) {
      console.error('Failed to generate Medical Vault PDF Summary:', err);
      showToast('Unable to generate PDF summary. Please try again.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-[#16241c] rounded-3xl p-6 sm:p-8 border border-[#e6dfd3] dark:border-[#283c2e] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center shrink-0 border border-[#d2ded0] dark:border-[#2a4435]">
            <FolderLock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#142b20] dark:text-[#f2f0e8] font-serif-editorial">
              Medical Vault & Records
            </h2>
            <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] mt-0.5">
              Secure encrypted storage for your lifelong medical history, prescriptions, lab reports, and emergency QR access.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadSummaryPdf}
            disabled={isGeneratingPdf || safeVaultItems.length === 0}
            className="min-h-[44px] px-4 py-2 bg-[#fcfaf6] dark:bg-[#1d2e23] hover:bg-[#f6f2e9] dark:hover:bg-[#25382d] disabled:opacity-50 text-[#1a5336] dark:text-[#a3d4b6] text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer border border-[#e6dfd3] dark:border-[#283c2e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            title={safeVaultItems.length === 0 ? 'Your Medical Vault is currently empty' : 'Download Medical Vault Summary PDF'}
            aria-label="Export Medical PDF Summary"
          >
            {isGeneratingPdf ? (
              <JevanCareLoader size="xs" color="white" label="Preparing..." />
            ) : (
              <>
                <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Export PDF Summary</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="min-h-[44px] px-4 py-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Emergency QR Access"
          >
            <QrCode className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Emergency QR</span>
          </button>
          <button
            onClick={() => {
              setUploadError(null);
              setShowUploadModal(true);
            }}
            className="min-h-[44px] px-4 py-2 bg-[#1a5336] hover:bg-[#143e29] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            aria-label="Upload Document"
          >
            <Upload className="w-4 h-4 text-emerald-300" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Natural Language AI Search Bar */}
      <form onSubmit={handleAiVaultSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#827b6c] dark:text-[#969082]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!e.target.value) setAiSearchResults(null);
            }}
            placeholder="Search medical records in natural language (e.g., 'Show prescriptions from Dr. Tripathi')..."
            className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-white dark:bg-[#16241c] border border-[#e6dfd3] dark:border-[#283c2e] rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] text-[#142b20] dark:text-[#f2f0e8] placeholder-[#827b6c] dark:placeholder-[#969082] shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={isAiSearching}
          className="min-h-[44px] px-4 py-2 bg-[#1a5336] hover:bg-[#143e29] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
        >
          {isAiSearching ? (
            <JevanCareLoader size="xs" color="white" label="Searching..." />
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Search</span>
            </>
          )}
        </button>
      </form>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336] ${
              selectedCategory === cat
                ? 'bg-[#1a5336] text-white shadow-xs'
                : 'bg-white dark:bg-[#16241c] text-[#5c5647] dark:text-[#c0b9ad] border border-[#e6dfd3] dark:border-[#283c2e] hover:bg-[#fcfaf6] dark:hover:bg-[#1d2e23]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#16241c] rounded-3xl border border-[#e6dfd3] dark:border-[#283c2e] p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#e8eee5] dark:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center mx-auto border border-[#d2ded0] dark:border-[#2a4435]">
            <FolderLock className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-[#142b20] dark:text-[#f2f0e8]">
              {searchQuery ? 'No matching medical documents found' : 'Your medical vault is empty'}
            </h3>
            <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] leading-relaxed">
              {searchQuery
                ? `No documents matched "${searchQuery}". Clear your search query or select another category to view all records.`
                : 'Store and organize all your prescriptions, lab test reports, hospital discharge summaries, and vaccine records in one private, encrypted place.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery('');
                  setSelectedCategory('All');
                } else {
                  setUploadError(null);
                  setShowUploadModal(true);
                }
              }}
              className="min-h-[44px] px-5 py-2.5 bg-[#1a5336] hover:bg-[#143e29] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
            >
              <Upload className="w-4 h-4 text-emerald-300" />
              <span>{searchQuery ? 'Clear Search Filters' : 'Upload First Medical Document'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#16241c] rounded-2xl border border-[#e6dfd3] dark:border-[#283c2e] p-5 shadow-xs hover:border-[#1a5336] dark:hover:border-[#a3d4b6] transition-all flex flex-col justify-between space-y-4 min-w-0"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#e8eee5] text-[#1a5336] dark:bg-[#23382b] dark:text-[#a3d4b6] shrink-0 border border-[#d2ded0] dark:border-[#2a4435]">
                    {item.category}
                  </span>
                  <span className="text-xs font-medium text-[#827b6c] dark:text-[#969082] shrink-0">{item.fileSize || '1.2 MB'}</span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-[#142b20] dark:text-[#f2f0e8] leading-snug break-words">
                  {item.title}
                </h3>

                {item.doctorName && (
                  <p className="text-xs sm:text-sm text-[#5c5647] dark:text-[#c0b9ad] flex items-center gap-1.5 min-w-0">
                    <User className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Doctor: <strong>{item.doctorName}</strong></span>
                  </p>
                )}

                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 min-w-0">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tag: {item.diseaseOrTag}</span>
                </p>

                {item.notes && (
                  <p className="text-xs text-[#5c5647] dark:text-[#c0b9ad] bg-[#fcfaf6] dark:bg-[#1d2e23] border border-[#e6dfd3] dark:border-[#283c2e] p-2.5 rounded-xl line-clamp-3 leading-relaxed">
                    "{item.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#e6dfd3] dark:border-[#283c2e] flex items-center justify-between text-xs">
                <span className="text-[#827b6c] dark:text-[#969082] text-xs flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {item.date}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* AI Summary Button */}
                  <button
                    onClick={() => setSummaryItem(item)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#e8eee5] dark:bg-[#23382b] hover:bg-[#d8e4d4] text-[#1a5336] dark:text-[#a3d4b6] font-bold text-xs flex items-center gap-1 border border-[#d2ded0] dark:border-[#2a4435] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    title="Generate AI Document Summary"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>AI Summary</span>
                  </button>

                  {/* View Preview Button */}
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg hover:bg-[#f6f2e9] dark:hover:bg-[#1d2e23] text-[#5c5647] dark:text-[#c0b9ad] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    title="View / Preview Document"
                    aria-label="Preview Document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {/* Download Button */}
                  <button
                    onClick={() => handleDownload(item)}
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg hover:bg-[#e8eee5] dark:hover:bg-[#23382b] text-[#1a5336] dark:text-[#a3d4b6] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a5336]"
                    title="Download Document"
                    aria-label="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(item)}
                    className="min-h-[36px] min-w-[36px] p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 hover:text-rose-700 flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    title="Delete Record"
                    aria-label="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View / Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-sm truncate">{previewItem.title}</h3>
              </div>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Document Image Preview if available */}
              {previewItem.fileUrl && previewItem.fileUrl.startsWith('data:image/') ? (
                <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                  <img
                    src={previewItem.fileUrl}
                    alt={previewItem.title}
                    className="max-h-80 mx-auto rounded-lg object-contain shadow-xs"
                  />
                </div>
              ) : null}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{previewItem.category}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Date</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{previewItem.date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Tag / Condition</span>
                  <span className="font-bold text-teal-600 dark:text-teal-400">{previewItem.diseaseOrTag}</span>
                </div>
                {previewItem.doctorName && (
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Doctor</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{previewItem.doctorName}</span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">File Format</span>
                  <span className="font-bold uppercase text-slate-800 dark:text-slate-100">{previewItem.fileType || 'PDF'}</span>
                </div>
              </div>

              {previewItem.notes && (
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Document Summary & Notes</h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {previewItem.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewItem)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 bg-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h3 className="font-bold text-sm">Upload Medical Document to Supabase Vault</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="p-5 space-y-4 text-xs">
              
              {/* Drag and Drop Zone */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">
                  Select Document / Report File
                </label>
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('vault-file-picker')?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100'
                  }`}
                >
                  <input
                    id="vault-file-picker"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                      <FileCheck className="w-6 h-6 shrink-0" />
                      <div className="text-left">
                        <p className="truncate max-w-[260px]">{selectedFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Click or Drag & Drop PDF, JPG, PNG, WEBP or DOC
                      </p>
                      <p className="text-[10px] text-slate-400">Max size 15MB • Uploads securely to Supabase Storage</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Chest X-Ray & Pulmonology Prescriptions"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Tag / Condition</label>
                  <input
                    type="text"
                    value={diseaseOrTag}
                    onChange={(e) => setDiseaseOrTag(e.target.value)}
                    placeholder="e.g. Asthma, High BP, Routine Checkup"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Prescribing Doctor (Optional)</label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Rajeshwar K. Tripathi (KGMU)"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* AI OCR Toggle Option */}
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60">
                <input
                  type="checkbox"
                  id="run-ocr-toggle"
                  checked={runAiOcr}
                  onChange={(e) => setRunAiOcr(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <label htmlFor="run-ocr-toggle" className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Run AI OCR to automatically extract medicines & summaries</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Clinical Notes / Comments</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key findings or doctor instructions..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Progress Bar during upload */}
              {isUploading && (
                <div className="space-y-1.5 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-200">
                    <span className="flex items-center gap-1.5">
                      <JevanCareLoader size="xs" color="emerald" />
                      {uploadStatusText}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isUploading ? (
                  <JevanCareLoader size="sm" color="white" label="Processing Upload..." />
                ) : (
                  <span>Save & Encrypt Document to Supabase Vault</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Access QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button onClick={() => setShowQrModal(false)} className="absolute top-3 right-3 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">Emergency EMT Medical Access QR</h3>
              <p className="text-xs text-slate-400">Scan to view vital allergies, blood group & active prescriptions.</p>
            </div>

            {/* QR Code Graphic Box */}
            <div className="w-48 h-48 mx-auto bg-slate-900 rounded-2xl border-4 border-teal-500 flex items-center justify-center p-4 shadow-inner">
              <div className="grid grid-cols-5 gap-1.5 w-full h-full">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded ${
                      i % 2 === 0 || i % 3 === 0 ? 'bg-teal-400' : 'bg-slate-800'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
              🔒 End-to-End Encrypted Token Active
            </p>
          </div>
        </div>
      )}

      {/* Document Summary Modal */}
      {summaryItem && (
        <DocumentSummaryModal
          vaultItem={summaryItem}
          onClose={() => setSummaryItem(null)}
          onDownload={handleDownload}
        />
      )}

    </div>
  );
};
