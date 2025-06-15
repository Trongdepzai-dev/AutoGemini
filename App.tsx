
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoalInput } from './components/GoalInput';
import { AgentControls } from './components/AgentControls';
import { LogEntryDisplay } from './components/LogEntryDisplay';
import { ResultsDisplay } from './components/ResultsDisplay';
import { AgentRunStatus, LogEntry, TaskStatus, AgentDecision, GroundingSource } from './types';
import { MAX_AGENT_ITERATIONS, ACTION_TYPES_VI, AGENT_NAME_VI } from './constants';
import { GeminiService } from './services/geminiService';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, RefreshCwIcon, PauseIcon as PauseIconSVG, LightBulbIcon } from './components/icons'; // Added LightBulbIcon for placeholders

const App: React.FC = () => {
  const [goal, setGoal] = useState<string>('');
  const [runStatus, setRunStatus] = useState<AgentRunStatus>(AgentRunStatus.IDLE);
  const [currentTaskStatus, setCurrentTaskStatus] = useState<TaskStatus>(TaskStatus.PENDING);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [currentIteration, setCurrentIteration] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [isDeepThoughtMode, setIsDeepThoughtMode] = useState<boolean>(false);
  const [isSummarizationMode, setIsSummarizationMode] = useState<boolean>(false); 

  const [activeReportMarkdown, setActiveReportMarkdown] = useState<string>('');
  
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      geminiServiceRef.current = new GeminiService();
      setErrorMessage(null); 
    } catch (error) {
      const initErrorMsg = `Không thể khởi tạo Dịch vụ Gemini: ${(error as Error).message}. Hãy đảm bảo API_KEY được cấu hình chính xác và hợp lệ. Ứng dụng có thể không hoạt động.`;
      setErrorMessage(initErrorMsg);
      console.error(initErrorMsg, error);
      setRunStatus(AgentRunStatus.ERROR);
    }
  }, []);

  const addLogEntry = useCallback((type: LogEntry['type'], content: string, details?: Partial<Omit<LogEntry, 'id'|'timestamp'|'type'|'content'>>) => {
    setLog(prevLog => [...prevLog, { 
      id: Date.now().toString() + Math.random().toString(36).substring(2,7), 
      timestamp: new Date().toISOString(), 
      type, 
      content,
      ...details
    }]);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeReportMarkdown]);


  const handleGoalSubmit = useCallback((submittedGoal: string) => {
    if (runStatus === AgentRunStatus.RUNNING) {
        addLogEntry('system', 'Không thể thay đổi mục tiêu khi AutoGemini đang chạy.');
        return;
    }
    setGoal(submittedGoal);
    setLog([]); 
    addLogEntry('goal', `Mục tiêu mới: "${submittedGoal}"${isSummarizationMode ? " (Chế độ Tóm tắt)" : ""}${isDeepThoughtMode ? " (Chế độ Suy nghĩ sâu)" : ""}`);
    setCurrentIteration(0);
    setRunStatus(AgentRunStatus.IDLE); 
    setCurrentTaskStatus(TaskStatus.PENDING);
    setErrorMessage(null); 
    setActiveReportMarkdown(''); 
  }, [addLogEntry, runStatus, isSummarizationMode, isDeepThoughtMode]);

  const handleReset = useCallback(() => {
    setGoal('');
    setLog([]);
    setRunStatus(AgentRunStatus.IDLE);
    setCurrentTaskStatus(TaskStatus.PENDING);
    setCurrentIteration(0);
    setErrorMessage(null);
    setActiveReportMarkdown('');
    addLogEntry('system', 'AutoGemini đã được thiết lập lại về trạng thái ban đầu.');
  }, [addLogEntry]);

  const runAgentIteration = useCallback(async () => {
    if (!geminiServiceRef.current) {
      const serviceError = 'Dịch vụ Gemini chưa được khởi tạo hoặc đã xảy ra lỗi. Không thể chạy AutoGemini.';
      addLogEntry('error', serviceError);
      setErrorMessage(serviceError);
      setRunStatus(AgentRunStatus.ERROR);
      setCurrentTaskStatus(TaskStatus.ACTION_FAILED);
      return;
    }
    
    addLogEntry('system', `${AGENT_NAME_VI} vòng lặp ${currentIteration + 1} bắt đầu...`, {status: TaskStatus.THINKING});
    setCurrentTaskStatus(TaskStatus.THINKING);

    let decision: AgentDecision | null = null;
    try {
      decision = await geminiServiceRef.current.decideNextAction(goal, log, isDeepThoughtMode, isSummarizationMode);
    } catch (error) {
      const decisionErrorMsg = `Lỗi nghiêm trọng trong quá trình AI đưa ra quyết định: ${(error as Error).message}`;
      addLogEntry('error', decisionErrorMsg, {status: TaskStatus.ACTION_FAILED});
      setErrorMessage(decisionErrorMsg);
      setRunStatus(AgentRunStatus.ERROR);
      setCurrentTaskStatus(TaskStatus.ACTION_FAILED);
      return;
    }

    if (!decision) {
      const noDecisionMsg = 'AI không đưa ra được quyết định (phản hồi không hợp lệ).';
      addLogEntry('error', noDecisionMsg, {status: TaskStatus.ACTION_FAILED});
      setErrorMessage(noDecisionMsg);
      setRunStatus(AgentRunStatus.ERROR); 
      setCurrentTaskStatus(TaskStatus.ACTION_FAILED);
      return;
    }
    
    addLogEntry('thought', 
        `Lý luận của AI: ${decision.reasoning || "Không có lý luận được cung cấp."}\n` +
        `Trọng tâm tiếp theo: ${decision.next_sub_goal_or_task || 'Chưa xác định'}`
    );
    
    if (decision.is_goal_achieved || decision.action?.type === ACTION_TYPES_VI.FINISH_TASK) {
      addLogEntry('milestone', `Mục tiêu được đánh dấu là HOÀN THÀNH bởi AI!`, { status: TaskStatus.ACTION_SUCCESSFUL});
      setRunStatus(AgentRunStatus.COMPLETED);
      setCurrentTaskStatus(TaskStatus.ACTION_SUCCESSFUL);
      if (decision.reasoning && decision.reasoning.length > 10) { 
          setActiveReportMarkdown(decision.reasoning); 
          addLogEntry('system', 'Bản tổng hợp/tóm tắt cuối cùng đã được cập nhật trong bảng Kết Quả Tổng Hợp.');
      } else {
          addLogEntry('system', 'AI báo cáo hoàn thành nhưng không có bản tổng hợp/tóm tắt chi tiết trong lý luận.');
          setActiveReportMarkdown(prev => prev + `\n\n## Nhiệm vụ Hoàn Thành\n\n${AGENT_NAME_VI} đã báo cáo hoàn thành mục tiêu. ${decision.reasoning || ""}`);
      }
      return;
    }

    if (decision.action && decision.action.type && decision.action.type !== ACTION_TYPES_VI.CONTINUE_THINKING) {
      const actionType = decision.action.type;
      const actionParams = decision.action.parameters || {};
      addLogEntry('action', `Đang chuẩn bị thực thi: ${actionType}`, { actionDetails: {type: actionType, parameters: actionParams}, status: TaskStatus.EXECUTING_ACTION });
      setCurrentTaskStatus(TaskStatus.EXECUTING_ACTION);

      try {
        let actionResult = "";
        let sources: GroundingSource[] = [];

        if (actionType === ACTION_TYPES_VI.SEARCH_GOOGLE) {
          if (!actionParams.query || typeof actionParams.query !== 'string') {
            throw new Error(`Tham số "query" (truy vấn tìm kiếm) bị thiếu hoặc không hợp lệ cho hành động ${ACTION_TYPES_VI.SEARCH_GOOGLE}.`);
          }
          const searchData = await geminiServiceRef.current.performGoogleSearch(actionParams.query);
          actionResult = searchData.summary;
          sources = searchData.sources;
        } else if (actionType === ACTION_TYPES_VI.ANALYZE_TEXT) {
          if (!actionParams.text_to_analyze || typeof actionParams.text_to_analyze !== 'string') {
            throw new Error(`Tham số "text_to_analyze" bị thiếu hoặc không hợp lệ cho hành động ${ACTION_TYPES_VI.ANALYZE_TEXT}.`);
          }
          actionResult = await geminiServiceRef.current.analyzeText(actionParams.text_to_analyze, goal, isSummarizationMode);
          setActiveReportMarkdown(prev => prev + "\n\n" + actionResult);
          addLogEntry('system', 'Kết quả phân tích văn bản đã được cập nhật vào Kết Quả Tổng Hợp.');
        } else {
           actionResult = `Loại hành động "${actionType}" được AI yêu cầu nhưng chưa được triển khai để thực thi trực tiếp. AutoGemini sẽ tiếp tục dựa trên lý luận.`;
           addLogEntry('system', actionResult, {status: TaskStatus.ACTION_SUCCESSFUL});
        }
        
        if (actionType === ACTION_TYPES_VI.SEARCH_GOOGLE || actionType === ACTION_TYPES_VI.ANALYZE_TEXT) {
            addLogEntry('observation', `Kết quả của ${actionType}: ${actionResult.substring(0,300)}... (xem chi tiết trong Kết Quả Tổng Hợp nếu là phân tích)`, { status: TaskStatus.ACTION_SUCCESSFUL });
        }

        if (sources.length > 0) {
            addLogEntry('sources', `Đã truy xuất ${sources.length} nguồn từ ${ACTION_TYPES_VI.SEARCH_GOOGLE}.`, { sources, status: TaskStatus.ACTION_SUCCESSFUL });
        }
        setCurrentTaskStatus(TaskStatus.PROCESSING_RESULT);

      } catch (error) {
        const actionErrorMsg = `Lỗi thực thi hành động ${actionType}: ${(error as Error).message}`;
        addLogEntry('error', actionErrorMsg, { status: TaskStatus.ACTION_FAILED });
        setCurrentTaskStatus(TaskStatus.ACTION_FAILED);
      }
    } else { 
       addLogEntry('system', 'AI quyết định tiếp tục suy nghĩ hoặc tinh chỉnh kế hoạch.', {status: TaskStatus.THINKING});
       setCurrentTaskStatus(TaskStatus.THINKING);
    }
    
    setCurrentIteration(prev => prev + 1);

  }, [goal, log, currentIteration, addLogEntry, isDeepThoughtMode, isSummarizationMode]);

  useEffect(() => {
    if (runStatus === AgentRunStatus.RUNNING && currentIteration < MAX_AGENT_ITERATIONS) {
      const timer = setTimeout(() => {
        runAgentIteration();
      }, 1800); // Slightly longer delay for UI updates and readability
      return () => clearTimeout(timer);
    } else if (runStatus === AgentRunStatus.RUNNING && currentIteration >= MAX_AGENT_ITERATIONS) {
      const maxIterationMsg = `Đã đạt tối đa (${MAX_AGENT_ITERATIONS}) vòng lặp. AutoGemini sẽ tạm dừng.`;
      addLogEntry('system', maxIterationMsg, { status: TaskStatus.ACTION_FAILED });
      setRunStatus(AgentRunStatus.PAUSED); 
      setCurrentTaskStatus(TaskStatus.ACTION_FAILED);
      setErrorMessage(maxIterationMsg + " Bạn có thể tiếp tục hoặc đặt lại.");
      setActiveReportMarkdown(prev => prev + `\n\n## Đã Đạt Giới hạn Vòng lặp\n\n${maxIterationMsg}`);
    }
  }, [runStatus, currentIteration, runAgentIteration, addLogEntry]);

  const getStatusIndicator = () => {
    let icon = <InformationCircleIcon className="w-5 h-5 mr-3 status-icon text-[var(--text-secondary)]" />;
    let text = ""; 
    let colorClass = "text-[var(--text-secondary)]";
    let runningClass = runStatus === AgentRunStatus.RUNNING ? "running" : "";
    let iconAnimationClass = "";

    switch(runStatus) {
        case AgentRunStatus.IDLE: text = "Trạng thái: Sẵn sàng"; break;
        case AgentRunStatus.RUNNING: text = "Trạng thái: Đang thực thi"; iconAnimationClass = "animate-spin"; break;
        case AgentRunStatus.PAUSED: text = "Trạng thái: Đã tạm dừng"; break;
        case AgentRunStatus.COMPLETED: text = "Trạng thái: Đã hoàn thành"; break;
        case AgentRunStatus.ERROR: text = "Trạng thái: Gặp sự cố"; break;
    }
    
    let taskText = "";
     switch(currentTaskStatus) {
        case TaskStatus.PENDING: taskText = "Tác vụ: Đang chờ"; break;
        case TaskStatus.THINKING: taskText = "Tác vụ: Đang suy luận"; break;
        case TaskStatus.EXECUTING_ACTION: taskText = "Tác vụ: Đang hành động"; break;
        case TaskStatus.ACTION_FAILED: taskText = "Tác vụ: Thất bại"; break;
        case TaskStatus.ACTION_SUCCESSFUL: taskText = "Tác vụ: Thành công"; break;
        case TaskStatus.PROCESSING_RESULT: taskText = "Tác vụ: Xử lý kết quả"; break;
    }
    const fullText = `${text} | ${taskText} | Vòng lặp: ${currentIteration}/${MAX_AGENT_ITERATIONS}`;

    if (runStatus === AgentRunStatus.RUNNING) {
      icon = <RefreshCwIcon className={`w-5 h-5 mr-3 status-icon text-[var(--accent-primary)] ${iconAnimationClass}`} />;
      colorClass = "text-[var(--accent-primary)]";
    } else if (runStatus === AgentRunStatus.COMPLETED) {
      icon = <CheckCircleIcon className="w-5 h-5 mr-3 status-icon text-[var(--success-color)]" />;
      colorClass = "text-[var(--success-color)]";
    } else if (runStatus === AgentRunStatus.ERROR || currentTaskStatus === TaskStatus.ACTION_FAILED) {
      icon = <ExclamationTriangleIcon className="w-5 h-5 mr-3 status-icon text-[var(--error-color)]" />;
      colorClass = "text-[var(--error-color)]";
    } else if (runStatus === AgentRunStatus.PAUSED) {
      icon = <PauseIconSVG className="w-5 h-5 mr-3 status-icon text-[var(--warning-color)]" />;
      colorClass = "text-[var(--warning-color)]";
    }
    return <div className={`status-indicator ${runningClass} ${colorClass}`}>{icon} <span className="status-text">{fullText}</span></div>;
  };

  const commonPlaceholder = (message: string) => (
    <div className="flex flex-col items-center justify-center h-full text-center placeholder-text">
        <LightBulbIcon />
        <p>{message}</p>
    </div>
  );

  return (
    <div className="main-container">
      <header className="app-header text-center mb-8">
        <h1>{AGENT_NAME_VI}</h1>
        <p>Khai phá tiềm năng với AutoGemini</p>
      </header>

      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <ExclamationTriangleIcon className="alert-banner-icon" />
          <div>
            <strong className="font-bold">Thông báo Lỗi Hệ thống: </strong>
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        </div>
      )}

      <div className="main-grid">
        <div className="panel control-panel">
          <h2 className="panel-title">Bảng Điều Khiển & Thiết Lập</h2>
          <div className="panel-content">
            <GoalInput onGoalSubmit={handleGoalSubmit} disabled={runStatus === AgentRunStatus.RUNNING} />
            
            <div className="checkbox-container">
              <label htmlFor="deepThoughtMode" className="checkbox-label">
                <input
                  type="checkbox"
                  id="deepThoughtMode"
                  checked={isDeepThoughtMode}
                  onChange={(e) => setIsDeepThoughtMode(e.target.checked)}
                  disabled={runStatus === AgentRunStatus.RUNNING}
                />
                <span className="checkbox-checkmark"></span>
                <span className="checkbox-text">Chế độ Tư Duy Chuyên Sâu</span>
              </label>
              <p className="checkbox-description">AI phân tích đa chiều, sâu sắc hơn, có thể cần thêm thời gian.</p>
            </div>

            <div className="checkbox-container">
              <label htmlFor="summarizationMode" className="checkbox-label">
                <input
                  type="checkbox"
                  id="summarizationMode"
                  checked={isSummarizationMode}
                  onChange={(e) => setIsSummarizationMode(e.target.checked)}
                  disabled={runStatus === AgentRunStatus.RUNNING}
                />
                 <span className="checkbox-checkmark"></span>
                <span className="checkbox-text">Chế độ Tổng Hợp Tóm Tắt</span>
              </label>
              <p className="checkbox-description">AI tập trung tạo bản tóm tắt/báo cáo Markdown chi tiết.</p>
            </div>
            
            <AgentControls
              runStatus={runStatus}
              onStart={() => { 
                if (!goal) {
                    setErrorMessage("Vui lòng xác định mục tiêu trước khi khởi động AutoGemini.");
                    addLogEntry('error', "Không thể khởi động: Mục tiêu chưa được đặt.");
                    return;
                }
                if (!geminiServiceRef.current) {
                    setErrorMessage("Dịch vụ Gemini chưa sẵn sàng. Không thể khởi động.");
                    addLogEntry('error', "Không thể khởi động: Lỗi Dịch vụ Gemini.");
                    return;
                }
                setErrorMessage(null); 
                setRunStatus(AgentRunStatus.RUNNING);
              }}
              onPause={() => setRunStatus(AgentRunStatus.PAUSED)}
              onReset={handleReset}
              isGoalSet={!!goal}
            />
            <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
               {getStatusIndicator()}
            </div>
          </div>
        </div>

        <div className="panel log-panel">
          <h2 className="panel-title">Nhật ký Hoạt động Thời gian Thực</h2>
          <div className="panel-content">
            <div className="log-display-area">
              {log.length === 0 && commonPlaceholder(goal ? "AutoGemini đang chờ lệnh. Nhấn 'Bắt đầu' để thực thi." : "Hãy xác định mục tiêu để AutoGemini bắt đầu hành trình.")}
              {log.map((entry) => (
                <LogEntryDisplay key={entry.id} entry={entry} />
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <div className="panel results-panel">
          <h2 className="panel-title">Kết Quả Tổng Hợp & Phân Tích</h2>
           <div className="panel-content">
            <div className="results-display-area">
              {activeReportMarkdown ? (
                <ResultsDisplay markdownContent={activeReportMarkdown} />
              ) : (
                 commonPlaceholder(goal ? "Chưa có báo cáo. AutoGemini đang xử lý hoặc chưa có phân tích nào được thực hiện." : "Kết quả phân tích và tổng hợp sẽ hiển thị tại đây sau khi AutoGemini hoạt động.")
              )}
              <div ref={resultsEndRef} />
            </div>
          </div>
        </div>
      </div>
       <footer className="app-footer">
          AutoGemini có thể mắc lỗi. Hãy kiểm tra các thông tin quan trọng.
      </footer>
    </div>
  );
};

export default App;
