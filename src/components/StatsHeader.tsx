import { FileText, Filter, Search, TrendingUp } from "lucide-react";

interface StatsHeaderProps {
  totalDocuments: number;
  filteredDocuments: number;
  hasActiveFilters: boolean;
}

export function StatsHeader({ totalDocuments, filteredDocuments, hasActiveFilters }: StatsHeaderProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 opacity-40"
        style={{ background: 'var(--gradient-hero)' }}
      />
      
      {/* Content */}
      <div className="relative px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-primary mb-2">
              Document Vault
            </h2>
            <p className="text-muted-foreground">
              Intelligent document management and search
            </p>
          </div>
          
          <div className="flex gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{totalDocuments}</div>
              <div className="text-xs text-muted-foreground">Total Docs</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{filteredDocuments}</div>
              <div className="text-xs text-muted-foreground">Filtered</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{hasActiveFilters ? 'ON' : 'OFF'}</div>
              <div className="text-xs text-muted-foreground">Filters</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">98%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}