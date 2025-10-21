import React, { useState } from 'react';
import { 
  X, 
  Search, 
  FileText, 
  Plus, 
  Minus,
  ExternalLink,
  Filter,
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HIGHLIGHT_COLORS } from '@/lib/colors';

interface Source {
  id: string;
  name: string;
  type: string;
  similarity: number;
  snippet: string;
  strategy?: string;
  isUsed: boolean;
  lastModified: Date;
}

interface SourceManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  usedSources: Source[];
  availableSources: Source[];
  onSourceAdd: (sourceId: string) => void;
  onSourceRemove: (sourceId: string) => void;
  onRebuild: () => void;
}

export function SourceManagementPanel({
  isOpen,
  onClose,
  query,
  usedSources,
  availableSources,
  onSourceAdd,
  onSourceRemove,
  onRebuild
}: SourceManagementPanelProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [similarityFilter, setSimilarityFilter] = useState<string>('all');

  if (!isOpen) return null;

  const filteredAvailableSources = availableSources.filter(source => {
    const matchesSearch = source.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         source.snippet.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesType = typeFilter === 'all' || source.type === typeFilter;
    const matchesSimilarity = similarityFilter === 'all' || 
      (similarityFilter === 'high' && source.similarity >= 90) ||
      (similarityFilter === 'medium' && source.similarity >= 70 && source.similarity < 90) ||
      (similarityFilter === 'low' && source.similarity < 70);
    
    return matchesSearch && matchesType && matchesSimilarity;
  });

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 90) return 'bg-green-50 text-green-700 border-green-200';
    if (similarity >= 70) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getSimilarityIcon = (similarity: number) => {
    if (similarity >= 90) return <Check className="h-3 w-3" />;
    if (similarity >= 70) return <AlertCircle className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 transition duration-200" onClick={onClose}>
      <div 
        className={`fixed right-4 top-4 h-[calc(100%-32px)] flex flex-col w-120 bg-background rounded-2xl shadow-xl transition-all duration-300 transform
          ${
            isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Vault Sources</h2>
            {query ? (
              <p className="text-sm text-foreground/70">for: "{query}"</p>
            ) : (
              <p className="text-sm text-foreground/70">Browse and manage your vault sources</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-foreground/70" />
            <Input
              placeholder="Search sources..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="flex-1 placeholder:text-foreground/70 border-foreground/20"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="policy">Policies</SelectItem>
                <SelectItem value="memo">Memos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={similarityFilter} onValueChange={setSimilarityFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Similarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Similarity</SelectItem>
                <SelectItem value="high">High (90%+)</SelectItem>
                <SelectItem value="medium">Medium (70-89%)</SelectItem>
                <SelectItem value="low">Low (&lt;70%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Used Sources */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">
                  {query ? `Sources in Answer (${usedSources.length})` : 'Recent Sources (0)'}
                </h3>
              </div>
              
              {usedSources.length === 0 ? (
                <div className="text-center py-8 text-foreground/80">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {query ? 'No sources selected' : 'Ask a question to see relevant sources'}
                  </p>
                  {!query && (
                    <p className="text-xs mt-1 text-foreground/60">
                      Sources will appear here when you ask a question
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {usedSources.map((source) => (
                    <div key={source.id} className={`border rounded-lg p-3 ${HIGHLIGHT_COLORS.vault.background} ${HIGHLIGHT_COLORS.vault.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className={`h-4 w-4 ${HIGHLIGHT_COLORS.vault.text}`} />
                          <span className={`font-medium text-sm ${HIGHLIGHT_COLORS.vault.text}`}>{source.name}</span>
                          {query && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSimilarityColor(source.similarity)}`}
                            >
                              {getSimilarityIcon(source.similarity)}
                              <span className="ml-1">{source.similarity}%</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs ${HIGHLIGHT_COLORS.vault.text} leading-relaxed`}>
                        {source.snippet}
                      </p>
                      {source.strategy && (
                        <Badge variant="secondary" className="text-xs mt-2">
                          {source.strategy}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Sources */}
            <div>
              <h3 className="font-medium text-sm pt-4 mb-3">
                {query ? `Additional Sources (${filteredAvailableSources.length})` : `All Vault Sources (${filteredAvailableSources.length})`}
              </h3>
              
              {filteredAvailableSources.length === 0 ? (
                <div className="text-center py-8 text-foreground/70">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {query ? 'No sources found' : 'No sources available'}
                  </p>
                  {!query && (
                    <p className="text-xs mt-1 text-foreground/70">
                      Browse and search through your vault sources
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAvailableSources.map((source) => (
                    <div key={source.id} className="border border-sidebar-foreground/10 rounded-lg p-3 bg-sidebar-background/60">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-foreground/70" />
                          <span className="font-medium text-sm text-foreground">{source.name}</span>
                          {query && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getSimilarityColor(source.similarity)}`}
                            >
                              {getSimilarityIcon(source.similarity)}
                              <span className="ml-1">{source.similarity}%</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-foreground/70 hover:text-gray-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View document</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <p className="text-xs text-foreground/70 leading-relaxed">
                        {source.snippet}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        {source.strategy && (
                          <Badge variant="outline" className="text-xs bg-background border-foreground/20">
                            {source.strategy}
                          </Badge>
                        )}
                        <span className="text-xs text-foreground/70">
                          {source.lastModified.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-foreground/10">
          <div className="flex items-center justify-between">
            <div className="text-xs text-foreground/70">
              {query ? (
                `${usedSources.length} of ${usedSources.length + availableSources.length} sources used`
              ) : (
                `${availableSources.length} total sources in vault`
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
