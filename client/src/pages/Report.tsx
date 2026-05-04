import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Github, Download } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import { downloadFile } from '../lib/utils';

export function Report() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);
  const setLoading = useAppStore((state) => state.setLoading);
  const currentTask = useAppStore((state) => state.currentTask);
  
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    if (!currentTask) {
      navigate(`/task/${id}`);
      return;
    }
  }, [id, navigate, currentTask]);

  const handleGenerateReport = async () => {
    if (!id) return;

    try {
      setIsGenerating(true);
      setLoading(true);
      const reportContent = await api.generateReport(id);
      setReport(reportContent);
      
      addToast({
        title: 'Report generated',
        description: 'Security report has been generated successfully.',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Report generation failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        type: 'error',
        action: {
          label: 'Retry',
          onClick: handleGenerateReport,
        },
      });
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (report) {
      downloadFile(report, `security-report-${id}.md`, 'text/markdown');
    }
  };

  const handleOpenGitHubIssue = () => {
    // This would typically open a GitHub issue with the report content
    addToast({
      title: 'GitHub integration',
      description: 'GitHub issue creation is not implemented in this demo.',
      type: 'info',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/task/${id}`)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Task
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">Security Report</h1>
              <p className="text-muted-foreground">
                Comprehensive security analysis report for task {id}
              </p>
            </div>
            
            <div className="flex gap-2">
              {!report && (
                <button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                </button>
              )}
              
              {report && (
                <>
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
                  
                  <button
                    onClick={handleOpenGitHubIssue}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    Open GitHub Issue
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {isGenerating ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Generating security report...</p>
            </div>
          ) : report ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No report generated yet</h3>
              <p className="text-muted-foreground mb-6">
                Generate a comprehensive security report for this analysis.
              </p>
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
