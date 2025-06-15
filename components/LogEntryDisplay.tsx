
import React from 'react';
import { LogEntry, GroundingSource, TaskStatus } from '../types';
import { LightBulbIcon, CogIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, SearchIcon, LinkIcon } from './icons';
import { ACTION_TYPES_VI } from '../constants';

interface LogEntryDisplayProps {
  entry: LogEntry;
}

const IconForType: React.FC<{type: LogEntry['type'], status?: TaskStatus, className?: string}> = ({ type, status, className="w-5 h-5" }) => { // Removed mr-3, handled by parent
  if (type === 'error') return <ExclamationTriangleIcon className={`${className} text-red-400`} />;
  if (type === 'goal') return <CheckCircleIcon className={`${className} text-green-400`} />;
  if (type === 'thought') return <LightBulbIcon className={`${className} text-blue-400`} />;
  if (type === 'action') {
    if (status === TaskStatus.ACTION_FAILED) return <ExclamationTriangleIcon className={`${className} text-red-400`} />;
    if (status === TaskStatus.EXECUTING_ACTION) return <CogIcon className={`${className} text-yellow-400 animate-spin`} />;
    return <CogIcon className={`${className} text-yellow-400`} />;
  }
  if (type === 'observation') return <SearchIcon className={`${className} text-purple-400`} />;
  if (type === 'sources') return <LinkIcon className={`${className} text-teal-400`} />;
  if (type === 'milestone') {
     return <CheckCircleIcon className={`${className} text-[var(--accent-primary)]`} />;
  }
   if (type === 'system') {
     return <InformationCircleIcon className={`${className} text-gray-400`} />;
  }
  return <InformationCircleIcon className={`${className} text-gray-400`} />;
};

const SourceLink: React.FC<{source: GroundingSource}> = ({source}) => (
    <a
        href={source.uri}
        target="_blank"
        rel="noopener noreferrer"
        title={source.uri}
    >
        {source.title || source.uri}
    </a>
);

const getVietnameseActionTypeName = (actionTypeKey?: string): string => {
  if (!actionTypeKey) return 'Không xác định';
  // Attempt to find by value (the Vietnamese string from AI)
  const entryByValue = Object.entries(ACTION_TYPES_VI).find(([key, value]) => value === actionTypeKey);
  if (entryByValue) {
    return entryByValue[0].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }
  // Attempt to find by key (if somehow English constant is passed)
  const entryByKey = Object.entries(ACTION_TYPES_VI).find(([key,value]) => key === actionTypeKey);
   if(entryByKey) {
    return entryByKey[0].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
   }
  return actionTypeKey; // Fallback to the raw key
};


export const LogEntryDisplay: React.FC<LogEntryDisplayProps> = ({ entry }) => {
  let typeSpecificClass = "log-entry-system"; 
  let title = entry.type.charAt(0).toUpperCase() + entry.type.slice(1);

  switch(entry.type) {
    case 'goal': 
      typeSpecificClass = "log-entry-goal"; 
      title = "Mục tiêu Đã đặt";
      break;
    case 'thought': 
      typeSpecificClass = "log-entry-thought"; 
      title = "Quá trình Suy nghĩ";
      break;
    case 'action': 
      typeSpecificClass = "log-entry-action";
      const actionName = getVietnameseActionTypeName(entry.actionDetails?.type);
      title = `Hành động: ${actionName}`;
      if (entry.status === TaskStatus.EXECUTING_ACTION) title += " (Đang thực thi...)";
      if (entry.status === TaskStatus.ACTION_FAILED) title += " (Thất bại)";
      if (entry.status === TaskStatus.ACTION_SUCCESSFUL) title += " (Thành công)";
      break;
    case 'observation': 
      typeSpecificClass = "log-entry-observation"; 
      title = "Quan sát";
      break;
    case 'system': 
      typeSpecificClass = "log-entry-system"; 
      title = "Thông báo Hệ thống";
      break;
    case 'error': 
      typeSpecificClass = "log-entry-error"; 
      title = "Lỗi";
      break;
    case 'milestone':
      typeSpecificClass = "log-entry-milestone";
      title = "Cột mốc Đạt được";
      break;
    case 'sources':
      typeSpecificClass = "log-entry-sources";
      title = "Các Nguồn Tham khảo";
      break;
  }

  return (
    <div className={`log-entry ${typeSpecificClass}`}>
      <div className="log-entry-header">
        <span className="log-entry-title">
          <IconForType type={entry.type} status={entry.status} />
          {title}
        </span>
        <span className="log-entry-timestamp">{new Date(entry.timestamp).toLocaleTimeString('vi-VN')}</span>
      </div>
      <p className="log-entry-content">{entry.content}</p>
      {entry.actionDetails && entry.type === 'action' && Object.keys(entry.actionDetails.parameters || {}).length > 0 && (
        <div className="log-entry-params">
          <strong>Tham số:</strong>
          <pre>{JSON.stringify(entry.actionDetails.parameters, null, 2)}</pre>
        </div>
      )}
      {entry.sources && entry.sources.length > 0 && (
        <div className="mt-2">
          <strong className="text-xs text-[var(--text-secondary)] block mb-1">Nguồn tham khảo:</strong>
          <ul className="log-entry-sources-list">
            {entry.sources.map((source, idx) => (
              <li key={idx}>
                <SourceLink source={source} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
