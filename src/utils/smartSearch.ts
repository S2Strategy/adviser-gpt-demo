import { ContentItem, QuestionItem } from '@/types/vault';

// Semantic mapping for related terms and concepts
const SEMANTIC_MAPPINGS: Record<string, string[]> = {
  // AI related terms
  'ai': ['artificial intelligence', 'machine learning', 'chatgpt', 'copilot', 'bard', 'automation', 'algorithm'],
  'artificial intelligence': ['ai', 'machine learning', 'chatgpt', 'copilot', 'bard', 'automation'],
  'machine learning': ['ai', 'artificial intelligence', 'algorithm', 'automation'],
  'chatgpt': ['ai', 'artificial intelligence', 'openai', 'gpt'],
  'copilot': ['ai', 'artificial intelligence', 'github', 'microsoft'],
  
  // Policy related terms
  'policy': ['policies', 'guidelines', 'procedures', 'rules', 'compliance', 'regulations'],
  'policies': ['policy', 'guidelines', 'procedures', 'rules', 'compliance'],
  'guidelines': ['policy', 'policies', 'procedures', 'rules', 'compliance'],
  'procedures': ['policy', 'policies', 'guidelines', 'process', 'workflow'],
  'compliance': ['policy', 'policies', 'regulations', 'legal', 'audit'],
  
  // Investment related terms (more conservative)
  'investment': ['investing', 'portfolio', 'assets', 'securities', 'funds'],
  'investing': ['investment', 'portfolio', 'assets', 'securities', 'funds'],
  'portfolio': ['investment', 'investing', 'assets', 'securities', 'funds'],
  'strategy': ['strategies', 'approach', 'methodology'],
  'strategies': ['strategy', 'approach', 'methodology'],
  
  // ESG related terms
  'esg': ['environmental', 'social', 'governance', 'sustainability', 'responsible investing'],
  'environmental': ['esg', 'green', 'sustainability', 'climate', 'carbon'],
  'social': ['esg', 'social responsibility', 'community', 'stakeholder'],
  'governance': ['esg', 'corporate governance', 'board', 'management'],
  'sustainability': ['esg', 'environmental', 'green', 'sustainable'],
  
  // Risk related terms
  'risk': ['risks', 'risk management', 'volatility', 'uncertainty', 'exposure'],
  'risks': ['risk', 'risk management', 'volatility', 'uncertainty'],
  'volatility': ['risk', 'risks', 'uncertainty', 'fluctuation'],
  
  // Fixed income related terms
  'fixed income': ['bonds', 'bond', 'debt', 'credit', 'yield', 'duration'],
  'bonds': ['fixed income', 'bond', 'debt', 'credit', 'yield'],
  'bond': ['fixed income', 'bonds', 'debt', 'credit', 'yield'],
  'duration': ['fixed income', 'bonds', 'interest rate', 'maturity'],
  
  // Emerging markets related terms
  'emerging markets': ['emerging', 'developing', 'frontier', 'international'],
  'emerging': ['emerging markets', 'developing', 'frontier'],
  'developing': ['emerging markets', 'emerging', 'frontier'],
  
  // Large cap related terms
  'large cap': ['large-cap', 'largecap', 'blue chip', 'mega cap'],
  'large-cap': ['large cap', 'largecap', 'blue chip', 'mega cap'],
  'blue chip': ['large cap', 'large-cap', 'mega cap'],
  
  // RFP related terms
  'rfp': ['request for proposal', 'proposal', 'tender', 'bid'],
  'request for proposal': ['rfp', 'proposal', 'tender', 'bid'],
  'proposal': ['rfp', 'request for proposal', 'tender', 'bid'],
  
  // Questionnaire related terms
  'questionnaire': ['questions', 'survey', 'inquiry', 'assessment'],
  'questions': ['questionnaire', 'survey', 'inquiry', 'assessment'],
  'survey': ['questionnaire', 'questions', 'inquiry', 'assessment'],
  
  // General business terms
  'firm': ['company', 'organization', 'business', 'corporation'],
  'company': ['firm', 'organization', 'business', 'corporation'],
  'organization': ['firm', 'company', 'business', 'corporation'],
  'business': ['firm', 'company', 'organization', 'corporation'],
  
  // Fee related terms
  'fee': ['fees', 'cost', 'pricing', 'rate', 'charge'],
  'fees': ['fee', 'cost', 'pricing', 'rate', 'charge'],
  'pricing': ['fee', 'fees', 'cost', 'rate', 'charge'],
  'cost': ['fee', 'fees', 'pricing', 'rate', 'charge'],
};

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
  'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
]);

// Function to extract key terms from a query
function extractKeyTerms(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(term => term.length > 1 && !STOP_WORDS.has(term))
    .filter((term, index, array) => array.indexOf(term) === index); // Remove duplicates
}

// Function to get semantic variations of a term
export function getSemanticVariations(term: string): string[] {
  const variations = new Set<string>([term]);
  
  // Add direct semantic mappings
  if (SEMANTIC_MAPPINGS[term]) {
    SEMANTIC_MAPPINGS[term].forEach(variation => variations.add(variation));
  }
  
  // Add reverse mappings
  Object.entries(SEMANTIC_MAPPINGS).forEach(([key, values]) => {
    if (values.includes(term)) {
      variations.add(key);
    }
  });
  
  return Array.from(variations);
}

// Function to calculate fuzzy match score
function fuzzyMatchScore(text: string, query: string): number {
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) {
    return 1.0;
  }
  
  // Check for partial matches
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  let matchCount = 0;
  let totalWords = queryWords.length;
  
  queryWords.forEach(queryWord => {
    if (textWords.some(textWord => 
      textWord.includes(queryWord) || 
      queryWord.includes(textWord) ||
      levenshteinDistance(textWord, queryWord) <= 2
    )) {
      matchCount++;
    }
  });
  
  return matchCount / totalWords;
}

// Simple Levenshtein distance calculation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Function to calculate relevance score for an item
function calculateRelevanceScore(item: QuestionItem, query: string): number {
  const keyTerms = extractKeyTerms(query);
  let totalScore = 0;
  let termCount = 0;
  
  // Get all searchable text from the item
  // Handle tags - can be strings (old format) or objects with type/value (new format)
  const tagTexts = (item.tags || []).map(tag => {
    if (typeof tag === 'string') {
      return tag;
    } else if (tag && typeof tag === 'object' && 'value' in tag) {
      return tag.value;
    }
    return '';
  }).filter(Boolean);
  
  const searchableText = [
    (item as any).documentTitle || '',
    item.question || '',
    item.answer || '',
    item.body || '',
    ...tagTexts,
    Array.isArray(item.strategy) ? item.strategy.join(' ') : item.strategy || '',
    item.type || ''
  ].join(' ').toLowerCase();
  
  keyTerms.forEach(term => {
    const variations = getSemanticVariations(term);
    let termScore = 0;
    
    variations.forEach(variation => {
      // Check for exact matches in different fields with different weights
      if ((item as any).documentTitle?.toLowerCase().includes(variation)) {
        termScore = Math.max(termScore, 1.0); // Document title matches get highest weight
      }
      if (item.question?.toLowerCase().includes(variation)) {
        termScore = Math.max(termScore, 0.9); // Question matches get high weight
      }
      if (item.answer?.toLowerCase().includes(variation)) {
        termScore = Math.max(termScore, 0.8); // Answer matches get good weight
      }
      if (item.tags.some(tag => {
        const tagValue = typeof tag === 'string' ? tag : (tag && typeof tag === 'object' && 'value' in tag ? tag.value : '');
        return tagValue.toLowerCase().includes(variation);
      })) {
        termScore = Math.max(termScore, 0.7); // Tag matches get decent weight
      }
      const strategyText = Array.isArray(item.strategy) ? item.strategy.join(' ') : item.strategy;
      if (strategyText.toLowerCase().includes(variation)) {
        termScore = Math.max(termScore, 0.6); // Strategy matches get moderate weight
      }
      if (item.type.toLowerCase().includes(variation)) {
        termScore = Math.max(termScore, 0.5); // Type matches get lower weight
      }
      
      // Add fuzzy matching score (reduced weight to be more conservative)
      const fuzzyScore = fuzzyMatchScore(searchableText, variation) * 0.15;
      termScore = Math.max(termScore, fuzzyScore);
    });
    
    totalScore += termScore;
    termCount++;
  });
  
  // Calculate average score
  const averageScore = termCount > 0 ? totalScore / termCount : 0;
  
  // Boost score for items with multiple matching terms (more conservative)
  const boostFactor = keyTerms.length > 1 ? 1.1 : 1.0;
  
  return averageScore * boostFactor;
}

// Main smart search function
export function smartSearch(items: QuestionItem[], query: string): QuestionItem[] {
  if (!query.trim()) {
    return items;
  }
  
  // Calculate relevance scores for all items
  const itemsWithScores = items.map(item => ({
    item,
    score: calculateRelevanceScore(item, query)
  }));
  
  // Filter out items with low scores (below 0.3) to be more selective
  let relevantItems = itemsWithScores
    .filter(({ score }) => score > 0.3)
    .sort((a, b) => b.score - a.score) // Sort by relevance score descending
    .map(({ item }) => item);
  
  // If no results found with strict criteria, try with lower threshold for very specific queries
  const keyTerms = extractKeyTerms(query);
  if (relevantItems.length === 0 && keyTerms.length >= 2) {
    relevantItems = itemsWithScores
      .filter(({ score }) => score > 0.2)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 3); // Limit to top 3 results for fallback
  }
  
  return relevantItems;
}

// Function to get search suggestions based on query
export function getSearchSuggestions(query: string): string[] {
  const keyTerms = extractKeyTerms(query);
  const suggestions = new Set<string>();
  
  keyTerms.forEach(term => {
    const variations = getSemanticVariations(term);
    variations.forEach(variation => {
      if (variation !== term) {
        suggestions.add(variation);
      }
    });
  });
  
  return Array.from(suggestions).slice(0, 5); // Return top 5 suggestions
}
