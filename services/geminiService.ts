
import { GoogleGenAI, GenerateContentResponse, GroundingChunk } from "@google/genai";
import { GEMINI_MODEL_TEXT, ACTION_TYPES_VI, AGENT_NAME_VI } from '../constants';
import type { LogEntry, AgentDecision, GroundingSource } from '../types';

const API_KEY = process.env.API_KEY || (typeof window !== 'undefined' ? (window as any).process?.env?.API_KEY : undefined);

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set. Please ensure it is available in process.env.API_KEY.");
  // Consider throwing an error or having a more user-facing message if critical
}

// const ai = new GoogleGenAI({ apiKey: API_KEY! }); // Instantiated in class constructor

function parseJsonFromGeminiResponse(text: string): AgentDecision | null {
  let jsonStr = text.trim();
  const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed.reasoning === 'string' && typeof parsed.is_goal_achieved === 'boolean') {
      // Basic validation, could be more thorough by checking action structure
      return parsed as AgentDecision;
    }
    console.warn("Đối tượng JSON đã phân tích không khớp với cấu trúc AgentDecision mong đợi:", parsed);
    return { 
        reasoning: `Không thể phân tích phản hồi AI dưới dạng JSON hợp lệ. Phản hồi thô: ${text.substring(0, 500)}...`, 
        is_goal_achieved: false, 
        action: { type: ACTION_TYPES_VI.CONTINUE_THINKING, parameters: {} } // Ensure parameters is an object
    };
  } catch (e) {
    console.error("Không thể phân tích phản hồi JSON từ Gemini:", e);
    console.error("Văn bản gốc:", text);
    if (text.toLowerCase().includes("mục tiêu đạt được") || text.toLowerCase().includes("nhiệm vụ hoàn thành")) {
        return { reasoning: text, is_goal_achieved: true }; // Allow natural language completion if JSON fails
    }
    return { 
        reasoning: `Lỗi nghiêm trọng khi phân tích phản hồi JSON từ AI. Phản hồi thô: ${text.substring(0,500)}...`, 
        is_goal_achieved: false, 
        action: { type: ACTION_TYPES_VI.CONTINUE_THINKING, parameters: {} }
    };
  }
}

function constructAgentPrompt(goal: string, logHistory: LogEntry[], isDeepThoughtMode: boolean, isSummarizationMode: boolean): string {
  const historySummary = logHistory.slice(-10).map(entry => {
    let detail = entry.content;
    if (entry.actionDetails) {
      detail += ` (Hành động: ${entry.actionDetails.type}, Tham số: ${JSON.stringify(entry.actionDetails.parameters)})`;
    }
    if (entry.sources && entry.sources.length > 0) {
      detail += ` (Nguồn: ${entry.sources.map(s => s.title || s.uri).join(', ')})`;
    }
    return `${entry.type.toUpperCase()}: ${detail}`;
  }).join('\\n'); // Ensure newlines in history summary are escaped for the prompt's own structure if it were part of a larger JSON context.

  let modeSpecificInstructions = "";
  let finishTaskReasoningDescription = `Nếu hành động là ${ACTION_TYPES_VI.FINISH_TASK}, phần "reasoning" này PHẢI là một bản TỔNG HỢP CHI TIẾT VÀ TOÀN DIỆN về tất cả các phát hiện, phân tích, và kết luận liên quan đến mục tiêu người dùng. Cấu trúc dưới dạng báo cáo MARKDOWN hoàn chỉnh, dễ đọc, bằng tiếng Việt. Đây là kết quả cuối cùng quan trọng nhất.`;

  if (isSummarizationMode) {
    modeSpecificInstructions = `
CHẾ ĐỘ TÓM TẮT ĐANG BẬT:
Mục tiêu chính của bạn là thu thập thông tin liên quan đến mục tiêu của người dùng và tạo ra một BẢN TÓM TẮT MARKDOWN chất lượng cao, chi tiết và có cấu trúc tốt.
Tập trung vào việc trích xuất các điểm chính, tổng hợp thông tin từ nhiều nguồn (nếu có) và trình bày nó một cách rõ ràng.
Hành động ${ACTION_TYPES_VI.ANALYZE_TEXT} nên được sử dụng để tinh chỉnh và xây dựng bản tóm tắt này.
`;
    finishTaskReasoningDescription = `Nếu hành động là ${ACTION_TYPES_VI.FINISH_TASK}, phần "reasoning" này PHẢI là bản TÓM TẮT MARKDOWN cuối cùng, hoàn chỉnh và được định dạng tốt bằng tiếng Việt, bao gồm tất cả thông tin quan trọng đã thu thập được.`;
  } else if (isDeepThoughtMode) {
    modeSpecificInstructions = `
CHẾ ĐỘ SUY NGHĨ SÂU ĐANG BẬT:
Bạn PHẢI suy nghĩ cực kỳ kỹ lưỡng, xem xét nhiều khía cạnh hơn, phân tích sâu hơn và cung cấp một phần "reasoning" (lý luận) chi tiết và toàn diện hơn nhiều.
- **YÊU CẦU ĐẶC BIỆT cho 'reasoning'**: Trong chế độ này, phần 'reasoning' của bạn phải CỰC KỲ DÀI VÀ CHI TIẾT. Hãy coi nó như một bài luận nhỏ, nơi bạn:
    - Trình bày rõ ràng vấn đề hoặc câu hỏi đang được xem xét.
    - Khám phá nhiều góc độ, phương pháp tiếp cận hoặc giải pháp tiềm năng một cách thấu đáo.
    - Phân tích sâu sắc ưu và nhược điểm của từng lựa chọn, bao gồm cả những rủi ro tiềm ẩn.
    - Mô tả chi tiết quá trình suy luận từng bước của bạn, bao gồm cả những giả định đã đưa ra và cách bạn kiểm chứng chúng.
    - Dự đoán các kết quả hoặc thách thức tiềm ẩn cho mỗi hướng đi.
    - Lý giải cặn kẽ tại sao bạn đi đến quyết định cuối cùng cho hành động, so sánh với các lựa chọn khác.
- Mục tiêu là chất lượng suy nghĩ và độ chi tiết cao nhất có thể. Đừng ngần ngại viết dài. Sự rõ ràng, mạch lạc và đầy đủ trong lý luận của bạn là tối quan trọng. Phần lý luận này phải phản ánh một quá trình tư duy sâu sắc và công phu.
`;
  }
  

  return `
Bạn là ${AGENT_NAME_VI}, một trợ lý AI tự trị tiên tiến. Nhiệm vụ của bạn là hoàn thành mục tiêu của người dùng một cách hiệu quả và toàn diện.
Bạn hoạt động theo chu kỳ Suy nghĩ -> Hành động -> Quan sát.
Tất cả các phản hồi của bạn, bao gồm cả lý luận và kết quả, PHẢI bằng tiếng Việt.

Mục tiêu Tổng thể của Người dùng: ${goal}
${modeSpecificInstructions}

Lịch sử Nhật ký Trước đó (các mục gần nhất):
${historySummary || "Chưa có lịch sử. Đây là bước đầu tiên."}

Nhiệm vụ Hiện tại: Dựa trên mục tiêu, chế độ hoạt động và lịch sử, quyết định hành động tiếp theo.
Phản hồi của bạn PHẢI là một đối tượng JSON duy nhất có cấu trúc sau (không có bất kỳ văn bản nào khác trước hoặc sau JSON):
{
  "reasoning": "Quá trình suy nghĩ chi tiết của bạn bằng tiếng Việt để quyết định bước tiếp theo. Giải thích tại sao bạn chọn hành động này. ${finishTaskReasoningDescription}",
  "action": {
    "type": "LOAI_HANH_DONG", 
    "parameters": {} 
  },
  "is_goal_achieved": boolean, 
  "next_sub_goal_or_task": "Một mô tả ngắn gọn bằng tiếng Việt về trọng tâm hiện tại của bạn hoặc nhiệm vụ phụ bạn đang giải quyết. Điều này giúp duy trì ngữ cảnh."
}

Các Loại Hành động (action.type) được hỗ trợ và Tham số (action.parameters) của chúng:
1.  "${ACTION_TYPES_VI.SEARCH_GOOGLE}": Tìm kiếm thông tin trên web.
    *   parameters: {"query": "truy vấn tìm kiếm cụ thể bằng tiếng Việt"}
2.  "${ACTION_TYPES_VI.ANALYZE_TEXT}": Phân tích, xử lý hoặc tóm tắt một đoạn văn bản.
    *   parameters: {"text_to_analyze": "BẮT BUỘC: Toàn bộ nội dung văn bản bạn muốn phân tích. Ví dụ: nội dung từ một kết quả tìm kiếm Google, một đoạn văn từ lịch sử, hoặc văn bản bạn tự tạo ra để phân tích sâu hơn. Tham số này KHÔNG ĐƯỢC để trống hoặc thiếu khi chọn hành động này."}
    *   Kết quả của hành động này (được trả về cho hệ thống từ lời nhắc riêng) PHẢI ở định dạng MARKDOWN bằng tiếng Việt.
3.  "${ACTION_TYPES_VI.FINISH_TASK}": Hoàn thành mục tiêu tổng thể.
    *   parameters: {} (để trống)
    *   Phần "reasoning" sẽ chứa báo cáo/tóm tắt cuối cùng dưới dạng MARKDOWN.
4.  "${ACTION_TYPES_VI.CONTINUE_THINKING}": Cần thêm thời gian để suy nghĩ, lập kế hoạch hoặc nếu không có hành động nào khác phù hợp.
    *   parameters: {} (để trống)

Hướng dẫn quan trọng:
-   **reasoning**: Luôn giải thích logic của bạn bằng tiếng Việt. Đây là phần quan trọng nhất để hiểu quyết định của bạn. Đối với Chế độ Suy nghĩ Sâu, hãy tuân thủ yêu cầu về độ dài và chi tiết đặc biệt.
-   **is_goal_achieved**: Chỉ đặt true khi mục tiêu chính đã HOÀN TOÀN đạt được.
-   **next_sub_goal_or_task**: Luôn cập nhật mục tiêu phụ hoặc nhiệm vụ hiện tại bằng tiếng Việt.
-   **Định dạng Chuỗi JSON (JSON String Formatting)**: Khi tạo các giá trị chuỗi JSON (ví dụ: trong trường "reasoning" hoặc bất kỳ trường văn bản nào khác):
    *   Tất cả các ký tự dòng mới (newlines) PHẢI được thoát dưới dạng '\\\\n'. Ví dụ: "dòng 1\\\\ndòng 2".
    *   Các ký tự đặc biệt khác bên trong chuỗi, như dấu ngoặc kép (") phải được thoát là '\\\\"', và dấu gạch chéo ngược (\\\\) phải được thoát là '\\\\\\\\'.
    *   KHÔNG bao gồm các ký tự điều khiển chưa được thoát (unescaped control characters) hoặc các chuỗi thoát không hợp lệ (invalid escape sequences) bên trong các giá trị chuỗi.
    *   Điều này cực kỳ quan trọng để đảm bảo JSON là hợp lệ và tránh lỗi khi phân tích.
-   Chất lượng của kết quả MARKDOWN (cho ANALYZE_TEXT và FINISH_TASK) là rất quan trọng. Hãy đảm bảo nó được định dạng tốt, dễ đọc và toàn diện.
-   Khi chọn hành động ${ACTION_TYPES_VI.ANALYZE_TEXT}, bạn BẮT BUỘC phải cung cấp nội dung văn bản cần phân tích trong tham số \`text_to_analyze\`. Nếu bạn định phân tích một kết quả tìm kiếm trước đó hoặc một phần của lịch sử, hãy trích xuất và đặt văn bản đó vào đây.

Ví dụ cho ${ACTION_TYPES_VI.SEARCH_GOOGLE}:
{
  "reasoning": "Để hiểu về chủ đề X, tôi cần tìm kiếm các bài viết khoa học và tin tức gần đây về nó.",
  "action": { "type": "${ACTION_TYPES_VI.SEARCH_GOOGLE}", "parameters": { "query": "đánh giá khoa học về tác động của X bằng tiếng Việt" } },
  "is_goal_achieved": false,
  "next_sub_goal_or_task": "Nghiên cứu chủ đề X thông qua tìm kiếm Google và các nguồn học thuật."
}

Hãy suy nghĩ từng bước một. Phản hồi của bạn chỉ được chứa đối tượng JSON.
  `;
}


export class GeminiService {
  private googleGenAI: GoogleGenAI;

  constructor() {
    if (!API_KEY) {
      throw new Error("API Key của Gemini chưa được cấu hình. Vui lòng kiểm tra biến môi trường.");
    }
    this.googleGenAI = new GoogleGenAI({ apiKey: API_KEY });
  }

  async decideNextAction(goal: string, logHistory: LogEntry[], isDeepThoughtMode: boolean, isSummarizationMode: boolean): Promise<AgentDecision | null> {
    const prompt = constructAgentPrompt(goal, logHistory, isDeepThoughtMode, isSummarizationMode);
    try {
      const response: GenerateContentResponse = await this.googleGenAI.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: {
          responseMimeType: "application/json", 
          temperature: isSummarizationMode ? 0.2 : (isDeepThoughtMode ? 0.35 : 0.6), // Slightly lower temp for deep thought to maintain coherence with length
        },
      });
      return parseJsonFromGeminiResponse(response.text);
    } catch (error) {
      console.error("Lỗi trong decideNextAction:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        reasoning: `Lỗi giao tiếp với AI khi quyết định hành động: ${errorMessage}. Vui lòng kiểm tra lại lời nhắc hoặc thử lại.`,
        is_goal_achieved: false,
        action: { type: ACTION_TYPES_VI.CONTINUE_THINKING, parameters: {} }
      };
    }
  }

  async performGoogleSearch(query: string): Promise<{ summary: string; sources: GroundingSource[] }> {
    try {
      const searchPrompt = `Hãy thực hiện tìm kiếm Google bằng tiếng Việt cho truy vấn sau: "${query}". 
Sau đó, dựa trên các kết quả tìm kiếm hàng đầu, hãy cung cấp một bản tóm tắt súc tích, mạch lạc bằng tiếng Việt (khoảng 150-250 từ) về những thông tin quan trọng nhất tìm được. 
Đảm bảo bản tóm tắt hoàn toàn bằng tiếng Việt và phù hợp để hiển thị cho người dùng. Không thêm bất kỳ lời dẫn hay giải thích nào ngoài bản tóm tắt.`;
      
      const response: GenerateContentResponse = await this.googleGenAI.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: searchPrompt, // Use a more direct prompt for summarization + search
        config: {
          tools: [{ googleSearch: {} }],
          // DO NOT add responseMimeType: "application/json" here as per guidelines
        },
      });

      const summary = response.text || "Không có tóm tắt nào được trả về từ tìm kiếm."; 
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources: GroundingSource[] = groundingChunks
        .map((chunk: GroundingChunk) => ({
          uri: chunk.web?.uri || '',
          title: chunk.web?.title || (chunk.web?.uri ? 'Nguồn không có tiêu đề' : 'Nguồn không xác định'),
        }))
        .filter(source => source.uri); // Ensure URI exists
      
      return { summary, sources };
    } catch (error) {
      console.error("Lỗi trong performGoogleSearch:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { summary: `Lỗi thực hiện tìm kiếm Google: ${errorMessage}`, sources: [] };
    }
  }

  async analyzeText(textToAnalyze: string, contextGoal: string, isSummarizationTask: boolean): Promise<string> {
    const summarizeInstruction = isSummarizationTask 
        ? "Tập trung vào việc tạo ra một bản tóm tắt MARKDOWN mạch lạc, dễ hiểu, giữ lại các thông tin cốt lõi nhất."
        : "Tập trung vào việc trích xuất thông tin chính, hiểu biết sâu sắc hoặc các bước tiếp theo dựa trên văn bản này, liên quan trực tiếp đến mục tiêu.";

    const prompt = `
Bối cảnh: Bạn đang phân tích văn bản như một phần của việc đạt được mục tiêu tổng thể: "${contextGoal}".
Văn bản cần Phân tích:
---
${textToAnalyze}
---
Nhiệm vụ: Cung cấp một bản phân tích hoặc tóm tắt chi tiết của văn bản này, bằng tiếng Việt. 
${summarizeInstruction}
Kết quả PHẢI được định dạng dưới dạng MARKDOWN hoàn chỉnh. 
Sử dụng các tiêu đề Markdown (ví dụ: \`## Tiêu đề cấp 2\`, \`### Tiêu đề cấp 3\`), danh sách (\`* mục đầu dòng\`, \`1. mục đánh số\`), chữ **đậm**, chữ *nghiêng* và các khối mã (\`\`\`code\`\`\`) (nếu có) để cấu trúc thông tin một cách rõ ràng và dễ đọc.
Toàn bộ phản hồi PHẢI bằng tiếng Việt và ở định dạng MARKDOWN. Không thêm bất kỳ lời dẫn hay bình luận nào bên ngoài nội dung Markdown.
    `;
    try {
      const response: GenerateContentResponse = await this.googleGenAI.models.generateContent({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: { 
            temperature: 0.25, // Lower temperature for more factual analysis/summarization
        }
      });
      return response.text || "AI không thể phân tích văn bản này hoặc không trả về nội dung.";
    } catch (error) {
      console.error("Lỗi trong analyzeText:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `## Lỗi Phân tích Văn bản\n\nKhông thể phân tích văn bản do lỗi: ${errorMessage}`;
    }
  }
}
