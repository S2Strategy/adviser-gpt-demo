import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VaultSidebar } from '@/components/VaultSidebar';

export function Insights() {
  return (
    <div className="h-screen bg-sidebar-background flex gap-4">
      {/* Vault Sidebar */}
      <VaultSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className="flex-1 overflow-y-auto">
          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">
                Insights
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Insights</h1>
                <p className="text-foreground/70">Data insights and analytics</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto h-full">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <h2 className="text-3xl font-semibold text-foreground/70 mb-4">
                    Insights coming soon
                  </h2>
                  <p className="text-foreground/50">
                    This section will contain data insights and analytics features.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
