import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { CodeViewer } from '../components/CodeViewer';
import { FindingCard } from '../components/FindingCard';
import { Spinner } from '../components/Spinner';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { Task, Finding, FileType, Severity } from '../lib/types';
import { fileTypeIconMap } from '../lib/types';
import { formatDate } from '../lib/utils';

const severityRank: Record<Severity, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function TaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addToast = useAppStore((state) => state.addToast);
  const setLoading = useAppStore((state) => state.setLoading);
  const setCurrentTask = useAppStore((state) => state.setCurrentTask);
  const selectedFinding = useAppStore((state) => state.selectedFinding);
  const setSelectedFinding = useAppStore((state) => state.setSelectedFinding);
  
  const [task, setTask] = useState<Task | null>(null);
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchTask = async () => {
      try {
        const taskData = await api.getTask(id);
        setTask(taskData);
        setCurrentTask(taskData);
        setSelectedFinding(null);
        setHasAutoAnalyzed(false); // Reset for new task
      } catch (error) {
        addToast({
          title: 'Failed to load task',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          type: 'error',
        });
        navigate('/');
      }
    };

    fetchTask();
  }, [id, navigate, addToast, setCurrentTask, setSelectedFinding]);

  // Note: Auto-analysis is no longer needed since the home page handles complete analysis
  // This useEffect is kept for edge cases where users directly navigate to an INGESTED task
  useEffect(() => {
    if (!task || task.state !== 'INGESTED' || hasAutoAnalyzed) return;

    // Only auto-analyze if user directly navigated to an INGESTED task (edge case)
    const autoAnalyze = async () => {
      try {
        setLoading(true);
        await api.analyzeTask(task.id);
        // Fetch updated task data to get OCR text
        const updatedTask = await api.getTask(task.id);
        setTask(updatedTask);
        setCurrentTask(updatedTask);
        setHasAutoAnalyzed(true);
        
        // Silent auto-analysis for edge cases
      } catch (error) {
        addToast({
          title: 'Analysis failed',
          description: error instanceof Error ? error.message : 'An unexpected error occurred.',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    autoAnalyze();
  }, [task, addToast, setCurrentTask, setLoading, hasAutoAnalyzed]);


  const handleFindingSelect = (finding: Finding) => {
    setSelectedFinding(finding);
  };

  const findings = task?.findings || [];

  const severityCounts = findings.reduce<Record<Severity, number>>(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 }
  );

  const topSeverity =
    findings.length > 0
      ? findings.reduce((max, finding) =>
          severityRank[finding.severity] > severityRank[max.severity] ? finding : max
        ).severity
      : null;

  const riskTone =
    topSeverity === 'CRITICAL'
      ? 'Critical'
      : topSeverity === 'HIGH'
      ? 'High'
      : topSeverity === 'MEDIUM'
      ? 'Moderate'
      : findings.length > 0
      ? 'Low'
      : 'Clean';

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'ANALYZED':
      case 'PLANNED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'VERIFIED':
      case 'REPORTED':
      case 'DONE':
        return <CheckCircle className="h-4 w-4 text-purple-500" />;
      case 'INGESTED':
        return <Spinner size="sm" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'ANALYZED':
      case 'PLANNED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'VERIFIED':
      case 'REPORTED':
      case 'DONE':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'INGESTED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>
          
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                  Findings Dashboard
                </p>
                <h1 className="text-2xl font-bold">Task {task.id}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fileTypeIconMap[task.fileType as FileType]}</span>
                    <span className="font-medium">{task.fileType.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStateIcon(task.state)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(task.state)}`}>
                      {task.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDate(task.createdAt)}
                  </div>
                </div>
              </div>

              <div className="min-w-44 rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Risk level</p>
                <p className="text-xl font-semibold">{riskTone}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {findings.length} finding{findings.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Critical</p>
                <p className="text-lg font-semibold text-rose-600 dark:text-rose-400">{severityCounts.CRITICAL}</p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">{severityCounts.HIGH}</p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Medium</p>
                <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">{severityCounts.MEDIUM}</p>
              </div>
              <div className="rounded-lg border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">{severityCounts.LOW}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Inspected Content
            </h2>
            <CodeViewer
              value={task.input.text || ''}
              language={task.fileType === 'k8s' ? 'yaml' : 'dockerfile'}
              highlightRange={selectedFinding?.lineRange ? [selectedFinding.lineRange[0], selectedFinding.lineRange[1]] : undefined}
            />
          </div>

          <div className="lg:col-span-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Findings ({findings.length})
            </h2>

            {findings.length > 0 ? (
              <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
                {findings.map((finding) => (
                  <FindingCard
                    key={finding.id}
                    finding={finding}
                    isSelected={selectedFinding?.id === finding.id}
                    onSelect={() => handleFindingSelect(finding)}
                  />
                ))}
              </div>
            ) : task.state === 'ANALYZED' || task.state === 'PLANNED' ? (
              <div className="text-center py-12 border border-border rounded-xl bg-card">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No security issues found</h3>
                <p className="text-muted-foreground">
                  This configuration passed the current security checks.
                </p>
              </div>
            ) : task.state === 'INGESTED' ? (
              <div className="text-center py-12 border border-border rounded-xl bg-card">
                <Spinner size="lg" className="mx-auto mb-4" />
                <p className="text-muted-foreground">Analyzing configuration...</p>
              </div>
            ) : (
              <div className="text-center py-12 border border-border rounded-xl bg-card">
                <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Findings are not available yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
