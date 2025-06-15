
export const GEMINI_MODEL_TEXT = 'gemini-2.5-flash-preview-04-17';
// export const GEMINI_MODEL_IMAGE = 'imagen-3.0-generate-002'; // If image generation is needed

export const MAX_AGENT_ITERATIONS = 30; // Increased from 15 to 30
export const AGENT_NAME = "GeminiAgent"; // Internal name
export const AGENT_NAME_VI = "AutoGemini"; // Vietnamese display name

export const ACTION_TYPES_VI = {
  SEARCH_GOOGLE: "TIM_KIEM_GOOGLE",
  ANALYZE_TEXT: "PHAN_TICH_VAN_BAN",
  FINISH_TASK: "HOAN_THANH_NHIEM_VU",
  CONTINUE_THINKING: "TIEP_TUC_SUY_NGHI",
};

// Keep English for internal reference if needed by any part not directly user-facing
// or for easier mapping if we were to support multiple languages dynamically.
// For this request, we'll primarily use ACTION_TYPES_VI in prompts.
export const ACTION_TYPES = {
  SEARCH_GOOGLE: "SEARCH_GOOGLE",
  ANALYZE_TEXT: "ANALYZE_TEXT",
  FINISH_TASK: "FINISH_TASK",
  CONTINUE_THINKING: "CONTINUE_THINKING",
};