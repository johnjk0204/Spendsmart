"use client";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { uploadApi } from "@/lib/api";
import {
  Upload, FileText, Image, CheckCircle2, AlertCircle,
  Loader2, X, TrendingDown, Sparkles, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface UploadResult {
  message: string;
  transactions_found: number;
  transactions_saved: number;
  insights: Record<string, unknown>;
  health_score: number;
  recommendations: { title: string; description: string; priority: string }[];
  errors: string[];
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfPassword, setPdfPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [textMode, setTextMode] = useState(false);
  const [pasteText, setPasteText] = useState("");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (pdfPassword) formData.append("pdf_password", pdfPassword);
      const { data } = await uploadApi.file(formData);
      setResult(data);
      toast.success(`Extracted ${data.transactions_saved} transactions!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    setResult(null);
    try {
      const { data } = await uploadApi.analyzeText(pasteText);
      setResult(data);
      toast.success("Analysis complete!");
    } catch {
      toast.error("Analysis failed");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPdfPassword("");
    setResult(null);
    setPasteText("");
  };

  const isPdf = file?.name.toLowerCase().endsWith(".pdf");

  return (
    <div>
      <Header title="Upload Statement" subtitle="Import your bank statement or receipt" />
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Mode toggle */}
        <div className="flex gap-2">
          {["File Upload", "Paste Text"].map((mode, i) => (
            <button
              key={mode}
              onClick={() => { setTextMode(i === 1); reset(); }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                textMode === (i === 1)
                  ? "bg-violet-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>

        {!textMode ? (
          /* Drop zone */
          <div>
            {!file ? (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-border hover:border-violet-500/50 hover:bg-accent/50"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-violet-400" />
                </div>
                <p className="text-lg font-semibold mb-2">
                  {isDragActive ? "Drop to upload" : "Upload your bank statement"}
                </p>
                <p className="text-muted-foreground text-sm">
                  Supports PDF, CSV, PNG, JPG (max 10MB)
                </p>
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> PDF</span>
                  <span className="flex items-center gap-1.5"><Image className="w-3.5 h-3.5" /> Screenshot</span>
                  <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> CSV</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={reset} className="p-2 rounded-lg hover:bg-accent transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {file && !result && isPdf && (
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm font-medium text-amber-400 mb-2">
                  PDF Password (if protected)
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Common passwords: <span className="text-amber-300">Customer ID</span>, date of birth (DDMMYYYY), or PAN number.
                </p>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="e.g. Customer ID, 01011990 or ABCDE1234F"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                />
              </div>
            )}

            {file && !result && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI is analyzing your statement...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Analyze with AI
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          /* Text paste */
          <div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your bank statement text here..."
              rows={10}
              className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none font-mono"
            />
            <button
              onClick={handleTextAnalysis}
              disabled={uploading || !pasteText.trim()}
              className="w-full mt-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {uploading ? "Analyzing..." : "Analyze Text"}
            </button>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-semibold text-emerald-400">Analysis Complete</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{result.transactions_found}</div>
                    <div className="text-xs text-muted-foreground">Found</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{result.transactions_saved}</div>
                    <div className="text-xs text-muted-foreground">Saved</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-violet-400">{result.health_score?.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Health Score</div>
                  </div>
                </div>
              </div>

              {/* Spending insights */}
              {result.insights && Object.keys(result.insights).length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-violet-400" />
                    Spending Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ["Total Spent", formatCurrency((result.insights as Record<string, number>).total_spent ?? 0)],
                      ["Total Income", formatCurrency((result.insights as Record<string, number>).total_income ?? 0)],
                      ["Net Savings", formatCurrency((result.insights as Record<string, number>).net_savings ?? 0)],
                      ["Transactions", String((result.insights as Record<string, unknown>).transaction_count ?? 0)],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between py-2 border-b border-border/50">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-400" />
                    AI Recommendations
                  </h4>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-accent/50">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          rec.priority === "high" ? "bg-rose-500" : rec.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
                        )} />
                        <div>
                          <p className="text-sm font-medium">{rec.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={reset}
                className="w-full py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Upload Another Statement
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
