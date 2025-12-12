import { ColumnGuesses } from '@/types/import';

/**
 * Detect column roles from Excel headers using heuristics
 */
export function detectColumnsFromExcel(headers: string[]): ColumnGuesses {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Section column detection (prioritize "section" over "category")
  const sectionKeywords = ['section', 'heading', 'header', 'group', 'topic', 'category'];
  const sectionIndex = normalizedHeaders.findIndex(h => 
    sectionKeywords.some(keyword => h.includes(keyword))
  );
  const section = sectionIndex >= 0 ? headers[sectionIndex] : null;
  
  // Question column detection
  const questionKeywords = ['question', 'question_text', 'q', 'query', 'questions', 'q&a', 'qa'];
  const questionIndex = normalizedHeaders.findIndex(h => 
    questionKeywords.some(keyword => h.includes(keyword))
  );
  const question = questionIndex >= 0 ? headers[questionIndex] : null;
  
  // Answer column detection
  const answerKeywords = ['answer', 'response', 'a', 'response_text', 'answers', 'response_text', 'reply'];
  const answerIndex = normalizedHeaders.findIndex(h => 
    answerKeywords.some(keyword => h.includes(keyword))
  );
  const answer = answerIndex >= 0 ? headers[answerIndex] : null;
  
  // Sub-question column detection
  const subQuestionKeywords = ['sub-question', 'subquestion', 'sub question', 'sub_question', 'subq', 'sub_q'];
  const subQuestionIndex = normalizedHeaders.findIndex(h => 
    subQuestionKeywords.some(keyword => h.includes(keyword))
  );
  const subQuestion = subQuestionIndex >= 0 ? headers[subQuestionIndex] : null;
  
  // Tag column detection
  const tagKeywords = ['tag', 'category', 'strategy', 'topic', 'label', 'type', 'tags', 'categories', 'labels'];
  const tagColumns = headers.filter((h, index) => {
    const normalized = normalizedHeaders[index];
    // Don't include columns already assigned to section/question/answer/sub-question
    if (h === section || h === question || h === answer || h === subQuestion) return false;
    return tagKeywords.some(keyword => normalized.includes(keyword));
  });
  
  return {
    section,
    question,
    answer,
    subQuestion,
    tagColumns,
  };
}

