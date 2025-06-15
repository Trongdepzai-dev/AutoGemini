
import React from 'react';
import { AgentRunStatus } from '../types';
import { PlayIcon, PauseIcon, RefreshCwIcon } from './icons';

interface AgentControlsProps {
  runStatus: AgentRunStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  isGoalSet: boolean;
}

export const AgentControls: React.FC<AgentControlsProps> = ({ runStatus, onStart, onPause, onReset, isGoalSet }) => {
  return (
    <div className="flex space-x-3 mb-4">
      <button
        onClick={onStart}
        disabled={!isGoalSet || runStatus === AgentRunStatus.RUNNING || runStatus === AgentRunStatus.COMPLETED || runStatus === AgentRunStatus.ERROR}
        className="custom-button start flex-1 inline-flex items-center justify-center"
        aria-label={runStatus === AgentRunStatus.PAUSED ? 'Tiếp tục' : 'Bắt đầu'}
      >
        <PlayIcon className="w-5 h-5 mr-2" />
        {runStatus === AgentRunStatus.PAUSED ? 'Tiếp tục' : 'Bắt đầu'}
      </button>
      <button
        onClick={onPause}
        disabled={runStatus !== AgentRunStatus.RUNNING}
        className="custom-button pause flex-1 inline-flex items-center justify-center"
        aria-label="Tạm dừng"
      >
        <PauseIcon className="w-5 h-5 mr-2" />
        Tạm dừng
      </button>
      <button
        onClick={onReset}
        className="custom-button reset flex-1 inline-flex items-center justify-center"
        aria-label="Thiết lập lại"
      >
        <RefreshCwIcon className="w-5 h-5 mr-2" />
        Đặt lại
      </button>
    </div>
  );
};
