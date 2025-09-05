import { useState } from "react";
import { 
  Building, 
  ChevronsUpDown, 
  Home, 
  Megaphone, 
  ShieldCheck, 
  Rocket, 
  FileText, 
  GraduationCap, 
  UserRound, 
  ChevronUp,
  ChevronRight,
  ChevronDown,
  Users,
  LogOut,
  Bookmark,
  Search
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSavedSearches } from "@/contexts/SavedSearchesContext";

export function VaultSidebar() {
  const location = useLocation();
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(true);
  const { savedSearches } = useSavedSearches();
  
  const recentSearches = savedSearches.slice(0, 5);

  const isActiveRoute = (path: string) => {
    if (path === "/vault") {
      return location.pathname === "/vault" || location.pathname.startsWith("/vault/");
    }
    return location.pathname === path;
  };

  return (
    <div 
      className="fixed left-0 top-0 bottom-0 w-64 h-screen bg-[#FAFAFA] border-r border-[#E4E4E7] grid z-30"
      style={{ width: "256px", gridTemplateRows: "auto 1fr auto" }}
    >
      {/* Account Wrapper */}
      <div className="p-2">
        <Popover open={isAccountOpen} onOpenChange={setIsAccountOpen}>
          <PopoverTrigger asChild>
            <div className="p-2 gap-2 rounded-lg flex items-center cursor-pointer hover:bg-gray-100 transition-colors">
              {/* Account Icon */}
              <div 
                className="bg-[#18181B] rounded-lg inline-grid place-items-center"
                style={{ width: "32px", height: "32px" }}
              >
                <Building className="w-4 h-4 text-white" />
              </div>
              
              {/* Account Info */}
              <div className="flex-1 grid gap-[-2px]">
                <div 
                  className="font-semibold text-[#27272A]"
                  style={{ 
                    fontSize: "14px", 
                    lineHeight: "1.4" 
                  }}
                >
                  [DEMO] S2 Strategy
                </div>
                <div 
                  className="font-medium text-[#71717A]"
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
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
              <Users className="w-4 h-4" />
              <span className="text-sm">Account</span>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-2 gap-3 grid" style={{ alignContent: "start" }}>
        {/* Subheader */}
        <div 
          className="px-2 text-[#71717A]"
          style={{
            fontSize: "13px",
            fontWeight: "500",
            lineHeight: "1.4",
            letterSpacing: "-0.5px"
          }}
        >
          AdviserGPT
        </div>

        {/* Navigation Links */}
        <ul className="space-y-1">
          <li>
            <Link
              to="/"
              className={`h-8 px-2 rounded-md flex items-center gap-2 transition-colors ${
                isActiveRoute("/") 
                  ? "bg-[#4D5562] text-white" 
                  : "text-[#3F3F46] hover:bg-gray-100"
              }`}
            >
              <Home className="w-4 h-4" />
              <span 
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  lineHeight: "1.5",
                  letterSpacing: "-0.3px"
                }}
              >
                Home
              </span>
            </Link>
          </li>
          
          <li>
            <Link
              to="/commentary"
              className={`h-8 px-2 rounded-md flex items-center gap-2 transition-colors ${
                isActiveRoute("/commentary") 
                  ? "bg-[#4D5562] text-white" 
                  : "text-[#3F3F46] hover:bg-gray-100"
              }`}
            >
              <Megaphone className="w-4 h-4" />
              <span 
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  lineHeight: "1.5",
                  letterSpacing: "-0.3px"
                }}
              >
                Commentary
              </span>
            </Link>
          </li>
          
          <li>
            <Link
              to="/vault"
              className={`h-8 px-2 rounded-md flex items-center gap-2 transition-colors ${
                isActiveRoute("/vault") 
                  ? "bg-[#4D5562] text-white" 
                  : "text-[#3F3F46] hover:bg-gray-100"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span 
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  lineHeight: "1.5",
                  letterSpacing: "-0.3px"
                }}
              >
                Vault
              </span>
            </Link>
          </li>
          
          {/* Saved Searches Sub-menu */}
          {recentSearches.length > 0 && (
            <li>
              <div className="ml-2">
                <button
                  onClick={() => setIsSavedSearchesOpen(!isSavedSearchesOpen)}
                  className="h-6 px-2 rounded-md flex items-center gap-1 text-[#71717A] hover:bg-gray-100 transition-colors w-full"
                >
                  {isSavedSearchesOpen ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                  <span 
                    style={{
                      fontSize: "12px",
                      fontWeight: "500",
                      lineHeight: "1.4",
                      letterSpacing: "-0.2px"
                    }}
                  >
                    Saved Searches
                  </span>
                </button>
                
                {isSavedSearchesOpen && (
                  <ul className="ml-4 mt-1 space-y-1">
                    {recentSearches.map((search) => (
                      <li key={search.id}>
                        <Link
                          to={`/vault/search?query=${encodeURIComponent(search.query)}&strategy=${search.filters.strategies?.join(',') || ''}&type=${search.filters.types?.join(',') || ''}&tags=${search.filters.tags?.join(',') || ''}&status=${search.filters.statuses?.join(',') || ''}&sort=${search.sort || 'relevance'}`}
                          className="h-6 px-2 rounded-md flex items-center gap-2 text-[#71717A] hover:bg-gray-100 transition-colors"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span 
                            style={{
                              fontSize: "11px",
                              fontWeight: "400",
                              lineHeight: "1.4",
                              letterSpacing: "-0.1px"
                            }}
                            className="truncate"
                          >
                            {search.name}
                          </span>
                        </Link>
                      </li>
                    ))}
                    
                    {recentSearches.length >= 5 && (
                      <li>
                        <Link
                          to="/vault/saved-searches"
                          className="h-6 px-2 rounded-md flex items-center gap-2 text-[#71717A] hover:bg-gray-100 transition-colors"
                        >
                          <Search className="w-3 h-3" />
                          <span 
                            style={{
                              fontSize: "11px",
                              fontWeight: "400",
                              lineHeight: "1.4",
                              letterSpacing: "-0.1px"
                            }}
                          >
                            View all
                          </span>
                        </Link>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </li>
          )}
        </ul>
      </div>

      {/* List Wrapper */}
      <div className="p-2">
        <div className="border-t border-[#E4E4E7] pt-3 space-y-1">
          <div className="h-8 px-2 rounded-md bg-[#4D5562] flex items-center gap-2">
            <Rocket className="w-4 h-4 text-white" />
            <span 
              className="text-white"
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
          
          <div className="h-8 px-2 rounded-md bg-[#F4F4F5] flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
            <FileText className="w-4 h-4 text-[#3F3F46]" />
            <span 
              className="text-[#3F3F46]"
              style={{
                fontSize: "14px",
                fontWeight: "500",
                lineHeight: "1.5",
                letterSpacing: "-0.3px"
              }}
            >
              Docs
            </span>
          </div>
          
          <div className="h-8 px-2 rounded-md bg-[#F4F4F5] flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
            <GraduationCap className="w-4 h-4 text-[#3F3F46]" />
            <span 
              className="text-[#3F3F46]"
              style={{
                fontSize: "14px",
                fontWeight: "500",
                lineHeight: "1.5",
                letterSpacing: "-0.3px"
              }}
            >
              Onboarding Hub
            </span>
          </div>
          
          <Popover open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <PopoverTrigger asChild>
              <div className="h-8 px-2 rounded-md bg-[#F4F4F5] flex items-center gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
                <UserRound className="w-4 h-4 text-[#3F3F46]" />
                <span 
                  className="flex-1 text-[#3F3F46]"
                  style={{
                    fontSize: "14px",
                    fontWeight: "500",
                    lineHeight: "1.5",
                    letterSpacing: "-0.3px"
                  }}
                >
                  Alex Wright
                </span>
                <ChevronUp className="w-4 h-4 text-[#3F3F46]" />
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1" align="end" side="top">
              <div className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer">
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