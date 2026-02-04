'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Activity,
    Upload,
    FileImage,
    AlertTriangle,
    Loader2,
    Trash2,
    Shield,
    CheckCircle2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

interface ECGAnalysis {
    findings: string;
    interpretation: string;
    urgency: 'normal' | 'abnormal' | 'critical';
    recommendations: string[];
    disclaimer: string;
}

export default function ECGPage() {
    const router = useRouter();
    const { accessToken } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [analysis, setAnalysis] = useState<ECGAnalysis | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                setError('Please select an image or PDF file');
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setSelectedFile(file);
            setError('');

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreview(e.target?.result as string);
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setPreview(null);
        setAnalysis(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file');
            return;
        }

        setIsUploading(true);
        setError('');
        setAnalysis(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('notes', notes);
            formData.append('type', 'ecg');

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/medical/files/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            // Mock analysis for demo
            setAnalysis({
                findings: 'ECG uploaded successfully. Pattern analysis indicates normal sinus rhythm with regular intervals.',
                interpretation: 'The uploaded ECG shows standard waveform patterns. Heart rate and rhythm appear within normal parameters for the given context.',
                urgency: 'normal',
                recommendations: [
                    'Continue routine monitoring',
                    'Document any symptom changes',
                    'Follow up with cardiologist if symptoms develop',
                    'Maintain current treatment plan'
                ],
                disclaimer: 'AI-generated preliminary analysis for decision support only. Final interpretation must be made by qualified medical personnel.'
            });
        } catch (err) {
            setError('Failed to upload and analyze ECG. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const getUrgencyColor = (urgency: string) => {
        switch (urgency) {
            case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'abnormal': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            default: return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Activity className="text-rose-500" size={24} />
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                            ECG Upload & Analysis
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-4 space-y-6 pb-24">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">DEMO MODE - Decision Support Only</p>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            ECG analysis is AI-assisted preliminary screening. All findings require review by qualified cardiologists.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Upload ECG Recording
                    </h2>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {!selectedFile ? (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                            <div className="bg-slate-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center">
                                <Upload className="text-slate-400 dark:text-slate-500" size={32} />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-slate-700 dark:text-slate-300">
                                    Click to upload ECG image
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    PNG, JPG, or PDF up to 10MB
                                </p>
                            </div>
                        </button>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <FileImage className="text-blue-500" size={24} />
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-white">
                                            {selectedFile.name}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {(selectedFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleRemoveFile}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            {preview && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={preview}
                                    alt="ECG Preview"
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700"
                                />
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
                        Clinical Notes
                    </h2>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any relevant clinical context (patient history, current medications, symptoms)..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white resize-none"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={isUploading || !selectedFile}
                    className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Uploading & Analyzing...
                        </>
                    ) : (
                        <>
                            <Shield size={20} />
                            Upload & Analyze (Encrypted)
                        </>
                    )}
                </button>

                {analysis && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                                Analysis Results
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyColor(analysis.urgency)}`}>
                                {analysis.urgency}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Findings
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {analysis.findings}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Interpretation
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400">
                                {analysis.interpretation}
                            </p>
                        </div>

                        {analysis.recommendations.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Recommendations
                                </h3>
                                <ul className="space-y-2">
                                    {analysis.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <CheckCircle2 className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                                            {rec}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                {analysis.disclaimer}
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
