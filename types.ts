
export enum AgentRunStatus {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  ERROR = "ERROR",
}

export enum TaskStatus {
  PENDING = "PENDING",
  THINKING = "THINKING",
  EXECUTING_ACTION = "EXECUTING_ACTION",
  ACTION_FAILED = "ACTION_FAILED",
  ACTION_SUCCESSFUL = "ACTION_SUCCESSFUL",
  WAITING_FOR_USER = "WAITING_FOR_USER", // Future use
  PROCESSING_RESULT = "PROCESSING_RESULT",
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface LogEntryAction {
  type: string; // e.g., "SEARCH_GOOGLE", "ANALYZE_TEXT", "CODE_INTERPRETER"
  parameters: Record<string, any>;
}
export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'goal' | 'thought' | 'action' | 'observation' | 'system' | 'error' | 'milestone' | 'sources';
  content: string;
  actionDetails?: LogEntryAction;
  sources?: GroundingSource[];
  status?: TaskStatus; // Optional status for specific log types
}

export interface AgentDecision {
  reasoning: string;
  action?: {
    type: string; // e.g., "SEARCH_GOOGLE", "ANALYZE_TEXT", "FINISH_TASK"
    parameters?: Record<string, any>;
  };
  is_goal_achieved: boolean;
  next_sub_goal_or_task?: string; // What the agent thinks it should focus on next
}
