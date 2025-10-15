import { useState, useEffect } from "react";
import { 
  Building, 
  ChevronsUpDown, 
  Home, 
  CloudUpload,
  ShieldCheck, 
  MessageSquareLock,
  Rocket, 
  FileText, 
  UserRound, 
  ChevronUp,
  ChevronDown,
  SquarePen,
  Users,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSavedSearches } from "@/contexts/SavedSearchesContext";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useChatResults } from "@/hooks/useChatResults";
import ChatSidebar from "./ChatSidebar";

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  lastMessage: string;
  unread?: boolean;
  pinned?: boolean;
  archived?: boolean;
}

export function VaultSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isChatsExpanded, setIsChatsExpanded] = useState(() => {
    const saved = localStorage.getItem('vault-sidebar-chats-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isChatsIconHovered, setIsChatsIconHovered] = useState(false);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vault-sidebar-chats-expanded', JSON.stringify(isChatsExpanded));
  }, [isChatsExpanded]);
  
  const { savedSearches } = useSavedSearches();
  const { recentSearches: searchHistory } = useSearchHistory();
  const { recentSearchesForSidebar, removeRecentSearch } = useRecentSearches();
  const { getChatResultByQuery } = useChatResults();
  
  const recentSavedSearches = savedSearches.slice(0, 5);
  
  // Convert recent searches to conversation format for display, limit to 7
  const recentConversations: Conversation[] = recentSearchesForSidebar.slice(0, 7).map(search => ({
    id: search.id,
    title: search.displayTitle,
    timestamp: new Date(search.timestamp),
    lastMessage: search.query,
    unread: false,
    pinned: false
  }));

  // Determine which recent chat is currently active based on URL parameters
  const getActiveChatId = () => {
    const searchParams = new URLSearchParams(location.search);
    const queryParam = searchParams.get('query');
    const modeParam = searchParams.get('mode') as 'answer' | 'chat' | null;
    
    if (queryParam && modeParam) {
      // Find the recent search that matches the current query and mode
      const activeSearch = recentSearchesForSidebar.find(search => 
        search.query.toLowerCase() === queryParam.toLowerCase() && 
        search.mode === modeParam
      );
      return activeSearch?.id;
    }
    
    return undefined;
  };

  // Helper function to generate clean search URLs
  const generateSearchUrl = (search: any) => {
    const params = new URLSearchParams();
    
    if (search.query && search.query.trim()) params.set('query', search.query.trim());
    if (search.filters.strategies?.length > 0) {
      const strategies = search.filters.strategies.filter((s: string) => s && s.trim());
      if (strategies.length > 0) params.set('strategy', strategies.join(','));
    }
    if (search.filters.types?.length > 0) {
      const types = search.filters.types.filter((t: string) => t && t.trim());
      if (types.length > 0) params.set('type', types.join(','));
    }
    if (search.filters.tags?.length > 0) {
      const tags = search.filters.tags.filter((t: string) => t && t.trim());
      if (tags.length > 0) params.set('tags', tags.join(','));
    }
    if (search.filters.statuses?.length > 0) {
      const statuses = search.filters.statuses.filter((s: string) => s && s.trim());
      if (statuses.length > 0) params.set('status', statuses.join(','));
    }
    if (search.sort && search.sort !== 'relevance') params.set('sort', search.sort);
    
    const queryString = params.toString();
    return queryString ? `/vault?${queryString}` : '/vault';
  };

  // Helper function to generate history URLs
  const generateHistoryUrl = (historyItem: any) => {
    const params = new URLSearchParams();
    
    if (historyItem.query && historyItem.query.trim()) params.set('query', historyItem.query.trim());
    if (historyItem.filters.strategies?.length > 0) {
      const strategies = historyItem.filters.strategies.filter((s: string) => s && s.trim());
      if (strategies.length > 0) params.set('strategy', strategies.join(','));
    }
    if (historyItem.filters.types?.length > 0) {
      const types = historyItem.filters.types.filter((t: string) => t && t.trim());
      if (types.length > 0) params.set('type', types.join(','));
    }
    if (historyItem.filters.tags?.length > 0) {
      const tags = historyItem.filters.tags.filter((t: string) => t && t.trim());
      if (tags.length > 0) params.set('tags', tags.join(','));
    }
    if (historyItem.filters.statuses?.length > 0) {
      const statuses = historyItem.filters.statuses.filter((s: string) => s && s.trim());
      if (statuses.length > 0) params.set('status', statuses.join(','));
    }
    if (historyItem.sort && historyItem.sort !== 'relevance') params.set('sort', historyItem.sort);
    
    const queryString = params.toString();
    return queryString ? `/vault?${queryString}` : '/vault';
  };

  const isActiveRoute = (path: string) => {
    if (path === "/vault") {
      return location.pathname === "/vault" || location.pathname.startsWith("/vault/");
    }
    return location.pathname === path;
  };

  const fallbackLabel = (h: any) => h.query?.trim() || 'All items';

  // Chat action handlers
  const handleOpenConversation = (id: string) => {
    const searchItem = recentSearchesForSidebar.find(item => item.id === id);
    if (!searchItem) return;

    // Try to load the previously saved chat result for this query+mode
    const storedResult = getChatResultByQuery(searchItem.query, searchItem.mode);

    const params = new URLSearchParams();
    params.set('query', searchItem.query);
    params.set('mode', searchItem.mode);

    if (storedResult) {
      // Instant render (no loading state)
      navigate(`/?${params.toString()}`, {
        state: { storedChatResult: storedResult, skipLoading: true }
      });
    } else {
      // Fall back to just seeding the query (user can run it)
      navigate(`/?${params.toString()}`);
    }
  };

  const handleShareConversation = (id: string) => {
    // In a real app, this would open a share modal
    console.log('Share conversation:', id);
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    // For recent searches, we don't support renaming as they're based on actual search queries
    // This could be extended in the future to allow custom titles
    console.log('Rename conversation:', id, newTitle);
  };

  const handleArchiveConversation = (id: string) => {
    // For recent searches, archiving is the same as removing
    removeRecentSearch(id);
  };

  const handleDeleteConversation = (id: string) => {
    removeRecentSearch(id);
  };

  const handleNewConversation = () => {
    // Navigate to home with a reset parameter to ensure pristine state
    navigate('/?reset=true');
  };

  // History action handlers
  const handleOpenHistory = (id: string) => {
    const historyItem = searchHistory.find(h => h.id === id);
    if (historyItem) {
      // Check if we have a stored chat result for this query
      const storedResult = getChatResultByQuery(historyItem.query, 'answer');
      
      if (storedResult) {
        // Navigate with stored result data
        const url = generateHistoryUrl(historyItem);
        navigate(url, { 
          state: { 
            storedChatResult: storedResult,
            skipLoading: true 
          } 
        });
      } else {
        // No stored result, navigate normally (will show loading state)
        const url = generateHistoryUrl(historyItem);
        navigate(url);
      }
    }
  };

  const handleShareHistory = (id: string) => {
    console.log('Share history:', id);
  };

  const handleRenameHistory = (id: string, newTitle: string) => {
    // In a real app, this would update the history item's displayName
    console.log('Rename history:', id, 'to:', newTitle);
  };

  const handleArchiveHistory = (id: string) => {
    console.log('Archive history:', id);
  };

  const handleDeleteHistory = (id: string) => {
    console.log('Delete history:', id);
  };

  return (
    <div 
      className="h-full w-[300px] flex flex-col py-4"
    >

        {/* Account Wrapper */}
        <div className="p-2">
          <Popover open={isAccountOpen} onOpenChange={setIsAccountOpen}>
            <PopoverTrigger asChild>
              <div className="p-2 gap-2 rounded-lg flex items-center cursor-pointer bg-background/50 hover:bg-background/90 transition-colors">
                {/* Account Icon */}
                <div 
                  className="bg-sidebar-foreground rounded-lg inline-grid place-items-center"
                  style={{ width: "32px", height: "32px" }}
                >
                  <Building className="w-4 h-4 text-sidebar-background" />
                </div>
                
                {/* Account Info */}
                <div className="flex-1 grid gap-[-2px]">
                  <div 
                    className="font-semibold text-sidebar-foreground"
                    style={{ 
                      fontSize: "14px", 
                      lineHeight: "1.4" 
                    }}
                  >
                    [DEMO] S2 Strategy
                  </div>
                  <div 
                    className="font-medium text-sidebar-foreground/70"
                    style={{ 
                      fontSize: "12px", 
                      fontWeight: "500",
                      lineHeight: "1.5", 
                      letterSpacing: "-0.2px" 
                    }}
                  >
                    Preview
                  </div>
                </div>
                
                {/* Dropdown Icon */}
                <ChevronsUpDown className="w-4 h-4 text-[#3F3F46]" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="start">
              <div className="flex items-center gap-2 p-2 hover:bg-sidebar-primary/10 rounded cursor-pointer">
                <Users className="w-4 h-4" />
                <span className="text-sm">Account</span>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 p-2 gap-2 min-w-0 flex flex-col" style={{ alignContent: "start" }}>
          {/* Subheader */}
          <div className="px-2">
            <div className="text-sidebar-foreground font-semibold text-sm">
              <img src="/AdviserGPT-logo.svg" alt="AdviserGPT" width="69" height="10" className="max-h-2.5" loading="eager" decoding="async" fetchPriority="high" />
            </div>
          </div>

          {/* Top Navigation Links */}
          <ul className="space-y-1 flex-1">
            <li>
              <button
                onClick={handleNewConversation}
                className={`h-10 px-2 rounded-md flex items-center gap-2 w-full transition-colors text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                  ${isActiveRoute('/') ? 'bg-sidebar-primary/10' : ''}
                `}
              >
                <SquarePen className="w-4 h-4" />
                <span 
                  className="text-md font-medium" 
                  style={{
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  New chat
                </span>
              </button>
            </li>
            
            <li>
              <Link
                to="/vault"
                className={`h-10 px-2 rounded-md flex items-center gap-2 transition-colors text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                  ${isActiveRoute('/vault') ? 'bg-sidebar-primary/10' : ''}
                `}
              >
                <ShieldCheck className="w-4 h-4" />
                <span 
                  className="text-md font-medium" 
                  style={{
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  Vault
                </span>
              </Link>
            </li>

            <li>
              <Link
                to="#"
                className={`h-10 px-2 rounded-md flex items-center gap-2 transition-colors text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                  ${isActiveRoute('/upload') ? 'bg-sidebar-primary/10' : ''}
                `}
              >
                <CloudUpload className="w-4 h-4" />
                <span 
                  className="text-md font-medium"
                  style={{
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  File Upload
                </span>
              </Link>
            </li>
            
            <li>
              <Link
                to="#"
                className={`h-10 px-2 rounded-md flex items-center gap-2 transition-colors text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                  ${isActiveRoute('/resources') ? 'bg-sidebar-primary/10' : ''}
                `}
              >
                <FileText className="w-4 h-4" />
                <span 
                  className="text-md font-medium"
                  style={{
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  Resources
                </span>
              </Link>
            </li>
          </ul>

          {/* Chats Section */}
          {recentConversations.length > 0 && (
            <div className="mt-4">
              <div 
                className="h-10 px-2 rounded-md flex items-center gap-2 w-full transition-colors text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent cursor-pointer"
                onClick={() => setIsChatsExpanded(!isChatsExpanded)}
                onMouseEnter={() => setIsChatsIconHovered(true)}
                onMouseLeave={() => setIsChatsIconHovered(false)}
              >
                <div className="flex items-center justify-center w-4 h-4 relative">
                  <ChevronDown 
                    className={`w-4 h-4 absolute transition-all duration-300 ${
                      !isChatsExpanded 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-75'
                    }`} 
                  />
                  <ChevronUp 
                    className={`w-4 h-4 absolute transition-all duration-300 ${
                      isChatsExpanded 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-75'
                    }`} 
                  />
                </div>
                <span 
                  className="text-md font-medium" 
                  style={{
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  Chats
                </span>
              </div>
              
              {/* Recent Conversations */}
              {isChatsExpanded && (
                <div className="mt-1 min-w-0">
                  <ChatSidebar
                    items={recentConversations.map(conv => ({
                      id: conv.id,
                      title: conv.title,
                      preview: conv.lastMessage,
                      updatedAt: conv.timestamp.toISOString(),
                      unread: conv.unread,
                      pinned: conv.pinned,
                      archived: conv.archived
                    }))}
                    activeId={getActiveChatId()}
                    onOpenChat={handleOpenConversation}
                    onShare={handleShareConversation}
                    onRename={handleRenameConversation}
                    onArchive={handleArchiveConversation}
                    onDelete={handleDeleteConversation}
                    title="Recent Chats"
                    className=""
                  />
                  
                  {/* See More Link */}
                  {recentSearchesForSidebar.length > 7 && (
                    <div className="px-2 py-1">
                      <button
                        onClick={() => navigate('/history')}
                        className="text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                      >
                        See more ({recentSearchesForSidebar.length - 7} more)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* List Wrapper */}
        <div className="p-2">
          <div className="border-t border-sidebar-foreground/10 pt-6 space-y-1">
            <div className="h-8 px-2 rounded-md bg-sidebar-foreground/70 flex items-center gap-2">
              <Rocket className="w-4 h-4 text-sidebar-background" />
              <span 
                className="text-sidebar-background"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  lineHeight: "1.5",
                  letterSpacing: "-0.3px"
                }}
              >
                Subscribe
              </span>
            </div>
            
            
            
            <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
              <PopoverTrigger asChild>
                <div className="h-8 px-2 rounded-md flex items-center gap-2 text-sidebar-foreground hover:bg-sidebar-primary/5 transition-colors cursor-pointer">
                  <UserRound className="w-4 h-4" />
                  <span 
                    className="flex-1 "
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      lineHeight: "1.5",
                      letterSpacing: "-0.3px"
                    }}
                  >
                    Alex Wright
                  </span>
                  <ChevronUp className="w-4 h-4" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end" side="top">
                <div className="flex items-center gap-2 p-2 hover:bg-sidebar-primary/10 rounded cursor-pointer">
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Sign Out</span>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
    </div>
  );
}