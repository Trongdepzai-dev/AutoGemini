
import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify'; // For security, if needed, but 'marked' has some built-in. For user-generated MD, it's essential. For AI-generated, it's good practice.

interface ResultsDisplayProps {
  markdownContent: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ markdownContent }) => {
  
  const htmlContent = useMemo(() => {
    if (!markdownContent) return '';
    // Configure marked (optional, but good for GFM, etc.)
    marked.setOptions({
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert '\n' in paragraphs into <br>
      // The 'sanitize' option was removed in marked v5+. 
      // DOMPurify should be used on the output if sanitization is required.
      // sanitizer: (html) => DOMPurify.sanitize(html), // If using DOMPurify with marked's (older) sanitizer hook
    });
    const rawHtml = marked.parse(markdownContent) as string;
    // Sanitize HTML if you are concerned about XSS from the Markdown source.
    // For AI-generated content that you control the prompt for, this might be less of an issue,
    // but for any user-inputted markdown, it's crucial.
    // const cleanHtml = DOMPurify.sanitize(rawHtml); 
    // return cleanHtml;
    return rawHtml; // Trusting AI output for now, but DOMPurify is recommended for production if MD source is untrusted.
  }, [markdownContent]);

  return (
    <div 
      className="results-content" 
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
