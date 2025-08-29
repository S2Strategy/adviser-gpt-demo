import { Building, ChevronsUpDown, Users, Home, Megaphone, ShieldCheck, Rocket, FileText, GraduationCap, UserRound, ChevronUp, Bookmark, History, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SavedSearches } from "./SavedSearches";
import { useState } from "react";

interface AppSidebarProps {
  savedSearchProps?: {
    onLoadSearch: (searchData: { query: string; filters: { strategy?: string; contentType?: string; tags?: string[]; }; }) => void;
    currentQuery: string;
    currentFilters: {
      strategy?: string;
      contentType?: string;
      tags?: string[];
    };
  };
}

export function AppSidebar({ savedSearchProps }: AppSidebarProps = {}) {
  const [searchManagementOpen, setSearchManagementOpen] = useState(true);
  
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Building className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Acme Corp</span>
                <span className="truncate text-xs">Enterprise Plan</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Users className="w-4 h-4" />
              Account
            </Button>
          </PopoverContent>
        </Popover>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>AdviserGPT</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#" className="interactive">
                    <Home />
                    <span>Home</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href="#" className="interactive">
                    <Megaphone />
                    <span>Commentary</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive>
                  <a href="#" className="interactive">
                    <ShieldCheck />
                    <span>Vault</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Search Management Section */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <button
              onClick={() => setSearchManagementOpen(!searchManagementOpen)}
              className="flex items-center gap-2 w-full text-left interactive"
            >
              <Bookmark className="h-4 w-4" />
              Search Management
              <ChevronUp className={`ml-auto h-4 w-4 transition-transform ${searchManagementOpen ? 'rotate-180' : ''}`} />
            </button>
          </SidebarGroupLabel>
          {searchManagementOpen && (
            <SidebarGroupContent>
              <div className="space-y-4 px-2">
                {/* Saved Searches */}
                {savedSearchProps && (
                  <SavedSearches
                    onLoadSearch={savedSearchProps.onLoadSearch}
                    currentQuery={savedSearchProps.currentQuery}
                    currentFilters={savedSearchProps.currentFilters}
                  />
                )}
                
                {/* Quick Actions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground px-2">Quick Actions</h4>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm" className="interactive">
                        <Star className="h-4 w-4" />
                        <span>Bookmarked Items</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="sm" className="interactive">
                        <History className="h-4 w-4" />
                        <span>Recent Activity</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </div>
              </div>
            </SidebarGroupContent>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href="#">
                <Rocket />
                <span>Subscribe</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href="#">
                <FileText />
                <span>Docs</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="sm">
              <a href="#">
                <GraduationCap />
                <span>Onboarding Hub</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton size="sm">
                  <UserRound />
                  <span>Brian Stone</span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="end">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  Sign Out
                </Button>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}