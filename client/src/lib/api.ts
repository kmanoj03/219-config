import type { 
  Task, 
  Finding
} from './types';
import { 
  TaskSchema 
} from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

class ApiError extends Error {
  status: number;
  response?: Response;
  
  constructor(
    message: string,
    status: number,
    response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    await response.text();
    throw new ApiError(
      `API request failed: ${response.status} ${response.statusText}`,
      response.status,
      response
    );
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    return response.text() as unknown as T;
  }
}

export const api = {
  // Create a new task
  async createTask(content: string, fileType: string, imageBase64?: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
        fileType,
        imageBase64,
      }),
    });

    const data = await handleResponse<{ taskId: string }>(response);
    return data.taskId;
  },

  // Get task by ID
  async getTask(taskId: string): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/api/task/${taskId}`);
    const data = await handleResponse<unknown>(response);
    return TaskSchema.parse(data);
  },

  // Analyze task
  async analyzeTask(taskId: string): Promise<Finding[]> {
    const response = await fetch(`${API_BASE_URL}/api/analyze/${taskId}`, {
      method: 'POST',
    });

    const data = await handleResponse<{ taskId: string; summary: string; findings: Finding[] }>(response);
    return data.findings;
  },

  // Generate report
  async generateReport(taskId: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/report/${taskId}`, {
      method: 'POST',
    });

    const data = await handleResponse<{ markdown: string }>(response);
    return data.markdown;
  },
};

// Polling utility for task status
export function pollTaskStatus(
  taskId: string,
  onUpdate: (task: Task) => void,
  onComplete: (task: Task) => void,
  onError: (error: Error) => void,
  interval: number = 3000
): () => void {
  let isPolling = true;

  const poll = async () => {
    if (!isPolling) return;

    try {
      const task = await api.getTask(taskId);
      onUpdate(task);

      if (task.state === 'ANALYZED' || task.state === 'PLANNED' || task.state === 'REPORTED' || task.state === 'DONE') {
        onComplete(task);
        isPolling = false;
      } else {
        setTimeout(poll, interval);
      }
    } catch (error) {
      onError(error as Error);
      isPolling = false;
    }
  };

  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
  };
}
