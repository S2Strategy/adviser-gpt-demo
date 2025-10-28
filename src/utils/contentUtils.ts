import exampleQuestions from '@/data/exampleQuestions.json';
import mockData from '@/data/mockData.json';
import responseTemplates from '@/data/responseTemplates.json';

// Helper function to convert offset days to actual Date
const createDateFromOffset = (offsetDays: number): Date => {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
};

// Process sources to convert offset to actual dates
const processSources = (sources: any[]) => {
  return sources.map(source => ({
    ...source,
    lastModified: createDateFromOffset(source.lastModifiedOffset || 0)
  }));
};

// Process vault data to convert offset to actual dates
const processVaultData = (vaultData: any[]) => {
  return vaultData.map(item => ({
    ...item,
    lastModified: createDateFromOffset(item.lastModifiedOffset || 0)
  }));
};

// Get example questions by mode
export const getExampleQuestions = (mode: 'answer' | 'chat' | 'riaOutreach') => {
  switch (mode) {
    case 'answer':
      return exampleQuestions.answerMode;
    case 'chat':
      return exampleQuestions.chatMode;
    case 'riaOutreach':
      return exampleQuestions.riaOutreachMode;
    default:
      return exampleQuestions.answerMode;
  }
};

// Get available sources with processed dates
export const getAvailableSources = () => {
  return processSources(mockData.availableSources);
};

// Get mock vault data with processed dates
export const getMockVaultData = () => {
  return processVaultData(mockData.mockVaultData);
};

// Get response template for answer mode
export const getAnswerModeResponse = () => {
  const template = responseTemplates.answerModeResponses.default;
  return {
    ...template,
    sources: processSources(template.sources)
  };
};

// Get response template for chat mode based on question content
export const getChatModeResponse = (question: string) => {
  const lowerQuestion = question.toLowerCase();
  
  let templateKey = 'default';
  if (lowerQuestion.includes('volatility') || lowerQuestion.includes('email')) {
    templateKey = 'volatility';
  } else if (lowerQuestion.includes('tariff') || lowerQuestion.includes('china')) {
    templateKey = 'tariffs';
  } else if (lowerQuestion.includes('soft-dollar') || lowerQuestion.includes('soft dollar')) {
    templateKey = 'softDollar';
  } else if (lowerQuestion.includes('cover letter') || lowerQuestion.includes('prospective') || lowerQuestion.includes('partners')) {
    templateKey = 'coverLetter';
  }
  
  const template = responseTemplates.chatModeResponses[templateKey];
  return {
    ...template,
    sources: processSources(template.sources)
  };
};

// Get example response based on question content
export const getExampleResponse = (question: string) => {
  const lowerQuestion = question.toLowerCase();
  
  let templateKey = 'default';
  if (lowerQuestion.includes('investment research') || lowerQuestion.includes('research process')) {
    templateKey = 'investmentResearch';
  } else if (lowerQuestion.includes('organization') || lowerQuestion.includes('history') || lowerQuestion.includes('leadership')) {
    templateKey = 'organizationHistory';
  } else if (lowerQuestion.includes('investment opportunities') || lowerQuestion.includes('evaluation criteria')) {
    templateKey = 'investmentOpportunities';
  } else if (lowerQuestion.includes('compliance') || lowerQuestion.includes('pre-trade') || lowerQuestion.includes('post-trade')) {
    templateKey = 'complianceProcess';
  }
  
  const template = responseTemplates.exampleResponses[templateKey];
  return {
    ...template,
    sources: processSources(template.sources)
  };
};
