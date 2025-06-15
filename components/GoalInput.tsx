
import React, { useState } from 'react';

interface GoalInputProps {
  onGoalSubmit: (goal: string) => void;
  disabled: boolean;
}

export const GoalInput: React.FC<GoalInputProps> = ({ onGoalSubmit, disabled }) => {
  const [goal, setGoal] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (goal.trim()) {
      onGoalSubmit(goal.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4"> {/* Reduced margin bottom slightly */}
      <label htmlFor="goal" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
        Xác định Mục tiêu cho AutoGemini:
      </label>
      <textarea
        id="goal"
        rows={4}
        className="custom-textarea placeholder-[var(--text-secondary)] disabled:opacity-50"
        placeholder="Ví dụ: Nghiên cứu các giải pháp năng lượng tái tạo mới nhất, phân tích ưu nhược điểm và đề xuất một kế hoạch triển khai cho một thành phố nhỏ dưới dạng báo cáo Markdown."
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={disabled || !goal.trim()}
        className="custom-button primary mt-3 w-full" // Use primary style
      >
        Đặt Mục tiêu & Chuẩn bị
      </button>
    </form>
  );
};
