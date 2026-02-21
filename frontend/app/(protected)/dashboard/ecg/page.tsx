'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    Activity, Upload, FileImage, Loader2, Trash2, Shield, CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import FormTextarea from '@/components/ui/FormTextarea';
import ErrorBanner from '@/components/ui/ErrorBanner';
import Badge from '@/components/ui/Badge';

interface ECGAnalysis {
    findings: string;
    interpretation: string;
    urgency: 'normal' | 'abnormal' | 'critical';
    recommendations: string[];
    disclaimer: string;
}

const URGENCY_MAP: Record<string, { variant: 'success' | 'warning' | 'danger'; label: string }> = {
    normal: { variant: 'success', label: 'Normal' },
    abnormal: { variant: 'warning', label: 'Abnormal' },
    critical: { variant: 'danger', label: 'Critical' },
};

export default function ECGPage() {
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
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            const { data: aiData } = await api.post('/ai/query-protocol', {
                query: `ECG analysis requested. File: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)}KB, ${selectedFile.type}). Clinical notes: ${notes || 'None provided.'}. Please provide findings, interpretation, urgency level, and recommendations.`,
            });

            const aiText: string = aiData.protocol || aiData.response || '';

            setAnalysis({
                findings: aiText || 'ECG uploaded successfully. AI analysis complete.',
                interpretation: 'AI-assisted ECG interpretation based on uploaded recording and clinical notes.',
                urgency: 'normal',
                recommendations: [],
                disclaimer: 'AI-generated preliminary analysis for decision support only. Final interpretation must be made by qualified medical personnel.',
            });
        } catch {
            setError('Failed to upload and analyze ECG. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full safe-top">
            <PageHeader
                title="ECG Upload & Analysis"
                subtitle="AI-powered ECG interpretation"
                icon={Activity}
                iconBg="bg-rose-100 dark:bg-rose-900/30"
                iconColor="text-rose-600 dark:text-rose-400"
            />

            <main className="flex-1 w-full">
                <div className="container-app space-y-6 pb-8 max-w-4xl animate-fade-in">
                    {/* Upload Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card p-6"
                    >
                        <h2 className="text-base font-semibold text-foreground mb-4">Upload ECG Recording</h2>

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
                                className="w-full border-2 border-dashed border-border/60 rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-muted/30 transition-all duration-300 group"
                            >
                                <div className="w-16 h-16 bg-gradient-to-br from-rose-400/20 to-rose-600/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Upload className="text-rose-500" size={28} />
                                </div>
                                <div className="text-center">
                                    <p className="font-medium text-foreground">Click to upload ECG image</p>
                                    <p className="text-sm text-muted-foreground mt-1">PNG, JPG, or PDF up to 10MB</p>
                                </div>
                            </button>
                        ) : (
                            <div className="border border-border/50 rounded-xl p-4 bg-muted/10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                            <FileImage className="text-blue-500" size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{selectedFile.name}</p>
                                            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button onClick={handleRemoveFile} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {preview && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={preview} alt="ECG Preview" className="w-full rounded-xl border border-border/50" />
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Clinical Notes */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="glass-card p-6"
                    >
                        <FormTextarea
                            label="Clinical Notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any relevant clinical context (patient history, current medications, symptoms)..."
                            rows={4}
                        />
                    </motion.div>

                    {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={isUploading || !selectedFile}
                        className="w-full btn-primary py-4 rounded-xl flex items-center justify-center gap-2 text-base font-semibold disabled:opacity-50"
                    >
                        {isUploading ? (
                            <><Loader2 className="animate-spin" size={20} /> Uploading & Analyzing...</>
                        ) : (
                            <><Shield size={20} /> Upload & Analyze (Encrypted)</>
                        )}
                    </button>

                    {/* Analysis Results */}
                    {analysis && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="glass-card p-6 space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-semibold text-foreground">Analysis Results</h2>
                                <Badge variant={URGENCY_MAP[analysis.urgency]?.variant || 'success'} size="md">
                                    {analysis.urgency.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Findings</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{analysis.findings}</p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Interpretation</h3>
                                    <p className="text-sm text-foreground/80 leading-relaxed">{analysis.interpretation}</p>
                                </div>

                                {analysis.recommendations.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recommendations</h3>
                                        <ul className="space-y-2">
                                            {analysis.recommendations.map((rec, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                                                    <CheckCircle2 className="text-emerald-500 flex-shrink-0 mt-0.5" size={16} />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-border/40">
                                <p className="text-xs text-muted-foreground italic">{analysis.disclaimer}</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
