
import React from 'react';

export const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19V5l14 7-14 7Z"/>
  </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 19V5h4v14h-4Zm-8 0V5h4v14H6Z"/>
  </svg>
);

export const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 18V6h12v12H6Z"/>
  </svg>
);

export const RefreshCwIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

export const LightBulbIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7Zm-1 18a1 1 0 0 0 1-1v-1h-2v1a1 1 0 0 0 1 1Z"/>
  </svg>
);

export const CogIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.928 1.567L9.026 4.58a1.875 1.875 0 0 1-1.579.993l-1.42.115A1.875 1.875 0 0 0 4.363 7.25l-.859 1.227a1.875 1.875 0 0 0 .33 2.506l1.246 1.038A1.875 1.875 0 0 1 5.32 14.19l-.177 1.48A1.875 1.875 0 0 0 6.98 17.58l1.348-.796a1.875 1.875 0 0 1 1.996 0l1.347.796a1.875 1.875 0 0 0 1.838-1.91l-.177-1.48a1.875 1.875 0 0 1 .16-1.186l1.246-1.037a1.875 1.875 0 0 0 .33-2.506l-.86-1.227a1.875 1.875 0 0 0-1.684-1.707l-1.42-.115a1.875 1.875 0 0 1-1.579-.993L13.006 3.82a1.875 1.875 0 0 0-1.928-1.566ZM12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" clipRule="evenodd" />
  </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm4.28 10.28a.75.75 0 0 0 0-1.06l-3-3a.75.75 0 0 0-1.06 0l-1.5 1.5a.75.75 0 1 0 1.06 1.06L12 9.56l2.22 2.22a.75.75 0 0 0 1.06 0Z" clipRule="evenodd" />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 0 1 1.06 0L12 9.94l.72-.72a.75.75 0 1 1 1.06 1.06L13.06 12l.72.72a.75.75 0 1 1-1.06 1.06L12 13.06l-.72.72a.75.75 0 0 1-1.06-1.06L10.94 12l-.72-.72a.75.75 0 0 1 0-1.06ZM11.25 15a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0Z" clipRule="evenodd" />
  </svg>
);

export const InformationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-.75 6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75V8.25ZM12 15a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V15.75a.75.75 0 0 0-.75-.75H12Z" clipRule="evenodd" />
  </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clipRule="evenodd" />
  </svg>
);

export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
  </svg>
);
