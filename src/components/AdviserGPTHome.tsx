import React, { useState, useEffect, useRef } from 'react';
import Logo from '@/assets/AdviserGPT-logo.svg?react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  Search,
  PlusCircle, 
  HelpCircle, 
  User, 
  BookOpenText,
  MessageSquare,
  ChevronDown,
  ShieldPlus,
  UserRoundSearch,
  Type,
  Send,
  Paperclip,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  FileType,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useChatResults, ChatResult, Source } from '@/hooks/useChatResults';
import { TrustAnswerCard } from './TrustAnswerCard';
import { AnswerLoadingState } from './AnswerLoadingState';
import { SourceManagementPanel } from './SourceManagementPanel';
import { VaultSidebar } from './VaultSidebar';
import { ChatInput } from './ChatInput';
import { FiltersPanel } from './FiltersPanel';
import { STRATEGIES, CONTENT_TYPES, TAGS_INFO } from '@/types/vault';



interface ComplianceCheck {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  suggestion?: string;
}

interface Answer {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  vaultRatio: number;
  aiRatio: number;
  lastSynced: Date;
  version: number;
  complianceChecks?: ComplianceCheck[];
  uploadedFiles?: UploadedFile[];
  filters?: {
    tags: string[];
    strategies: string[];
    types: string[];
    priorSamples: Array<{
      id: string;
      name: string;
      type: string;
    }>;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export function AdviserGPTHome() {
  const { toast } = useToast();
  const { addRecentSearch, getLastMode, setLastMode } = useRecentSearches();
  const { saveChatResult } = useChatResults();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // State management
  const [inputValue, setInputValue] = useState('');
  const [selectedMode, setSelectedMode] = useState<'answer' | 'chat' | 'riaOutreach'>(() => getLastMode());
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [responseFormat, setResponseFormat] = useState<'text' | 'table'>('text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [showSources, setShowSources] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('search');
  const [sourcesFound, setSourcesFound] = useState(0);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [followUpFiles, setFollowUpFiles] = useState<UploadedFile[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const processedStoredResult = useRef<string | null>(null);
  
  // Filter state management
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorSamples, setSelectedPriorSamples] = useState<string[]>([]);
  const [fileHistory, setFileHistory] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>>([]);
  const [availableSources] = useState<Source[]>([
    {
      id: '4',
      name: 'Risk Management Policy.pdf',
      type: 'policy',
      similarity: 78,
      snippet: 'Our risk management framework includes comprehensive monitoring...',
      strategy: 'Balanced Strategy',
      isUsed: false,
      lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '5',
      name: 'Client Communication Guidelines.docx',
      type: 'document',
      similarity: 65,
      snippet: 'When communicating with clients about investment strategies...',
      strategy: 'Growth Strategy',
      isUsed: false,
      lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '6',
      name: 'Portfolio Construction Memo.pdf',
      type: 'memo',
      similarity: 82,
      snippet: 'Portfolio construction follows a systematic approach...',
      strategy: 'Value Strategy',
      isUsed: false,
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]);

  // Example questions
  // Example questions for Answer Mode (client questions/RFPs/DDQs)
  const answerModeExamples = [
    "What is your investment research and analysis process?",
    "Provide a brief overview of your organization's history and leadership.",
    "Describe your process for identifying investment opportunities and evaluation criteria.",
    "Describe our pre-trade and post-trade compliance process, including systems and escalation."
  ];

  // Example questions for Chat Mode (internal questions/web research)
  const chatModeExamples = [
    "Can you draft a client email on volatility, stressing patience and long-term goals?",
    "What are key talking points on U.S.–China tariffs for client calls?",
    "Can you explain our soft-dollar practices, including current policy and controls?",
    "Can you turn this into a cover letter paragraph for prospective RIA partners?"
  ];

  const riaOutreachModeExamples = [
    "Find advisers in Miami, Florida specializing in high net worth clients",
    "Search for advisers at Morgan Stanley Investment Management",
    "Find information about BlackRock Investment Management",
    "Research the investment strategies of Fidelity Investments"
  ];

  // Get current example questions based on mode
  const exampleQuestions = selectedMode === 'answer' ? answerModeExamples : selectedMode === 'chat' ? chatModeExamples : riaOutreachModeExamples;

  // File handling functions

  const handleFileUpload = (files: FileList | null, isFollowUp: boolean = false) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }));

    if (isFollowUp) {
      setFollowUpFiles(prev => [...prev, ...newFiles]);
    } else {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    toast({
      title: "Files uploaded ✓",
      description: `${newFiles.length} file(s) added successfully.`
    });
  };

  const removeFile = (fileId: string, isFollowUp: boolean = false) => {
    if (isFollowUp) {
      setFollowUpFiles(prev => prev.filter(file => file.id !== fileId));
    } else {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    }
  };

  // Filter helper functions
  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setSelectedStrategies([]);
    setSelectedTypes([]);
    setSelectedPriorSamples([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const removeStrategy = (strategy: string) => {
    setSelectedStrategies(prev => prev.filter(s => s !== strategy));
  };

  const removeType = (type: string) => {
    setSelectedTypes(prev => prev.filter(t => t !== type));
  };

  const removePriorSample = (sampleId: string) => {
    setSelectedPriorSamples(prev => prev.filter(id => id !== sampleId));
  };

  const addToFileHistory = (files: UploadedFile[]) => {
    const newHistoryEntries = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    }));
    setFileHistory(prev => [...prev, ...newHistoryEntries]);
  };

  // Function to simulate streaming answer text with dynamic progress
  const streamAnswerText = (fullAnswer: string, onComplete: () => void) => {
    setStreamingAnswer('');
    setLoadingProgress(0);
    let currentIndex = 0;
    // Remove line breaks and normalize whitespace for inline display
    const normalizedAnswer = fullAnswer.replace(/\n\s*\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = normalizedAnswer.split(' ');
    const totalWords = words.length;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        // Add 1-3 words at a time for realistic streaming
        const wordsToAdd = Math.min(1 + Math.floor(Math.random() * 3), words.length - currentIndex);
        const newText = words.slice(0, currentIndex + wordsToAdd).join(' ');
        setStreamingAnswer(newText);
        currentIndex += wordsToAdd;
        
        // Update progress based on text completion (0-95%)
        const textProgress = Math.min((currentIndex / totalWords) * 95, 95);
        setLoadingProgress(textProgress);
      } else {
        clearInterval(streamInterval);
        // Set progress to 100% when streaming completes
        setLoadingProgress(100);
        onComplete();
      }
    }, 50 + Math.random() * 100); // Random delay between 50-150ms for realistic typing
  };

  // Handle URL parameters
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    const queryParam = searchParams.get('query');
    const modeParam = searchParams.get('mode');
    
    if (resetParam === 'true') {
      // Reset all state to pristine values, but preserve the last selected mode
      setInputValue('');
      setSelectedMode(getLastMode()); // Use last selected mode instead of defaulting to 'answer'
      setSelectedStrategy('');
      setResponseFormat('text');
      setIsGenerating(false);
      setCurrentAnswer(null);
      setShowSources(false);
      setLoadingProgress(0);
      setLoadingStep('search');
      setSourcesFound(0);
      setShowSourcePanel(false);
      setUploadedFiles([]);
      setFollowUpFiles([]);
      setStreamingAnswer('');
      setIsTransitioning(false);
      
      // Clear all filters on reset
      handleClearAllFilters();
      setFileHistory([]);
      
      // Remove the reset parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reset');
      setSearchParams(newSearchParams, { replace: true });
    } else if (queryParam) {
      // Check if we have a stored result in navigation state - if so, don't handle URL params
      const state = location.state as { 
        storedChatResult?: ChatResult; 
        skipLoading?: boolean;
        filters?: {
          tags: string[];
          strategies: string[];
          types: string[];
          priorSamples: Array<{
            id: string;
            name: string;
            type: string;
          }>;
        };
        uploadedFiles?: Array<{
          id: string;
          name: string;
          type: string;
          size: number;
        }>;
      } | null;
      
      if (state?.storedChatResult && state?.skipLoading) {
        // We have a stored result, let the other useEffect handle it
        return;
      }
      
      // Handle query and mode parameters from recent search clicks
      setInputValue(queryParam);
      if (modeParam === 'answer' || modeParam === 'chat' || modeParam === 'riaOutreach') {
        setSelectedMode(modeParam);
      }
      
      // Restore filters and uploaded files from navigation state
      if (state?.filters) {
        setSelectedTags(state.filters.tags || []);
        setSelectedStrategies(state.filters.strategies || []);
        setSelectedTypes(state.filters.types || []);
        setSelectedPriorSamples(state.filters.priorSamples?.map(s => s.id) || []);
      }
      
      if (state?.uploadedFiles) {
        // Convert back to UploadedFile format for the component
        const restoredFiles: UploadedFile[] = state.uploadedFiles.map(file => {
          // Create a dummy File object for the restored file
          const dummyFile = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: Date.now()
          } as File;
          return {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            file: dummyFile
          };
        });
        setUploadedFiles(restoredFiles);
      }
      
      // Auto-run the query if no stored result is available
      setTimeout(() => {
        startChatWithQuestion(queryParam);
      }, 100); // Small delay to ensure state is set
      
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('query');
      newSearchParams.delete('mode');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, getLastMode]);

  // Handle stored chat results from navigation state
  useEffect(() => {
    const state = location.state as { storedChatResult?: ChatResult; skipLoading?: boolean } | null;
    
    if (state?.storedChatResult && state?.skipLoading) {
      const storedResult = state.storedChatResult;
      
      // Prevent processing the same result multiple times
      if (processedStoredResult.current === storedResult.id) {
        return;
      }
      
      processedStoredResult.current = storedResult.id;
      
      // Load the stored chat result directly in completed state
      setInputValue(storedResult.query);
      setSelectedMode(storedResult.mode);
      setCurrentAnswer({
        id: storedResult.id,
        question: storedResult.query,
        answer: storedResult.answer,
        sources: storedResult.sources.map(source => ({
          ...source,
          lastModified: new Date(source.lastModified)
        })),
        vaultRatio: storedResult.vaultRatio,
        aiRatio: storedResult.aiRatio,
        lastSynced: new Date(storedResult.lastSynced),
        version: storedResult.version,
        complianceChecks: storedResult.complianceChecks
      });
      setIsGenerating(false);
      setShowSources(false);
      setLoadingProgress(100); // Set to 100% to show completed state
      setLoadingStep('search');
      setSourcesFound(8);
      setShowSourcePanel(false);
      setStreamingAnswer(''); // Clear any streaming text
      
      // Clear the navigation state to prevent re-loading
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Save mode preference whenever it changes
  useEffect(() => {
    setLastMode(selectedMode);
  }, [selectedMode, setLastMode]);

  // Function to generate Answer Mode response (vault-focused)
  const generateAnswerModeResponse = (question: string) => {
    // For Answer Mode, we use vault content with AI formatting
    // This is for client questions (RFPs, DDQs, memos, emails)
    return {
      id: Date.now().toString(),
      question: question,
      answer: 'Our investment research process combines quantitative screening with qualitative analysis to identify compelling investment opportunities. We employ proprietary screening models that evaluate companies based on financial metrics including revenue growth, profitability margins, debt-to-equity ratios, and cash flow generation. Beyond the numbers, we conduct thorough qualitative analysis focusing on management quality, competitive positioning, industry dynamics, and ESG factors. Every investment undergoes comprehensive risk assessment, including scenario analysis and stress testing. We maintain strict position sizing guidelines and continuously monitor portfolio concentration risks. This disciplined approach ensures we maintain high standards while adapting to changing market conditions and maintaining our long-term investment perspective.',
      sources: [
        { id: '1', name: 'Investment Policy.docx', type: 'document', similarity: 95, snippet: 'Our research process combines quantitative screening...', strategy: 'Growth Strategy', isUsed: true, lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { id: '2', name: 'Research Overview.pdf', type: 'document', similarity: 87, snippet: 'Qualitative analysis focuses on management quality...', strategy: 'Value Strategy', isUsed: true, lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { id: '3', name: 'Compliance Memo 2025', type: 'document', similarity: 92, snippet: 'Risk management is integrated throughout...', strategy: 'Balanced Strategy', isUsed: true, lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      ],
      vaultRatio: 92,
      aiRatio: 8,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: [
        {
          id: '1',
          title: 'Adequate Risk Disclosure Check',
          status: 'passed',
          description: 'All required risk disclosures are present and properly formatted.'
        },
        {
          id: '2',
          title: 'Investment Process Documentation',
          status: 'passed',
          description: 'Investment process is clearly documented and follows regulatory requirements.'
        },
        {
          id: '3',
          title: 'Performance Claims Verification',
          status: 'failed',
          description: 'Performance claims should be accompanied by appropriate disclaimers and time periods.',
          suggestion: 'Add standard performance disclaimer: "Past performance does not guarantee future results."'
        },
        {
          id: '4',
          title: 'Regulatory Compliance Review',
          status: 'warning',
          description: 'Content should be reviewed for any recent regulatory changes that may affect the information.'
        }
      ]
    };
  };

  // Function to generate Chat Mode response (web + vault)
  const generateChatModeResponse = (question: string) => {
    // For Chat Mode, we search both web and vault for answers
    // This is for internal questions that may need current information
    
    // Simulate web search results based on question content
    const getWebSearchResults = (question: string) => {
      const lowerQuestion = question.toLowerCase();
      
      if (lowerQuestion.includes('volatility') || lowerQuestion.includes('email')) {
        return {
          answer: 'Dear Valued Client,\n\nWe understand that recent market volatility may be concerning, and we want to reassure you about your long-term investment strategy. Market fluctuations are a normal part of the investment cycle, and our disciplined approach to portfolio management is designed to weather these periods.\n\n**Key Points to Emphasize:**\n• **Patience is Paramount**: Historical data shows that staying invested through volatility typically yields better long-term results than attempting to time the market.\n• **Diversification Works**: Your portfolio is constructed with multiple asset classes and sectors to help mitigate risk during turbulent periods.\n• **Long-term Focus**: We remain committed to your financial goals and will continue to monitor and adjust your portfolio as needed.\n\nWe encourage you to view this volatility as an opportunity rather than a threat. Our research team continues to identify quality investments that may be temporarily undervalued due to market sentiment.\n\nPlease don\'t hesitate to reach out if you have any concerns or questions about your portfolio.',
          sources: [
            { id: '1', name: 'Market Volatility Trends and Client Communication Strategies - Federal Reserve', type: 'web', similarity: 94, snippet: 'The VIX (Volatility Index) has shown increased activity in recent weeks...', strategy: 'Economic Data', isUsed: true, lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { id: '2', name: 'Navigating Market Volatility: A Guide for Financial Advisors - Morningstar', type: 'web', similarity: 91, snippet: 'Historical analysis shows that periods of high volatility often precede market recoveries...', strategy: 'Market Research', isUsed: true, lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { id: '3', name: 'Investment Policy.docx', type: 'document', similarity: 85, snippet: 'Our firm\'s approach to volatility management includes...', strategy: 'Firm Policy', isUsed: true, lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { id: '4', name: 'Best Practices for Client Communication During Market Uncertainty - Bloomberg', type: 'web', similarity: 88, snippet: 'Effective client communication during volatile periods should emphasize...', strategy: 'Communication', isUsed: true, lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          ]
        };
      } else if (lowerQuestion.includes('tariff') || lowerQuestion.includes('china')) {
        return {
          answer: '**Key Talking Points on U.S.–China Tariffs for Client Calls:**\n\n**Current Situation:**\n• Recent tariff announcements have created uncertainty in global supply chains\n• Technology and manufacturing sectors are most directly impacted\n• Trade tensions continue to influence market sentiment and corporate earnings\n\n**Investment Implications:**\n• **Diversification Benefits**: Our international exposure helps mitigate single-country risks\n• **Supply Chain Resilience**: We favor companies with diversified manufacturing bases\n• **Long-term Perspective**: Trade relationships tend to normalize over time despite short-term tensions\n\n**Client Messaging:**\n• Emphasize that our investment process accounts for geopolitical risks\n• Highlight our focus on companies with strong competitive moats\n• Reassure clients that we monitor these developments closely and adjust portfolios as needed\n\n**Market Opportunities:**\n• Some quality companies may be temporarily undervalued due to tariff concerns\n• Domestic companies with limited China exposure may benefit from trade tensions\n• Infrastructure and defense sectors often see increased investment during geopolitical uncertainty',
          sources: [
            { id: '1', name: 'Latest U.S.-China Tariff Updates and Economic Impact - U.S. Trade Representative', type: 'web', similarity: 95, snippet: 'Latest tariff schedules affecting Chinese imports...', strategy: 'Government Data', isUsed: true, lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { id: '2', name: 'China Trade Relations: Analysis of Current Tensions and Market Effects - Financial Times', type: 'web', similarity: 92, snippet: 'Chinese response to U.S. tariffs and potential countermeasures...', strategy: 'News Analysis', isUsed: true, lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { id: '3', name: 'Investment Policy.docx', type: 'document', similarity: 88, snippet: 'Our firm\'s approach to geopolitical risk management...', strategy: 'Firm Policy', isUsed: true, lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { id: '4', name: 'Sector Analysis: How Tariffs Impact Corporate Earnings and Investment Strategies - Reuters', type: 'web', similarity: 89, snippet: 'Sector-by-sector analysis of tariff impacts on corporate earnings...', strategy: 'Market Research', isUsed: true, lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
          ]
        };
      } else if (lowerQuestion.includes('soft-dollar') || lowerQuestion.includes('soft dollar')) {
        return {
          answer: '**Our Soft-Dollar Practices and Current Policy:**\n\n**Definition and Framework:**\nSoft-dollar arrangements refer to the practice of using client commission dollars to pay for research and other services that benefit the investment management process. Our firm operates under strict regulatory guidelines to ensure these arrangements serve client interests.\n\n**Current Policy and Controls:**\n• **Research Focus**: Soft dollars are used exclusively for bona fide research services that directly benefit client portfolios\n• **Transparency**: All soft-dollar arrangements are disclosed to clients in our Form ADV and other regulatory filings\n• **Documentation**: We maintain detailed records of all research services received and their value to the investment process\n• **Regular Review**: Our compliance team reviews all soft-dollar arrangements quarterly to ensure continued appropriateness\n\n**Services Covered:**\n• Independent research reports and analysis\n• Market data and analytics platforms\n• Economic research and macroeconomic analysis\n• Company-specific research and due diligence\n\n**Client Benefits:**\n• Access to high-quality research without additional fees\n• Enhanced investment decision-making capabilities\n• Cost-effective research procurement\n• Improved portfolio performance through better information\n\n**Compliance Oversight:**\nOur Chief Compliance Officer oversees all soft-dollar arrangements to ensure they meet regulatory requirements and provide genuine value to our investment process.',
          sources: [
            { id: '1', name: 'SEC Guidance on Soft Dollar Arrangements and Best Practices - SEC.gov', type: 'web', similarity: 96, snippet: 'SEC guidance on appropriate use of soft dollar arrangements...', strategy: 'Regulatory', isUsed: true, lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { id: '2', name: 'Investment Policy.docx', type: 'document', similarity: 92, snippet: 'Our firm\'s soft dollar policy and procedures...', strategy: 'Firm Policy', isUsed: true, lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { id: '3', name: 'Industry Best Practices for Soft Dollar Arrangements - FINRA', type: 'web', similarity: 90, snippet: 'Industry best practices for soft dollar arrangements...', strategy: 'Industry Standards', isUsed: true, lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { id: '4', name: 'Compliance Manual 2025', type: 'document', similarity: 87, snippet: 'Internal compliance procedures for soft dollar oversight...', strategy: 'Compliance', isUsed: true, lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
          ]
        };
      } else if (lowerQuestion.includes('cover letter') || lowerQuestion.includes('prospective') || lowerQuestion.includes('partners')) {
        return {
          answer: '**Cover Letter Paragraph for Prospective RIA Partners:**\n\n*"We are excited about the opportunity to partner with your firm and believe our complementary strengths will create significant value for both our organizations and our shared clients. Our firm brings over 15 years of experience in wealth management, with a particular expertise in alternative investments and tax-efficient portfolio construction. We have consistently delivered above-benchmark returns while maintaining our commitment to transparent, client-first service. Our team of certified financial planners and chartered financial analysts is supported by robust compliance infrastructure and cutting-edge technology platforms. We are particularly drawn to your firm\'s innovative approach to client engagement and your strong track record in sustainable investing. Together, we believe we can expand our service offerings, enhance our research capabilities, and provide our clients with even more comprehensive financial solutions. We are committed to a seamless integration process that prioritizes client continuity and maintains the high service standards that both our firms are known for. We look forward to discussing how this partnership can create mutual growth opportunities while delivering exceptional value to our clients."*',
          sources: [
            { id: '1', name: 'Investment Policy.docx', type: 'document', similarity: 90, snippet: 'Our firm\'s investment philosophy and track record...', strategy: 'Firm Profile', isUsed: true, lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { id: '2', name: 'SEC Form ADV Part 2A', type: 'document', similarity: 88, snippet: 'Regulatory disclosures about our firm\'s services and capabilities...', strategy: 'Regulatory', isUsed: true, lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            { id: '3', name: 'Best Practices for RIA Partnership Negotiations and Integration - InvestmentNews', type: 'web', similarity: 87, snippet: 'Best practices for RIA partnership negotiations and integration...', strategy: 'Industry Research', isUsed: true, lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { id: '4', name: 'Performance Reports 2024', type: 'document', similarity: 87, snippet: 'Historical performance data and client satisfaction metrics...', strategy: 'Performance', isUsed: true, lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
          ]
        };
      } else {
        // Generic response for other questions
        return {
          answer: 'Based on current market analysis and our firm\'s research, here\'s a comprehensive overview of the topic. Our investment research process combines quantitative screening with qualitative analysis to identify compelling opportunities. Recent market developments have shown increased volatility, which reinforces the importance of our disciplined approach to risk management. We continue to focus on companies with strong fundamentals, competitive advantages, and sustainable business models. Our proprietary screening models evaluate companies based on financial metrics including revenue growth, profitability margins, debt-to-equity ratios, and cash flow generation. This approach has served our clients well through various market cycles.',
          sources: [
            { id: '1', name: 'Market Analysis and Investment Trends 2025 - Bloomberg', type: 'web', similarity: 90, snippet: 'Recent market developments show increased volatility...', strategy: 'Market Research', isUsed: true, lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { id: '2', name: 'Investment Policy.docx', type: 'document', similarity: 85, snippet: 'Our research process combines quantitative screening...', strategy: 'Growth Strategy', isUsed: true, lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            { id: '3', name: 'Current Market Conditions and Investment Strategy Updates - Financial Times', type: 'web', similarity: 87, snippet: 'Market volatility continues to impact investment decisions...', strategy: 'News Analysis', isUsed: true, lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { id: '4', name: 'Research Overview.pdf', type: 'document', similarity: 79, snippet: 'Qualitative analysis focuses on management quality...', strategy: 'Value Strategy', isUsed: true, lastModified: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }
          ]
        };
      }
    };

    const searchResults = getWebSearchResults(question);
    
    return {
      id: Date.now().toString(),
      question: question,
      answer: searchResults.answer,
      sources: searchResults.sources,
      vaultRatio: 15, // Only 15% from vault, 85% from web
      aiRatio: 85,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: []
    };
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    // Add to recent searches
    addRecentSearch(
      inputValue.trim(), 
      selectedMode,
      {
        tags: selectedTags,
        strategies: selectedStrategies,
        types: selectedTypes,
        priorSamples: selectedPriorSamples.map(id => {
          const sample = fileHistory.find(f => f.id === id);
          return sample ? {
            id: sample.id,
            name: sample.name,
            type: sample.type
          } : null;
        }).filter(Boolean)
      },
      uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size
      }))
    );
    
    // Add uploaded files to history for Prior Samples filter
    if (uploadedFiles.length > 0) {
      addToFileHistory(uploadedFiles);
    }
    
    setIsGenerating(true);
    setLoadingProgress(0);
    setLoadingStep('Searching Vault');
    setSourcesFound(8);
    
    // Generate answer based on mode
    const mockAnswer = selectedMode === 'answer' 
      ? generateAnswerModeResponse(inputValue)
      : generateChatModeResponse(inputValue);
    
    // Start streaming the answer text
    streamAnswerText(mockAnswer.answer, () => {
      // Set the answer immediately so the component can transition
      const answerWithFilesAndFilters = {
        ...mockAnswer,
        uploadedFiles: uploadedFiles,
        filters: {
          tags: selectedTags,
          strategies: selectedStrategies,
          types: selectedTypes,
          priorSamples: selectedPriorSamples.map(id => {
            const sample = fileHistory.find(f => f.id === id);
            return sample ? {
              id: sample.id,
              name: sample.name,
              type: sample.type
            } : null;
          }).filter(Boolean)
        }
      };
      setCurrentAnswer(answerWithFilesAndFilters);
      
      // Set the answer immediately - the progress bar collapse is now handled in AnswerLoadingState
      setIsGenerating(false);
      setStreamingAnswer('');
      
      // Save the chat result for future retrieval (async to prevent render issues)
      setTimeout(() => {
        saveChatResult({
          query: inputValue.trim(),
          answer: mockAnswer.answer,
          sources: mockAnswer.sources,
          vaultRatio: mockAnswer.vaultRatio,
          aiRatio: mockAnswer.aiRatio,
          lastSynced: mockAnswer.lastSynced,
          version: mockAnswer.version,
          complianceChecks: mockAnswer.complianceChecks,
          mode: selectedMode
        });
      }, 0);
    });
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
    // Add to recent searches
    addRecentSearch(
      question, 
      selectedMode,
      {
        tags: selectedTags,
        strategies: selectedStrategies,
        types: selectedTypes,
        priorSamples: selectedPriorSamples.map(id => {
          const sample = fileHistory.find(f => f.id === id);
          return sample ? {
            id: sample.id,
            name: sample.name,
            type: sample.type
          } : null;
        }).filter(Boolean)
      },
      uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size
      }))
    );
    // Start the chat immediately with the selected question
    startChatWithQuestion(question);
  };

  const startChatWithQuestion = async (question: string) => {
    if (!question.trim()) return;
    
    setIsGenerating(true);
    setCurrentAnswer(null);
    setShowSourcePanel(false);
    setLoadingProgress(0);
    setLoadingStep('Searching Vault');
    setSourcesFound(8);
    
    // Generate realistic mock answer based on question type with minimal AI formatting
    const generateRealisticAnswer = (question: string) => {
      if (question.includes('investment research') || question.includes('research process')) {
        return `Investment research process combines quantitative screening with qualitative analysis. 

**Quantitative Analysis**: Proprietary screening models evaluate companies based on financial metrics including revenue growth, profitability margins, debt-to-equity ratios, and cash flow generation. Quantitative tools identify companies that meet fundamental criteria for investment consideration.

**Qualitative Assessment**: Analysis focuses on management quality, competitive positioning, industry dynamics, and ESG factors. We meet with company management teams, analyze competitive landscapes, and assess long-term strategic positioning.

**Risk Management**: Every investment undergoes risk assessment, including scenario analysis and stress testing. We maintain position sizing guidelines and monitor portfolio concentration risks.

This approach ensures high standards while adapting to changing market conditions.`;
      } else if (question.includes('organization') || question.includes('history') || question.includes('leadership')) {
        return `**Company History**: Founded in 2010, firm has grown from boutique investment management company to leading institutional asset manager with over $15 billion in assets under management. Consistently delivered strong risk-adjusted returns across multiple market cycles.

**Leadership Team**: Leadership team combines decades of investment experience with deep industry expertise. Chief Investment Officer has over 25 years of experience in equity research and portfolio management, previously serving as senior analyst at major investment banks.

**Investment Philosophy**: We believe in fundamental, research-driven investing with focus on long-term value creation. Approach emphasizes thorough due diligence, disciplined risk management, and alignment with client objectives.

**Regulatory Compliance**: We maintain highest standards of regulatory compliance, with dedicated compliance officers and regular audits to ensure adherence to all applicable regulations and industry best practices.`;
      } else if (question.includes('investment opportunities') || question.includes('evaluation criteria')) {
        return `**Investment Opportunity Identification**: We identify investment opportunities through multi-faceted approach that combines bottom-up fundamental analysis with top-down macroeconomic considerations.

**Evaluation Criteria**: Investment evaluation process focuses on several key factors:
- **Financial Strength**: Strong balance sheet, consistent cash flow generation, and sustainable competitive advantages
- **Growth Prospects**: Clear path to revenue and earnings growth with reasonable valuation metrics
- **Management Quality**: Experienced leadership team with proven track record and shareholder-friendly policies
- **Industry Position**: Market leadership or strong competitive positioning within attractive industry dynamics

**Due Diligence Process**: Each potential investment undergoes extensive due diligence including financial modeling, management meetings, industry analysis, and peer comparisons. We typically spend 2-4 weeks on initial research before making investment decisions.

**Risk Assessment**: We evaluate both company-specific and systematic risks, ensuring each investment fits within overall portfolio construction and risk management framework.`;
      } else if (question.includes('compliance') || question.includes('pre-trade') || question.includes('post-trade')) {
        return `**Pre-Trade Compliance**: Pre-trade compliance process begins with automated screening through compliance monitoring system, which checks all proposed trades against client investment guidelines, regulatory restrictions, and internal risk limits.

**Trade Execution**: All trades are executed through approved brokers and trading platforms that maintain strict regulatory compliance standards. We maintain detailed trade logs and ensure proper documentation for all transactions.

**Post-Trade Monitoring**: Following trade execution, compliance team conducts post-trade reviews to ensure all trades were executed in accordance with client guidelines and regulatory requirements. We maintain comprehensive audit trails and conduct regular compliance testing.

**Escalation Procedures**: Any compliance violations or exceptions are immediately escalated to senior management and Chief Compliance Officer. We maintain detailed incident reporting procedures and implement corrective actions as needed.

**Regulatory Reporting**: We provide regular compliance reports to clients and maintain ongoing communication with regulatory authorities to ensure full transparency and adherence to all applicable regulations.`;
      } else {
        return `Investment approach combines rigorous fundamental analysis with disciplined risk management to deliver consistent, risk-adjusted returns for clients. We focus on identifying high-quality companies with sustainable competitive advantages and strong management teams.

Research process integrates quantitative screening with qualitative assessment, ensuring we thoroughly evaluate both financial metrics and business fundamentals. We maintain strict compliance standards and regularly review investment processes to ensure they meet highest industry standards.

Client relationships are built on transparency, communication, and alignment of interests. We provide regular reporting and maintain open dialogue with clients to ensure investment approach continues to meet their evolving needs and objectives.`;
      }
    };

    const mockAnswer: Answer = {
      id: `example-${Date.now()}`,
      question,
      answer: generateRealisticAnswer(question),
      sources: [
        {
          id: '1',
          name: 'Investment Research Process.pdf',
          type: 'PDF',
          similarity: 95,
          snippet: 'Our investment research process follows a systematic approach...',
          isUsed: true,
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: '2', 
          name: 'Compliance Guidelines.docx',
          type: 'Document',
          similarity: 88,
          snippet: 'Compliance procedures ensure all activities meet regulatory requirements...',
          isUsed: true,
          lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ],
      vaultRatio: 92,
      aiRatio: 8,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: [
        {
          id: '1',
          title: 'Content Review',
          status: 'passed',
          description: 'Content has been reviewed for compliance'
        },
        {
          id: '2',
          title: 'Risk Assessment',
          status: 'passed',
          description: 'Low risk content identified'
        }
      ]
    };
    
    // Start streaming the answer text
    streamAnswerText(mockAnswer.answer, () => {
      // Set the answer immediately so the component can transition
      const answerWithFiles = {
        ...mockAnswer,
        uploadedFiles: uploadedFiles
      };
      setCurrentAnswer(answerWithFiles);
      
      // Set the answer immediately - the progress bar collapse is now handled in AnswerLoadingState
      setIsGenerating(false);
      setStreamingAnswer('');
      
      // Save the chat result for future retrieval (async to prevent render issues)
      setTimeout(() => {
        saveChatResult({
          query: question.trim(),
          answer: mockAnswer.answer,
          sources: mockAnswer.sources,
          vaultRatio: mockAnswer.vaultRatio,
          aiRatio: mockAnswer.aiRatio,
          lastSynced: mockAnswer.lastSynced,
          version: mockAnswer.version,
          complianceChecks: mockAnswer.complianceChecks,
          mode: selectedMode
        });
      }, 0);
    });
  };

  const handleCopy = () => {
    if (currentAnswer) {
      navigator.clipboard.writeText(currentAnswer.answer);
      toast({
        title: "Copied to clipboard ✓",
        description: "Answer copied successfully."
      });
    }
  };

  // Mock Vault Data - in a real app, this would come from an API
  const [mockVaultData, setMockVaultData] = useState([
    {
      id: 'vault-1',
      question: 'What is your investment research and analysis process?',
      answer: 'Investment research process combines quantitative screening with qualitative analysis. Proprietary screening models evaluate companies based on financial metrics including revenue growth, profitability margins, debt-to-equity ratios, and cash flow generation.',
      category: 'Investment Process',
      lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'vault-2', 
      question: 'Describe our pre-trade and post-trade compliance process',
      answer: 'Pre-trade compliance process begins with automated screening through compliance monitoring system, which checks all proposed trades against client investment guidelines, regulatory restrictions, and internal risk limits.',
      category: 'Compliance',
      lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ]);

  const handleSave = (updatedAnswer?: Answer) => {
    if (updatedAnswer) {
      // Check if this answer matches an existing vault entry
      const existingEntry = mockVaultData.find(entry => 
        entry.question.toLowerCase() === updatedAnswer.question.toLowerCase()
      );
      
      if (existingEntry) {
        // Update existing entry
        setMockVaultData(prev => prev.map(entry => 
          entry.id === existingEntry.id 
            ? { ...entry, answer: updatedAnswer.answer, lastModified: new Date() }
            : entry
        ));
        toast({
          title: "Updated in Vault ✓",
          description: `Answer updated in ${existingEntry.category}`
        });
      } else {
        // Add new entry to vault
        const newEntry = {
          id: `vault-${Date.now()}`,
          question: updatedAnswer.question,
          answer: updatedAnswer.answer,
          category: 'Custom Answers',
          lastModified: new Date()
        };
        setMockVaultData(prev => [...prev, newEntry]);
        toast({
          title: "Saved to Vault ✓",
          description: "New answer saved to Custom Answers"
        });
      }
    } else {
      // Original save behavior (for existing save button)
      toast({
        title: "Saved to Vault ✓",
        description: "Answer saved to RIA Strategy / Investment Process"
      });
    }
  };

  const handleEmail = () => {
    toast({
      title: "Email opened",
      description: "Your default email client has opened with the formatted text."
    });
  };

  const handleSourceAdd = (sourceId: string) => {
    // In a real app, this would add the source to the current answer
    console.log('Add source:', sourceId);
    toast({
      title: "Source added",
      description: "The source has been added to your answer."
    });
  };

  const handleSourceRemove = (sourceId: string) => {
    // In a real app, this would remove the source from the current answer
    console.log('Remove source:', sourceId);
    toast({
      title: "Source removed",
      description: "The source has been removed from your answer."
    });
  };

  const handleRebuild = () => {
    // In a real app, this would rebuild the answer with current sources
    console.log('Rebuild answer');
    toast({
      title: "Answer rebuilt ✓",
      description: "Answer rebuilt using current sources."
    });
  };

  return (
    <div className="h-screen w-full bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className={`flex-1 overflow-y-auto flex flex-col
          ${!currentAnswer && !isGenerating ? 'p-8' : 'p-0'}`}>
          
          {/* Header - Show when generating or when answer is loaded */}
          {(isGenerating || currentAnswer) && (
            <div className="border-b border-foreground/10">
              <div className="flex items-center justify-between text-sm mb-4 px-6 pt-4">
                <Logo aria-label="AdviserGPT" className="h-4 w-auto" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourcePanel(true)}
                  className="flex items-center gap-2"
                >
                  <BookOpenText className="h-4 w-4" />
                  View Sources
                </Button>
              </div>
            </div>
          )}
          <div className={`max-w-4xl mx-auto
          ${!currentAnswer && !isGenerating ? 'h-full' : 'flex-1 flex flex-col w-full'}`}>
            {!currentAnswer && !isGenerating ? (
              /* Initial State */
              <div className="flex flex-col items-center justify-center space-y-12 h-full">
                <div className="text-center mb-8 space-y-6">
                  <h2 className="text-4xl font-bold mb-2"><Logo aria-label="AdviserGPT" className="h-8 w-auto mx-auto" /></h2>
                  <p className="text-lg text-foreground/90">
                    Every response is sourced from your Vault to match your firm's tone of voice.
                  </p>
                  
                </div>

                {/* Input Bar */}
                <div className="w-full max-w-3xl mb-8">
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex flex-col gap-2 md:flex-row md:gap-0 justify-between items-center">
                      <div className="flex flex-1 w-full md:w-auto md:flex-none items-center bg-foreground/10 rounded-lg p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedMode('answer')}
                              className={`flex flex-1 md:flex-none justify-center md:justify-start items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedMode === 'answer'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-foreground/60 hover:text-foreground'
                              }`}
                            >
                              <BookOpenText className="h-4 w-4" />
                              Vault Only
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>For client questions - uses firm-approved Vault content</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedMode('chat')}
                              className={`flex flex-1 md:flex-none justify-center md:justify-start items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedMode === 'chat'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-foreground/60 hover:text-foreground'
                              }`}
                            >
                              <ShieldPlus className="h-4 w-4" />
                              Vault + Web
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>For internal questions - searches web + Vault sources</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Filters Button */}
                      <div className="flex flex-1 w-full md:w-auto md:flex-none justify-center text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFiltersPanel(true)}
                          className="flex items-center gap-2 w-full md:w-auto"
                        >
                          <Filter className="h-4 w-4" />
                          Open Filters
                          {(selectedTags.length + selectedStrategies.length + 
                            selectedTypes.length + selectedPriorSamples.length) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedTags.length + selectedStrategies.length + 
                               selectedTypes.length + selectedPriorSamples.length}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Filter Badges */}
                    {(selectedTags.length > 0 || selectedStrategies.length > 0 || 
                      selectedTypes.length > 0 || selectedPriorSamples.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                        {selectedStrategies.map(strategy => (
                          <Badge key={strategy} variant="secondary" className="flex items-center gap-1">
                            {strategy}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeStrategy(strategy)}
                            />
                          </Badge>
                        ))}
                        {selectedTypes.map(type => (
                          <Badge key={type} variant="secondary" className="flex items-center gap-1">
                            {type}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeType(type)}
                            />
                          </Badge>
                        ))}
                        {selectedPriorSamples.map(sampleId => {
                          const sample = fileHistory.find(f => f.id === sampleId);
                          return sample ? (
                            <Badge key={sampleId} variant="secondary" className="flex items-center gap-1">
                              {sample.name}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                onClick={() => removePriorSample(sampleId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Main Input */}
                    <ChatInput
                      value={inputValue}
                      onChange={setInputValue}
                      onSubmit={handleSubmit}
                      placeholder="e.g. What is our investment research process?"
                      disabled={isGenerating}
                      autoFocus={true}
                      variant="main"
                      uploadedFiles={uploadedFiles}
                      onFileUpload={(files) => handleFileUpload(files, false)}
                      onFileRemove={(fileId) => removeFile(fileId, false)}
                      showFormatDropdown={true}
                      showAttachButton={true}
                      showFileCards={true}
                    />
                  </div>
                </div>

                {/* Examples */}
                <div className="w-full max-w-3xl mb-8">
                  <div className="text-center mb-2">
                    <p className="text-sm text-foreground/80">Try one of these examples:</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {Object.values(exampleQuestions).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-sm font-normal bg-sidebar-background/50 flex flex-wrap justify-between min-h-14 h-auto px-4 py-2 items-center text-sidebar-foreground hover:bg-sidebar-background/70 border-foreground/10 hover:border-foreground/20 whitespace-normal text-left"
                        onClick={() => handleExampleClick(question)}
                      >
                        <span className="flex flex-1">{question}</span> <PlusCircle className="h-4 w-4 text-sidebar-foreground/70" />
                      </Button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* Chat State (Loading or Answer) */
              <div className="space-y-6 flex-1 pb-8 flex flex-col justify-end w-full">
                {/* User Question */}
                <div className="flex justify-end w-full">
                  <div className="max-w-[90%] flex justify-end items-end flex-col pt-4">
                    {/* Uploaded Files Display - Show during generation or when answer is loaded */}
                    {((isGenerating && uploadedFiles.length > 0) || (currentAnswer?.uploadedFiles && currentAnswer.uploadedFiles.length > 0)) && (
                      <div className="w-full flex gap-2 mb-2 overflow-x-auto">
                        {(isGenerating ? uploadedFiles : currentAnswer.uploadedFiles).map((file) => (
                          <div key={file.id} className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 min-w-0 flex-shrink-0">
                            <span className="text-sm">📄</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                              <p className="text-xs text-foreground/60">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Filters Display - Show during generation or when answer is loaded */}
                    {((isGenerating && (selectedTags.length > 0 || selectedStrategies.length > 0 || selectedTypes.length > 0 || selectedPriorSamples.length > 0)) || 
                      (currentAnswer?.filters && (
                        currentAnswer.filters.tags.length > 0 || 
                        currentAnswer.filters.strategies.length > 0 || 
                        currentAnswer.filters.types.length > 0 || 
                        currentAnswer.filters.priorSamples.length > 0
                      ))) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {/* Show current filters during generation */}
                          {isGenerating ? (
                            <>
                              {selectedTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  Tag: {tag}
                                </Badge>
                              ))}
                              {selectedStrategies.map(strategy => (
                                <Badge key={strategy} variant="secondary" className="text-xs">
                                  Strategy: {strategy}
                                </Badge>
                              ))}
                              {selectedTypes.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  Type: {type}
                                </Badge>
                              ))}
                              {selectedPriorSamples.map(sampleId => {
                                const sample = fileHistory.find(f => f.id === sampleId);
                                return sample ? (
                                  <Badge key={sampleId} variant="secondary" className="text-xs">
                                    Sample: {sample.name}
                                  </Badge>
                                ) : null;
                              })}
                            </>
                          ) : (
                            /* Show saved filters from answer */
                            <>
                              {currentAnswer.filters.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  Tag: {tag}
                                </Badge>
                              ))}
                              {currentAnswer.filters.strategies.map(strategy => (
                                <Badge key={strategy} variant="secondary" className="text-xs">
                                  Strategy: {strategy}
                                </Badge>
                              ))}
                              {currentAnswer.filters.types.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  Type: {type}
                                </Badge>
                              ))}
                              {currentAnswer.filters.priorSamples.map(sample => (
                                <Badge key={sample.id} variant="secondary" className="text-xs">
                                  Sample: {sample.name}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      )
                    }
                    <div className="p-2.5 rounded-lg bg-foreground/5 border border-gray-200 text-foreground text-[15px] leading-6">
                      {isGenerating ? inputValue : currentAnswer.question}
                    </div>
                  </div>
                </div>

                {/* Unified Loading/Answer Component */}
                <div className="flex-1 h-full w-full">
                  <AnswerLoadingState
                    progress={loadingProgress}
                    currentStep={loadingStep}
                    sourcesFound={sourcesFound}
                    mode={selectedMode}
                    streamingText={streamingAnswer}
                    isTransitioning={isTransitioning}
                    answer={currentAnswer}
                    onCopy={handleCopy}
                    onSave={handleSave}
                    onEmail={handleEmail}
                    onEdit={(type, value) => {
                      // Handle edit actions
                      console.log('Edit:', type, value);
                    }}
                  />
                </div>

                {/* Follow-up Input */}
                <div id="follow-up-input" className="max-w-3xl mx-auto sticky bottom-0 self-end w-full pt-8">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleSubmit}
                    placeholder="Add follow-up instructions or click 'Answers' to start fresh..."
                    disabled={isGenerating}
                    variant="followup"
                    uploadedFiles={followUpFiles}
                    onFileUpload={(files) => handleFileUpload(files, true)}
                    onFileRemove={(fileId) => removeFile(fileId, true)}
                    showFormatDropdown={true}
                    showAttachButton={true}
                    showFileCards={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Source Management Panel */}
      <SourceManagementPanel
        isOpen={showSourcePanel}
        onClose={() => setShowSourcePanel(false)}
        query={currentAnswer?.question || ''}
        usedSources={currentAnswer?.sources || []}
        availableSources={availableSources}
        onSourceAdd={handleSourceAdd}
        onSourceRemove={handleSourceRemove}
        onRebuild={handleRebuild}
      />

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        selectedStrategies={selectedStrategies}
        onStrategiesChange={setSelectedStrategies}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selectedPriorSamples={selectedPriorSamples}
        onPriorSamplesChange={setSelectedPriorSamples}
        priorSamples={fileHistory}
        onClearAll={handleClearAllFilters}
      />
    </div>
  );
}
