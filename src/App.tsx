/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Users, Printer, Download, Upload, Trash2, Plus, 
  Sparkles, Save, RotateCcw, CheckCircle2, Search, Building2, 
  Award 
} from 'lucide-react';

interface Student {
  nama: string;
  kelas: string;
  ortu: string;
  alamat: string;
  nominal: number;
}

interface TemplateConfig {
  noSurat: string;
  tglSurat: string;
  perihal: string;
  kepsek: string;
  nipKepsek: string;
  isi: string;
}

const DEFAULT_TEMPLATE: TemplateConfig = {
  noSurat: '421.2/ 045 / SMP.07 / X / 2026',
  tglSurat: 'Sentani, 5 Oktober 2026',
  perihal: 'Edaran Iuran Komite Siswa Tahun Ajaran 2026/2027',
  kepsek: 'Drs. Yohanes Wonda, M.Pd.',
  nipKepsek: '19680512 199303 1 004',
  isi: `Dengan hormat,

Bersama surat ini, kami sampaikan bahwa berdasarkan hasil Rapat Komite Sekolah SMP Negeri 7 Sentani tanggal 28 September 2026 serta mengacu pada Peraturan Menteri Pendidikan dan Kebudayaan, maka diputuskan besaran iuran komite siswa untuk Tahun Ajaran 2026/2027 sebagai berikut:

<table style="margin:2px 0 2px 10px; border-collapse:collapse; font-size:9pt; width:95%;">
  <tr><td style="padding:1px 6px 1px 0; width:100px;">Nama Siswa</td><td style="padding:1px 2px; width:10px;">:</td><td><b>{NAMA_SISWA}</b></td></tr>
  <tr><td>Kelas</td><td>:</td><td><b>{KELAS}</b></td></tr>
  <tr><td>Biaya Komite</td><td>:</td><td><b>Rp {NOMINAL}</b></td></tr>
  <tr><td>Terbilang</td><td>:</td><td><i>{TERBILANG} rupiah</i></td></tr>
</table>

Iuran tersebut diperuntukkan bagi kegiatan pendukung pembelajaran, pengembangan fasilitas sekolah, serta kegiatan kesiswaan selama satu tahun ajaran. Pembayaran dapat dilakukan paling lambat <b>31 Oktober 2026</b> melalui bendahara komite sekolah atau transfer ke rekening komite <b>BPD Papua - 0123.456.789</b> a.n. Komite SMPN 7 Sentani.

Demikian surat edaran ini kami sampaikan. Atas perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.`
};

const INITIAL_STUDENTS: Student[] = [
  { nama: "Maria Kambu", kelas: "7A", ortu: "Yance Kambu", alamat: "Kampung Khamka, Sentani", nominal: 750000 },
  { nama: "Markus Suebu", kelas: "7B", ortu: "Demianus Suebu", alamat: "Jl. Raya Dobonsolo, Sentani", nominal: 750000 },
  { nama: "Sarah Felle", kelas: "8A", ortu: "Yakob Felle", alamat: "Ifar Gunung, Sentani", nominal: 750000 },
  { nama: "Yonas Demena", kelas: "8C", ortu: "Martinus Demena", alamat: "Kampung Harapan, Sentani", nominal: 750000 }
];

function terbilang(n: number): string {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];
  n = Math.floor(Math.abs(n));
  if (n < 12) return satuan[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh ' + terbilang(n % 10);
  if (n < 200) return 'seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus ' + terbilang(n % 100);
  if (n < 2000) return 'seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta ' + terbilang(n % 1000000);
  return terbilang(Math.floor(n / 1000000000)) + ' miliar ' + terbilang(n % 1000000000);
}

function formatRp(n: number): string {
  return (n || 0).toLocaleString('id-ID');
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'template' | 'data' | 'preview'>('template');
  
  const [template, setTemplate] = useState<TemplateConfig>(() => {
    const saved = localStorage.getItem('smpn7_template_v4');
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATE;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('smpn7_students_v4');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [fNama, setFNama] = useState('');
  const [fKelas, setFKelas] = useState('');
  const [fOrtu, setFOrtu] = useState('');
  const [fAlamat, setFAlamat] = useState('');
  const [fNominal, setFNominal] = useState('750000');

  const [selectedPairIndex, setSelectedPairIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveTemplate = () => {
    localStorage.setItem('smpn7_template_v4', JSON.stringify(template));
    showToast('✅ Template surat berhasil disimpan!');
  };

  const handleResetTemplate = () => {
    if (!confirm('Reset template ke default SMPN 7 Sentani?')) return;
    setTemplate(DEFAULT_TEMPLATE);
    localStorage.removeItem('smpn7_template_v4');
    showToast('↺ Template dikembalikan ke default.');
  };

  const saveStudentsToStorage = (updated: Student[]) => {
    setStudents(updated);
    localStorage.setItem('smpn7_students_v4', JSON.stringify(updated));
  };

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fNama.trim() || !fKelas.trim() || !fOrtu.trim()) {
      alert('Nama siswa, kelas, dan nama orang tua wajib diisi!');
      return;
    }
    const newStudent: Student = {
      nama: fNama.trim(),
      kelas: fKelas.trim(),
      ortu: fOrtu.trim(),
      alamat: fAlamat.trim() || 'Sentani, Jayapura',
      nominal: parseInt(fNominal) || 750000
    };
    const updated = [...students, newStudent];
    saveStudentsToStorage(updated);
    setFNama('');
    setFKelas('');
    setFOrtu('');
    setFAlamat('');
    showToast(`✅ Siswa ${newStudent.nama} berhasil ditambahkan!`);
  };

  const handleDeleteStudent = (index: number) => {
    if (!confirm('Hapus data siswa ini?')) return;
    const updated = students.filter((_, i) => i !== index);
    saveStudentsToStorage(updated);
    showToast('🗑️ Data siswa dihapus.');
  };

  const handleDeleteAll = () => {
    if (!confirm('Hapus SEMUA data siswa?')) return;
    saveStudentsToStorage([]);
    showToast('🗑️ Semua data siswa telah dihapus.');
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      let startIdx = 0;
      if (/nama|siswa|kelas/i.test(lines[0])) startIdx = 1;
      const imported: Student[] = [];
      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 4) {
          imported.push({
            nama: cols[0],
            kelas: cols[1],
            ortu: cols[2],
            alamat: cols[3],
            nominal: parseInt(cols[4]) || 750000
          });
        }
      }
      if (imported.length > 0) {
        const updated = [...students, ...imported];
        saveStudentsToStorage(updated);
        showToast(`✅ Berhasil import ${imported.length} data siswa!`);
      } else {
        alert('Format CSV tidak dikenali atau kosong.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      alert('Tidak ada data untuk diexport.');
      return;
    }
    let csv = 'nama_siswa,kelas,nama_ortu,alamat,nominal\n';
    students.forEach(s => {
      csv += `"${s.nama}","${s.kelas}","${s.ortu}","${s.alamat}",${s.nominal}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'data_komite_smpn7_sentani.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Data berhasil diexport ke CSV.');
  };

  const handleAiEnhance = async (promptType: string) => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptType === 'formal' 
            ? 'Buatkan isi surat edaran komite sekolah yang sangat formal, meyakinkan, dan sopan mengenai rincian pembayaran iuran komite SMPN 7 Sentani dengan format tabel HTML ringkas.'
            : 'Buatkan surat edaran komite sekolah dengan nada persuasif, menekankan pentingnya partisipasi orang tua untuk kemajuan fasilitas siswa SMPN 7 Sentani di Papua.',
          currentContent: template.isi
        })
      });
      const data = await res.json();
      if (data.text) {
        setTemplate(prev => ({ ...prev, isi: data.text }));
        showToast('✨ Surat berhasil disempurnakan dengan AI!');
      } else {
        throw new Error(data.error || 'Gagal menghasilkan teks');
      }
    } catch (err: any) {
      console.error(err);
      alert('Gagal menghubungi AI Server: ' + (err.message || 'Error'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertPlaceholder = (ph: string) => {
    setTemplate(prev => ({ ...prev, isi: prev.isi + ` ${ph} ` }));
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s => 
      s.nama.toLowerCase().includes(q) || 
      s.kelas.toLowerCase().includes(q) || 
      s.ortu.toLowerCase().includes(q) ||
      s.alamat.toLowerCase().includes(q)
    );
  }, [students, searchQuery]);

  const studentPairs = useMemo(() => {
    const pairs: Student[][] = [];
    for (let i = 0; i < students.length; i += 2) {
      pairs.push(students.slice(i, i + 2));
    }
    return pairs;
  }, [students]);

  const totalBiayaSemua = useMemo(() => {
    return students.reduce((acc, s) => acc + (s.nominal || 0), 0);
  }, [students]);

  // Pristine single letter box
  const renderSingleLetterBox = (student: Student, isCompact = false) => {
    const rawIsi = template.isi
      .replace(/\{NAMA_SISWA\}/g, student.nama)
      .replace(/\{KELAS\}/g, student.kelas)
      .replace(/\{NAMA_ORTU\}/g, student.ortu)
      .replace(/\{ALAMAT\}/g, student.alamat)
      .replace(/\{NOMINAL\}/g, formatRp(student.nominal))
      .replace(/\{TERBILANG\}/g, terbilang(student.nominal));

    const isiHtml = rawIsi.split('\n').map(p => p.trim() ? `<p style="margin:${isCompact ? '2px 0' : '4px 0'}; text-align:justify;">${p}</p>` : '').join('');

    return `
      <div style="background: white; padding: ${isCompact ? '8px 12px' : '20px 28px'}; font-family: 'Times New Roman', serif; font-size: ${isCompact ? '8.5pt' : '10.5pt'}; line-height: 1.3; color: #000; border: 1px solid #cbd5e1; border-radius: 4px; box-sizing: border-box; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <!-- KOP SURAT DENGAN LOGO KIRI (PEMDA) & KANAN (SEKOLAH) -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 3px double #000; padding-bottom: 5px; margin-bottom: 6px;">
            <div style="width: 42px; text-align: center; flex-shrink: 0;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #1e3a8a; color: #fbbf24; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 7.5pt; margin: 0 auto; border: 2px solid #fbbf24;">
                PEMDA
              </div>
            </div>
            <div style="text-align: center; flex: 1; padding: 0 4px;">
              <p style="margin: 0; font-size: 8pt; font-weight: bold; letter-spacing: 0.5px;">PEMERINTAH KABUPATEN JAYAPURA</p>
              <p style="margin: 1px 0; font-size: 8pt; font-weight: bold; letter-spacing: 0.5px;">DINAS PENDIDIKAN DAN KEBUDAYAAN</p>
              <h3 style="margin: 1px 0; font-size: 11pt; font-weight: bold; font-family: Arial, sans-serif; color: #1e3a8a;">SMP NEGERI 7 SENTANI</h3>
              <p style="margin: 1px 0; font-size: 7pt;">Jl. Raya Sentani - Khamka, Distrik Sentani, Kabupaten Jayapura, Papua</p>
            </div>
            <div style="width: 42px; text-align: center; flex-shrink: 0;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: #047857; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 7.5pt; margin: 0 auto; border: 2px solid #fbbf24;">
                SMP 7
              </div>
            </div>
          </div>

          <!-- NOMOR, LAMPIRAN, PERIHAL DENGAN TITIK DUA DIRATAKAN -->
          <div style="margin: 3px 0;">
            <table style="border: none; width: auto; font-size: ${isCompact ? '8pt' : '10pt'}; border-collapse: collapse;">
              <tr>
                <td style="border:none; padding:1px 6px 1px 0; width:65px;">Nomor</td>
                <td style="border:none; padding:1px 2px 1px 0; width:10px; text-align:center;">:</td>
                <td style="border:none; padding:1px 0;">${template.noSurat}</td>
              </tr>
              <tr>
                <td style="border:none; padding:1px 6px 1px 0;">Lampiran</td>
                <td style="border:none; padding:1px 2px 1px 0; text-align:center;">:</td>
                <td style="border:none; padding:1px 0;">-</td>
              </tr>
              <tr>
                <td style="border:none; padding:1px 6px 1px 0;">Perihal</td>
                <td style="border:none; padding:1px 2px 1px 0; text-align:center;">:</td>
                <td style="border:none; padding:1px 0;"><b>${template.perihal}</b></td>
              </tr>
            </table>
          </div>

          <!-- TUJUAN SURAT -->
          <div style="margin: 5px 0;">
            <p style="margin:0;">Kepada Yth.</p>
            <p style="margin:1px 0;"><b>Bapak/Ibu Orang Tua/Wali Murid</b></p>
            <p style="margin:1px 0;"><b>${student.ortu}</b> (Wali dari <i>${student.nama}</i>)</p>
            <p style="margin:1px 0;">Di - <u style="letter-spacing:1px;">Sentani</u></p>
          </div>

          <!-- ISI SURAT -->
          <div style="margin-top: 3px;">${isiHtml}</div>
        </div>

        <!-- TANDA TANGAN -->
        <div style="margin-top: 6px; display: flex; justify-content: flex-end;">
          <div style="text-align: left; width: 190px; font-size: ${isCompact ? '8pt' : '10pt'};">
            <p style="margin:0;">${template.tglSurat}</p>
            <p style="margin:1px 0 ${isCompact ? '20px' : '35px'} 0;">Kepala SMP Negeri 7 Sentani,</p>
            <p style="margin:0; font-weight: bold; text-decoration: underline;">${template.kepsek}</p>
            <p style="margin:1px 0 0 0;">NIP. ${template.nipKepsek}</p>
          </div>
        </div>
      </div>
    `;
  };

  const handlePrintSingle = (student: Student) => {
    const htmlContent = renderSingleLetterBox(student, false);
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Edaran Komite - ${student.nama}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 15px; color: #000; background: #fff; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div style="height: 100vh;">${htmlContent}</div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintAll = () => {
    if (students.length === 0) {
      alert('Tidak ada data siswa.');
      return;
    }
    if (!confirm(`Akan mencetak surat edaran untuk ${students.length} siswa (2 siswa per lembar A4). Lanjutkan?`)) return;

    const pagesHtml = studentPairs.map((pair) => {
      const surat1 = renderSingleLetterBox(pair[0], true);
      const surat2 = pair[1] ? renderSingleLetterBox(pair[1], true) : '<div style="background:transparent; height:100%;"></div>';
      
      return `
        <div class="print-page">
          <div class="surat-half">${surat1}</div>
          <div class="fold-line"><span>✂ ----- GUNTING DI SINI UNTUK DIBAGIKAN KE SISWA KEDUA ----- ✂</span></div>
          <div class="surat-half">${surat2}</div>
        </div>
      `;
    }).join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up terblokir oleh browser.');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>Edaran Biaya Komite - SMPN 7 Sentani (2 Siswa per Lembar)</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; color: #000; background: #fff; }
          .print-page {
            width: 210mm;
            height: 297mm;
            padding: 8mm 12mm;
            box-sizing: border-box;
            page-break-after: always;
            break-after: page;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .surat-half {
            height: 48.5%;
            box-sizing: border-box;
          }
          .fold-line {
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
            color: #475569;
            border-bottom: 1px dashed #64748b;
            margin: 2mm 0;
            position: relative;
          }
          .fold-line span {
            background: #fff;
            padding: 0 8px;
            position: relative;
            top: 4px;
          }
          @media print {
            body { margin: 0; }
            .print-page { page-break-after: always; break-after: page; }
            .fold-line { border-bottom: 1px dashed #94a3b8; }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const currentPair = studentPairs[selectedPairIndex] || studentPairs[0] || [];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-800 rounded-xl shadow-inner border border-blue-700">
              <Building2 className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Edaran Biaya Komite</h1>
              <p className="text-xs text-blue-200">SMP Negeri 7 Sentani | Sistem Mail Merge Surat Edaran (2 Siswa per Lembar)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs bg-blue-950/60 px-4 py-2 rounded-lg border border-blue-800">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-300" /> <b>{students.length}</b> Siswa</span>
            <span className="text-blue-400">|</span>
            <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-emerald-400" /> Total: Rp {formatRp(totalBiayaSemua)}</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 flex gap-2">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'template'
                ? 'border-blue-900 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Template Surat & Kop
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'data'
                ? 'border-blue-900 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" /> Data Orang Tua & Siswa
            <span className="ml-1 bg-blue-100 text-blue-900 text-xs px-2 py-0.5 rounded-full font-bold">{students.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'preview'
                ? 'border-blue-900 text-blue-900 bg-blue-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Printer className="w-4 h-4" /> Pratinjau 2 Siswa & Cetak
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Active Tab Content */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'template' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-800" /> Konfigurasi Template Edaran Biaya Komite
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAiEnhance('formal')}
                    disabled={isAiLoading}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} /> {isAiLoading ? 'Menyusun...' : 'AI Sempurnakan'}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-800 p-3 mb-4 rounded-r-lg text-xs text-blue-900 leading-relaxed">
                Kop surat menampilkan <b>Logo Pemda</b> (kiri) dan <b>Logo Sekolah</b> (kanan). Titik dua pada nomor dan perihal surat diratakan secara presisi.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Surat</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    value={template.noSurat}
                    onChange={e => setTemplate({ ...template, noSurat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Surat</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    value={template.tglSurat}
                    onChange={e => setTemplate({ ...template, tglSurat: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Perihal Surat</label>
                <input
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  value={template.perihal}
                  onChange={e => setTemplate({ ...template, perihal: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    value={template.kepsek}
                    onChange={e => setTemplate({ ...template, kepsek: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                  <input
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-900 focus:outline-none"
                    value={template.nipKepsek}
                    onChange={e => setTemplate({ ...template, nipKepsek: e.target.value })}
                  />
                </div>
              </div>

              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Isi Surat (Mendukung HTML & Placeholder)</label>
                  <div className="flex gap-1 flex-wrap">
                    <button type="button" onClick={() => insertPlaceholder('{NAMA_SISWA}')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded border border-slate-300">+ Nama Siswa</button>
                    <button type="button" onClick={() => insertPlaceholder('{KELAS}')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded border border-slate-300">+ Kelas</button>
                    <button type="button" onClick={() => insertPlaceholder('{NOMINAL}')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded border border-slate-300">+ Nominal</button>
                    <button type="button" onClick={() => insertPlaceholder('{TERBILANG}')} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] rounded border border-slate-300">+ Terbilang</button>
                  </div>
                </div>
                <textarea
                  rows={12}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-900 focus:outline-none leading-relaxed"
                  value={template.isi}
                  onChange={e => setTemplate({ ...template, isi: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm"
                >
                  <Save className="w-4 h-4" /> Simpan Template
                </button>
                <button
                  onClick={handleResetTemplate}
                  className="flex items-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-2 rounded-lg text-xs font-semibold"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Default
                </button>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              {/* Add Student Form */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-base font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-800" /> Tambah Data Orang Tua & Siswa
                </h2>
                <form onSubmit={handleAddStudent} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        placeholder="Contoh: Maria Kambu"
                        value={fNama}
                        onChange={e => setFNama(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        placeholder="Contoh: 7A"
                        value={fKelas}
                        onChange={e => setFKelas(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Orang Tua/Wali</label>
                      <input
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        placeholder="Contoh: Yance Kambu"
                        value={fOrtu}
                        onChange={e => setFOrtu(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Biaya Komite (Rp)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                        value={fNominal}
                        onChange={e => setFNominal(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat / Kampung</label>
                    <input
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                      placeholder="Contoh: Kampung Khamka, Sentani"
                      value={fAlamat}
                      onChange={e => setFAlamat(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Simpan & Tambah ke Daftar
                  </button>
                </form>
              </div>

              {/* CSV & Batch Action Panel */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-base font-bold text-blue-900 mb-3">📂 Import / Export Data CSV</h2>
                <div className="flex flex-wrap gap-2">
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-4 h-4" /> Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
                  </label>
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm ml-auto"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus Semua
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-800" /> Kontrol Cetak (2 Siswa per Lembar)
              </h2>
              <div className="bg-emerald-50 border-l-4 border-emerald-600 p-3 text-xs text-emerald-900 leading-relaxed">
                Pratinjau di sebelah kanan menampilkan 2 surat edaran siswa dalam 1 lembar halaman A4 lengkap dengan garis potong.
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Pilih Pasangan Lembar A4 (2 Siswa):</label>
                <select
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  value={selectedPairIndex}
                  onChange={e => setSelectedPairIndex(parseInt(e.target.value))}
                >
                  {studentPairs.map((pair, idx) => (
                    <option key={idx} value={idx}>
                      Lembar A4 #{idx + 1}: {pair[0]?.nama} {pair[1] ? `& ${pair[1].nama}` : '(Siswa Tunggal)'}
                    </option>
                  ))}
                  {studentPairs.length === 0 && <option value={0}>Belum ada data siswa</option>}
                </select>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handlePrintAll}
                    disabled={students.length === 0}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg text-xs shadow-sm flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Cetak Semua Lembar A4 ({studentPairs.length} Lembar)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Student List Table Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-900" /> Daftar Siswa ({filteredStudents.length} dari {students.length})
              </h3>
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-none"
                  placeholder="Cari siswa / kelas / ortu..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[350px] border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Nama Siswa</th>
                    <th className="p-2.5">Kelas</th>
                    <th className="p-2.5">Orang Tua</th>
                    <th className="p-2.5">Nominal</th>
                    <th className="p-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, idx) => {
                    const originalIndex = students.findIndex(item => item.nama === s.nama && item.kelas === s.kelas);
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 font-medium text-slate-500">{originalIndex + 1}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{s.nama}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded font-medium">{s.kelas}</span>
                        </td>
                        <td className="p-2.5 text-slate-700">{s.ortu}</td>
                        <td className="p-2.5 font-medium text-emerald-700">Rp {formatRp(s.nominal)}</td>
                        <td className="p-2.5 text-center flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              // find which pair this student belongs to
                              const pairIdx = Math.floor(originalIndex / 2);
                              setSelectedPairIndex(pairIdx);
                              setActiveTab('preview');
                            }}
                            className="p-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded"
                            title="Pratinjau Lembar A4"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(originalIndex)}
                            className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Tidak ada data siswa ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side: Live 2-Student Sheet Preview */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-blue-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-800" /> Pratinjau 1 Lembar A4 (2 Siswa)
              </h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                Lembar #{selectedPairIndex + 1}
              </span>
            </div>

            <div className="max-h-[720px] overflow-y-auto border-2 border-dashed border-slate-300 rounded-lg p-3 bg-slate-200 space-y-3 shadow-inner">
              {currentPair.length > 0 ? (
                <>
                  {/* Siswa 1 (Bagian Atas) */}
                  <div className="bg-white rounded shadow-sm overflow-hidden">
                    <div className="bg-blue-900 text-white text-[10px] px-2 py-0.5 font-bold flex justify-between">
                      <span>BAGIAN ATAS: {currentPair[0].nama} ({currentPair[0].kelas})</span>
                      <button onClick={() => handlePrintSingle(currentPair[0])} className="hover:underline text-amber-300">Cetak Satuan</button>
                    </div>
                    <div dangerouslySetInnerHTML={{ __html: renderSingleLetterBox(currentPair[0], true) }} />
                  </div>

                  {/* Garis Potong Pratinjau */}
                  <div className="text-center my-1">
                    <span className="inline-block bg-amber-100 text-amber-900 text-[9px] font-bold px-3 py-0.5 rounded-full border border-amber-300 shadow-xs">
                      ✂ ----- GUNTING DI SINI UNTUK DIBAGIKAN KE SISWA KEDUA ----- ✂
                    </span>
                  </div>

                  {/* Siswa 2 (Bagian Bawah) */}
                  {currentPair[1] ? (
                    <div className="bg-white rounded shadow-sm overflow-hidden">
                      <div className="bg-blue-900 text-white text-[10px] px-2 py-0.5 font-bold flex justify-between">
                        <span>BAGIAN BAWAH: {currentPair[1].nama} ({currentPair[1].kelas})</span>
                        <button onClick={() => handlePrintSingle(currentPair[1])} className="hover:underline text-amber-300">Cetak Satuan</button>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: renderSingleLetterBox(currentPair[1], true) }} />
                    </div>
                  ) : (
                    <div className="bg-white/80 rounded border-2 border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 italic">
                      (Sisa lembar kosong - jumlah siswa ganjil)
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20 text-slate-400 text-xs">
                  Belum ada data siswa untuk dipratinjau.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-8 text-center text-xs text-slate-500">
        <p>Edaran Biaya Komite — SMP Negeri 7 Sentani, Kabupaten Jayapura, Papua © 2026</p>
      </footer>
    </div>
  );
}
