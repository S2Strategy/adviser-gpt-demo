import { Building, ChevronsUpDown, Users, Home, Megaphone, ShieldCheck, Rocket, FileText, GraduationCap, UserRound, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function AppSidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-background border-r border-sidebar-border grid grid-rows-[auto_1fr_auto]">
      {/* Account Wrapper */}
      <div className="p-2">
        <Popover>
          <PopoverTrigger asChild>
            <div className="p-2 flex items-center gap-2 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors">
              <div className="w-8 h-8 bg-sidebar-account-bg rounded-lg grid place-items-center">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 grid gap-0">
                <div className="text-sm font-semibold leading-tight text-sidebar-account-text">
                  Acme Corp
                </div>
                <div className="text-xs font-medium leading-relaxed tracking-tight text-sidebar-subheader-text">
                  Enterprise Plan
                </div>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-sidebar-icon-default" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1" align="start">
            <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
              <Users className="w-4 h-4" />
              Account
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 p-2 grid gap-3">
        <div className="px-2 text-xs font-medium leading-tight tracking-tight text-sidebar-subheader-text">
          AdviserGPT
        </div>
        
        <nav>
          <ul className="grid gap-1">
            <li>
              <a href="#" className="h-8 px-2 flex items-center gap-2 rounded hover:bg-sidebar-accent transition-colors">
                <Home className="w-4 h-4 text-sidebar-icon-default" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default">Home</span>
              </a>
            </li>
            <li>
              <a href="#" className="h-8 px-2 flex items-center gap-2 rounded hover:bg-sidebar-accent transition-colors">
                <Megaphone className="w-4 h-4 text-sidebar-icon-default" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default">Commentary</span>
              </a>
            </li>
            <li>
              <a href="#" className="h-8 px-2 flex items-center gap-2 rounded bg-sidebar-item-active-bg">
                <ShieldCheck className="w-4 h-4 text-white" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-white">Vault</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      {/* Bottom Links */}
      <div className="p-2">
        <div className="border-t border-sidebar-border pt-3">
          <ul className="grid gap-1">
            <li>
              <a href="#" className="h-8 px-2 rounded-md grid grid-cols-[auto_1fr] gap-2 items-center bg-sidebar-item-bg hover:bg-sidebar-accent transition-colors">
                <Rocket className="w-4 h-4 text-sidebar-icon-default" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default">Subscribe</span>
              </a>
            </li>
            <li>
              <a href="#" className="h-8 px-2 rounded-md grid grid-cols-[auto_1fr] gap-2 items-center bg-sidebar-item-bg hover:bg-sidebar-accent transition-colors">
                <FileText className="w-4 h-4 text-sidebar-icon-default" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default">Docs</span>
              </a>
            </li>
            <li>
              <a href="#" className="h-8 px-2 rounded-md grid grid-cols-[auto_1fr] gap-2 items-center bg-sidebar-item-bg hover:bg-sidebar-accent transition-colors">
                <GraduationCap className="w-4 h-4 text-sidebar-icon-default" />
                <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default">Onboarding Hub</span>
              </a>
            </li>
            <li>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full h-8 px-2 rounded-md grid grid-cols-[auto_1fr_auto] gap-2 items-center bg-sidebar-item-bg hover:bg-sidebar-accent transition-colors">
                    <UserRound className="w-4 h-4 text-sidebar-icon-default" />
                    <span className="text-sm font-medium leading-relaxed tracking-tight text-sidebar-icon-default text-left">Brian Stone</span>
                    <ChevronUp className="w-4 h-4 text-sidebar-icon-default" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    Sign Out
                  </Button>
                </PopoverContent>
              </Popover>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}