import { useState, useEffect } from "react";
import Logo from '@/assets/AdviserGPT-logo.svg?react';
import { 
  Megaphone, 
  ChevronsUpDown, 
  CloudUpload,
  ShieldCheck, 
  PanelLeft,
  Rocket, 
  FileText,  
  ChevronUp,
  ChevronDown,
  MessageCirclePlus,
  UserRound,
  UserRoundSearch,
  Settings,
  Sparkles,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSavedSearches } from "@/contexts/SavedSearchesContext";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useChatResults } from "@/hooks/useChatResults";
import { useUserProfile } from "@/hooks/useUserProfile";
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
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isConversationsOpen, setIsConversationsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('vault-sidebar-collapsed');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isChatsExpanded, setIsChatsExpanded] = useState(() => {
    const saved = localStorage.getItem('vault-sidebar-chats-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isChatsIconHovered, setIsChatsIconHovered] = useState(false);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('vault-sidebar-chats-expanded', JSON.stringify(isChatsExpanded));
  }, [isChatsExpanded]);

  useEffect(() => {
    localStorage.setItem('vault-sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  const { savedSearches } = useSavedSearches();
  const { recentSearches: searchHistory } = useSearchHistory();
  const { recentSearchesForSidebar, removeRecentSearch } = useRecentSearches();
  const { getChatResultByQuery } = useChatResults();
  const { profile } = useUserProfile();

  const handleLogout = () => {
      // Clear localStorage auth items
      localStorage.removeItem('advisergpt-auth-token');
      localStorage.removeItem('advisergpt-user-email');
      
      // Close account menu
      setIsAccountOpen(false);
      
      // Navigate to login page
      navigate('/auth');
  };

  const handleProfileClick = () => {
      navigate('/profile');
      setIsAccountOpen(false);
  };

  const handleFirmSettingsClick = () => {
      // Add firm settings navigation here
      navigate('/firm-settings');
      setIsAccountOpen(false);
  };
  
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
    const modeParam = searchParams.get('mode') as 'answer' | 'chat' | 'riaOutreach' | null;
    
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
        state: { 
          storedChatResult: storedResult, 
          skipLoading: true,
          filters: searchItem.filters,
          uploadedFiles: searchItem.uploadedFiles
        }
      });
    } else {
      // Fall back to just seeding the query (user can run it)
      navigate(`/?${params.toString()}`, {
        state: {
          filters: searchItem.filters,
          uploadedFiles: searchItem.uploadedFiles
        }
      });
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
      className={`h-full flex flex-col py-4 transition-all duration-300 ${
        isCollapsed ? 'w-[60px]' : 'w-[300px]'
      }`}
    >

        {/* Logo/Toggle */}
        <div className={`py-2 flex items-center ${isCollapsed ? 'justify-center' : 'pl-4 justify-between'}`}>
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                  <PanelLeft className="h-4 w-4" />
                  <span className="sr-only">Open Sidebar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Open Sidebar</TooltipContent>
            </Tooltip>
          ) : (
            <>
              <div className="text-sidebar-foreground font-semibold text-sm">
                <Logo aria-label="AdviserGPT" className="h-3.5 w-auto" />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                    <PanelLeft className="h-4 w-4" />
                    <span className="sr-only">Close Sidebar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Close Sidebar</TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
        

        {/* Navigation Section */}
        <div className="flex-1 p-2 gap-2 min-w-0 flex flex-col" style={{ alignContent: "start" }}>

          {/* Top Navigation Links */}
          <ul className="space-y-1 flex-1">
            <li>
              <div className="space-y-1">
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleNewConversation}
                        className={`h-10 px-2 rounded-md flex items-center justify-center w-full transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                          ${isActiveRoute('/') ? 'bg-sidebar-primary/10' : ''}
                        `}
                      >
                        <MessageCirclePlus className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Answers</TooltipContent>
                  </Tooltip>
                ) : (
                  <button
                    onClick={handleNewConversation}
                    className={`h-10 px-2 rounded-md flex items-center gap-2 w-full transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                      ${isActiveRoute('/') ? 'bg-sidebar-primary/10' : ''}
                    `}
                  >
                    <MessageCirclePlus className="w-4 h-4" />
                    <span 
                      className="text-md font-medium" 
                      style={{
                        lineHeight: "1.5",
                        letterSpacing: "-0.3px"
                      }}
                    >
                      Answers
                    </span>
                  </button>
                )}
           
                {/* Chats Section */}
                {recentConversations.length > 0 && !isCollapsed && (
                  <div className="pl-5">
                    <div 
                      className="h-10 px-2 rounded-md flex items-center gap-2 w-full transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent cursor-pointer"
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
                        className="text-sm font-medium" 
                        style={{
                          lineHeight: "1.5",
                          letterSpacing: "-0.3px"
                        }}
                      >
                        Recent
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
            </li>
            
            <li>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/vault"
                      className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                        ${isActiveRoute('/vault') ? 'bg-sidebar-primary/10' : ''}
                      `}
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Vault</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  to="/vault"
                  className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
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
              )}
            </li>

            <li>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/outreach"
                      className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                        ${isActiveRoute('/outreach') ? 'bg-sidebar-primary/10' : ''}
                      `}
                    >
                      <UserRoundSearch className="w-4 h-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Outreach</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  to="/outreach"
                  className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                    ${isActiveRoute('/outreach') ? 'bg-sidebar-primary/10' : ''}
                  `}
                >
                  <UserRoundSearch className="w-4 h-4" />
                  <span 
                    className="text-md font-medium" 
                    style={{
                      lineHeight: "1.5",
                      letterSpacing: "-0.3px"
                    }}
                  >
                    Outreach
                  </span>
                </Link>
              )}
            </li>

            <li>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/commentary"
                      className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                        ${isActiveRoute('/commentary') ? 'bg-sidebar-primary/10' : ''}
                      `}
                    >
                      <Megaphone className="w-4 h-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Commentary</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  to="/commentary"
                  className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                    ${isActiveRoute('/commentary') ? 'bg-sidebar-primary/10' : ''}
                  `}
                >
                  <Megaphone className="w-4 h-4" />
                  <span 
                    className="text-md font-medium" 
                    style={{
                      lineHeight: "1.5",
                      letterSpacing: "-0.3px"
                    }}
                  >
                    Commentary
                  </span>
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-[10px]">
                    BETA
                  </Badge>
                </Link>
              )}
            </li>

            <li>
              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      to="/insights"
                      className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                        ${isActiveRoute('/insights') ? 'bg-sidebar-primary/10' : ''}
                      `}
                    >
                      <Sparkles className="w-4 h-4" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Insights</TooltipContent>
                </Tooltip>
              ) : (
                <Link
                  to="/insights"
                  className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                    ${isActiveRoute('/insights') ? 'bg-sidebar-primary/10' : ''}
                  `}
                >
                  <Sparkles className="w-4 h-4" />
                  <span 
                    className="text-md font-medium" 
                    style={{
                      lineHeight: "1.5",
                      letterSpacing: "-0.3px"
                    }}
                  >
                    Insights
                  </span>
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4 text-[10px]">
                    BETA
                  </Badge>
                </Link>
              )}
            </li>
          </ul>
        </div>

        {/* List Wrapper */}
        <div className="p-2">
          <div className="border-t border-sidebar-foreground/10 pt-4 space-y-2">
            <ul className="space-y-1 flex-1">
             <li>
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="h-10 px-2 group rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center justify-center cursor-pointer transition active:scale-[0.98]">
                        <Rocket className="w-4 h-4 text-foreground group-hover:text-current transition-color" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">Subscribe</TooltipContent>
                  </Tooltip>
                ) : (
                  <div className="h-10 px-2 group rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex items-center gap-2 cursor-pointer transition active:scale-[0.98]">
                    <Rocket className="w-4 h-4 text-foreground group-hover:text-current transition-color" />
                    <span 
                      className="text-foreground text-md font-medium group-hover:text-current transition-color"
                      style={{
                        lineHeight: "1.5",
                        letterSpacing: "-0.3px"
                      }}
                    >
                      Subscribe
                    </span>
                  </div>
                )}
              </li>
              <li>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="#"
                          className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                            ${isActiveRoute('/upload') ? 'bg-sidebar-primary/10' : ''}
                          `}
                        >
                          <CloudUpload className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">File Upload</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      to="#"
                      className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
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
                  )}
                </li>
                
                <li>
                  {isCollapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to="#"
                          className={`h-10 px-2 rounded-md flex items-center justify-center transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
                            ${isActiveRoute('/resources') ? 'bg-sidebar-primary/10' : ''}
                          `}
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">Resources</TooltipContent>
                    </Tooltip>
                  ) : (
                    <Link
                      to="#"
                      className={`h-10 px-2 rounded-md flex items-center gap-2 transition active:scale-[0.98] text-sidebar-foreground hover:bg-sidebar-primary/5 border border-transparent
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
                  )}
                </li>
              <li>
                {/* Account Wrapper */}
                <Popover open={isAccountOpen} onOpenChange={setIsAccountOpen}>
                  <PopoverTrigger asChild>
                    {isCollapsed ? (
                      <div className="p-2 rounded-lg flex items-center justify-center cursor-pointer hover:bg-background/90 transition active:scale-[0.98]">
                        {profile.avatar ? (
                          <img
                            key={profile.avatar.substring(0, 50)} // Force re-render when avatar changes
                            src={profile.avatar}
                            alt="Profile picture"
                            className="w-8 h-8 rounded-full object-cover border-2 border-foreground/10"
                          />
                        ) : (
                          <UserRound className="w-6 h-6 text-foreground/70" />
                        )}
                      </div>
                    ) : (
                      <div className="p-2 gap-2 rounded-lg flex items-center cursor-pointer hover:bg-background/90 transition active:scale-[0.98]">
                        {profile.avatar ? (
                          <img
                            key={profile.avatar.substring(0, 50)} // Force re-render when avatar changes
                            src={profile.avatar}
                            alt="Profile picture"
                            className="w-8 h-8 rounded-full object-cover border-2 border-foreground/10"
                          />
                        ) : (
                          <UserRound className="w-6 h-6 text-foreground/70" />
                        )}
                        
                        {/* Account Info */}
                        <div className="flex-1 grid gap-[-2px]">
                          <div 
                            className="font-semibold text-sidebar-foreground"
                            style={{ 
                              fontSize: "14px", 
                              lineHeight: "1.4" 
                            }}
                          >
                            {profile.fullName}
                          </div>
                          <div 
                            className="font-medium text-xs text-sidebar-foreground/70"
                            style={{ 
                              lineHeight: "1.5", 
                              letterSpacing: "-0.2px" 
                            }}
                          >
                            {profile.companyName}
                          </div>
                        </div>
                        
                        {/* Dropdown Icon */}
                        <ChevronsUpDown className="w-4 h-4 text-foreground/70" />
                      </div>
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-1" align="end">
                  <div className="space-y-1">
                      <div 
                          className="flex items-center gap-2 p-2 hover:bg-foreground/5 rounded cursor-pointer transition active:scale-[0.98]"
                          onClick={handleProfileClick}
                      >
                          <UserRound className="w-4 h-4 text-foreground/70" />
                          <span className="text-sm">Profile</span>
                      </div>
                      <div 
                          className="flex items-center gap-2 p-2 hover:bg-foreground/5 rounded cursor-pointer transition active:scale-[0.98]"
                          onClick={handleFirmSettingsClick}
                      >
                          <Settings className="w-4 h-4 text-foreground/70" />
                          <span className="text-sm">Firm Settings</span>
                      </div>
                      <div className="border-t border-foreground/10 my-1"></div>
                      <div 
                          className="flex items-center gap-2 p-2 hover:bg-foreground/5 rounded cursor-pointer transition active:scale-[0.98] text-sidebar-accent"
                          onClick={handleLogout}
                      >
                          <LogOut className="w-4 h-4 text-sidebar-accent/70" />
                          <span className="text-sm">Logout</span>
                      </div>
                  </div>
                  </PopoverContent>
                </Popover>
              </li>
            </ul>
          </div>
        </div>
    </div>
  );
}