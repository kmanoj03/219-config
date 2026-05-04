import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Image, Play, ScanSearch, Sparkles } from 'lucide-react';
import { Tabs } from '../components/Tabs';
import { ImageDropzone } from '../components/ImageDropzone';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { FileType } from '../lib/types';

export function Home() {
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);
  const setLoading = useAppStore((state) => state.setLoading);
  const isLoading = useAppStore((state) => state.isLoading);
  
  const [activeTab, setActiveTab] = useState('text');
  const [content, setContent] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [fileType, setFileType] = useState<FileType>('dockerfile');
  const fileTypeOptions: Array<{ value: FileType; label: string }> = [
    { value: 'dockerfile', label: 'Dockerfile' },
    { value: 'k8s', label: 'Kubernetes YAML' },
    { value: 'env', label: 'Environment File' },
    { value: 'nginx', label: 'Nginx Config' },
    { value: 'iam', label: 'IAM Policy' },
  ];

  // Reset loading state when component mounts (e.g., when returning from task page)
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  const handleAnalyze = async () => {
    if (!content.trim() && !imageBase64) {
      addToast({
        title: 'No content provided',
        description: 'Please provide either text content or upload an image.',
        type: 'error',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Show immediate feedback that analysis has started
      addToast({
        title: 'Analysis started',
        description: 'Your configuration is being analyzed...',
        type: 'info',
      });
      
      // Step 1: Create the task
      const taskId = await api.createTask(content, fileType, imageBase64 || undefined);
      
      // Step 2: Immediately analyze the task
      const findings = await api.analyzeTask(taskId);
      
      // Step 3: Show success toast with results
      addToast({
        title: 'Analysis completed',
        description: `Found ${findings.length} security issues in your ${fileType} configuration.`,
        type: 'success',
      });
      
      // Step 4: Navigate to the task page (which will already be analyzed)
      navigate(`/task/${taskId}`);
    } catch (error) {
      addToast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
        action: {
          label: 'Retry',
          onClick: handleAnalyze,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      id: 'text',
      label: 'Paste Text',
      content: (
        <div className="space-y-4">
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium mb-2">
              File Type
            </label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fileTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">
              Configuration Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your configuration file content here..."
              className="w-full h-64 px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'image',
      label: 'Upload Image',
      content: (
        <div className="space-y-4">
          <div>
            <label htmlFor="fileType" className="block text-sm font-medium mb-2">
              File Type
            </label>
            <select
              id="fileType"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as FileType)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {fileTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <ImageDropzone onBase64={setImageBase64} />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl border border-border bg-gradient-to-b from-card to-card/50 p-8 md:p-10 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-4">
                  <ScanSearch className="h-3.5 w-3.5" />
                  Findings-only security analysis
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Scan config files and surface security findings fast
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Upload an image or paste raw config text, select file type, and get prioritized findings with evidence and actionable recommendations.
                </p>
              </div>

              <div className="w-full max-w-xs rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-medium mb-3">What you get</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Severity-ranked findings
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Evidence-linked insights
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="h-4 w-4 text-primary" />
                    OCR support for screenshots
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6 md:p-7 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Start analysis</h2>
                <p className="text-sm text-muted-foreground">
                  Choose your input format and run a focused findings scan.
                </p>
              </div>
            </div>
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={(!content.trim() && !imageBase64) || isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Play className="h-4 w-4" />
                Analyze for Findings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
