import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTagTypes } from "@/hooks/useTagTypes";
import { ImportSession, TagMapping, TagColumnAnalysis } from "@/types/import";
import { saveImportSession } from "@/utils/importStorage";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, CheckSquare, Square } from "lucide-react";

interface TagMappingDetailTableProps {
  session: ImportSession;
  onSaveAndImport: () => void;
  onCancel: () => void;
}

export function TagMappingDetailTable({
  session,
  onSaveAndImport,
  onCancel,
}: TagMappingDetailTableProps) {
  const { toast } = useToast();
  const { tagTypes, addTagTypeValue } = useTagTypes();
  const [showFilter, setShowFilter] = useState<'all' | 'unmatched'>('unmatched');
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [bulkMapValue, setBulkMapValue] = useState<string>("");
  const [bulkCreateValue, setBulkCreateValue] = useState<string>("");
  const [bulkIsNew, setBulkIsNew] = useState(false);
  const [mappings, setMappings] = useState<Record<string, Record<string, TagMapping>>>({}); // columnName -> sourceValue -> mapping

  // Get analyzed columns (memoized to prevent infinite loops)
  const analyzedColumns = useMemo(() => 
    session.columnGuesses.tagColumns.filter(col => session.tagAnalysis[col]),
    [session.columnGuesses.tagColumns, session.tagAnalysis]
  );

  // Auto-select first analyzed column (use useEffect to avoid conditional hook)
  useEffect(() => {
    if (analyzedColumns.length > 0 && !selectedColumn) {
      setSelectedColumn(analyzedColumns[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyzedColumns.length, selectedColumn]); // Only depend on length to prevent infinite loops

  // Get current analysis
  const analysis = selectedColumn ? session.tagAnalysis[selectedColumn] : null;

  // Initialize mappings from all analyses (only once, or when session changes)
  useEffect(() => {
    // Check if mappings are already initialized for all analyzed columns
    const needsInit = analyzedColumns.some(col => !mappings[col] || Object.keys(mappings[col] || {}).length === 0);
    if (!needsInit) return;

    const initialMappings: Record<string, Record<string, TagMapping>> = {};
    analyzedColumns.forEach(columnName => {
      const colAnalysis = session.tagAnalysis[columnName];
      if (colAnalysis) {
        initialMappings[columnName] = {};
        colAnalysis.mappings.forEach(m => {
          initialMappings[columnName][m.sourceValue] = { ...m };
        });
      }
    });
    setMappings(prev => {
      // Only update if there are actual changes
      const hasChanges = analyzedColumns.some(col => {
        const newMappings = initialMappings[col] || {};
        const oldMappings = prev[col] || {};
        return Object.keys(newMappings).length !== Object.keys(oldMappings).length;
      });
      return hasChanges ? { ...prev, ...initialMappings } : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id, analyzedColumns.length]); // Only depend on session ID and column count to prevent infinite loops

  const tagType = useMemo(() => 
    analysis ? tagTypes.find(tt => tt.id === analysis.tagTypeId || tt.name === analysis.tagTypeName) : null,
    [analysis, tagTypes]
  );
  const existingValues = tagType?.values || [];
  
  // Memoize columnMappings to avoid dependency issues
  const columnMappings = useMemo(() => mappings[selectedColumn] || {}, [mappings, selectedColumn]);

  // Filter mappings for current column
  const filteredMappings = useMemo(() => {
    return Object.values(columnMappings).filter(m => {
      if (showFilter === 'unmatched') {
        return m.status === 'new';
      }
      return true;
    });
  }, [columnMappings, showFilter]);

  // Update mapping for current column
  const updateMapping = (sourceValue: string, newMapping: Partial<TagMapping>) => {
    setMappings(prev => ({
      ...prev,
      [selectedColumn]: {
        ...prev[selectedColumn],
        [sourceValue]: {
          ...prev[selectedColumn]?.[sourceValue],
          ...newMapping,
        },
      },
    }));
  };

  // Toggle row selection (include column in key)
  const getRowKey = (sourceValue: string) => `${selectedColumn}:${sourceValue}`;
  
  const toggleRowSelection = (sourceValue: string) => {
    const key = getRowKey(sourceValue);
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const allKeys = filteredMappings.map(m => getRowKey(m.sourceValue));
    const allSelected = allKeys.length > 0 && allKeys.every(key => selectedRows.has(key));
    
    if (allSelected) {
      // Deselect all for this column
      setSelectedRows(prev => {
        const next = new Set(prev);
        allKeys.forEach(key => next.delete(key));
        return next;
      });
    } else {
      // Select all for this column
      setSelectedRows(prev => {
        const next = new Set(prev);
        allKeys.forEach(key => next.add(key));
        return next;
      });
    }
  };

  // Bulk map to existing
  const handleBulkMap = () => {
    if (!bulkMapValue) return;
    selectedRows.forEach(key => {
      const [, sourceValue] = key.split(':', 2);
      if (sourceValue) {
        updateMapping(sourceValue, {
          status: 'matched',
          mappedTagName: bulkMapValue,
          existingTagName: bulkMapValue,
        });
      }
    });
    // Clear only selections for current column
    setSelectedRows(prev => {
      const next = new Set(prev);
      filteredMappings.forEach(m => {
        next.delete(getRowKey(m.sourceValue));
      });
      return next;
    });
    setBulkMapValue("");
  };

  // Bulk create new
  const handleBulkCreate = () => {
    if (!bulkCreateValue.trim()) return;
    const success = addTagTypeValue(analysis.tagTypeName, bulkCreateValue.trim());
    if (success) {
      selectedRows.forEach(key => {
        const [, sourceValue] = key.split(':', 2);
        if (sourceValue) {
          updateMapping(sourceValue, {
            status: 'matched',
            mappedTagName: bulkCreateValue.trim(),
            existingTagName: bulkCreateValue.trim(),
          });
        }
      });
      // Clear only selections for current column
      setSelectedRows(prev => {
        const next = new Set(prev);
        filteredMappings.forEach(m => {
          next.delete(getRowKey(m.sourceValue));
        });
        return next;
      });
      setBulkCreateValue("");
      setBulkIsNew(false);
    }
  };

  // Calculate summary stats for current column
  const summaryStats = useMemo(() => {
    if (!columnMappings) return { matched: 0, willCreate: 0, total: 0 };
    const allMappings = Object.values(columnMappings);
    const matched = allMappings.filter(m => m.status === 'matched').length;
    const willCreate = allMappings.filter(m => m.status === 'new').length;
    return { matched, willCreate, total: allMappings.length };
  }, [columnMappings]);
  
  // Calculate total stats across all columns
  const totalStats = useMemo(() => {
    let totalMatched = 0;
    let totalWillCreate = 0;
    analyzedColumns.forEach(col => {
      const colMappings = mappings[col] || {};
      Object.values(colMappings).forEach((m: TagMapping) => {
        if (m.status === 'matched') totalMatched++;
        else if (m.status === 'new') totalWillCreate++;
      });
    });
    return { totalMatched, totalWillCreate };
  }, [mappings, analyzedColumns]);

  // Early returns after all hooks
  if (analyzedColumns.length === 0) {
    return (
      <div className="p-4 bg-sidebar-background rounded-lg">
        <p className="text-sm text-foreground/70">No tag analysis available. Please go back and analyze tag columns first.</p>
      </div>
    );
  }

  if (!analysis || !selectedColumn) {
    return null;
  }

  const handleSaveAndImport = () => {
    // Update session with modified mappings for all columns
    const updatedTagAnalysis: Record<string, TagColumnAnalysis> = {};
    
    analyzedColumns.forEach(columnName => {
      const colAnalysis = session.tagAnalysis[columnName];
      const colMappings = mappings[columnName] || {};
      
      updatedTagAnalysis[columnName] = {
        ...colAnalysis,
        mappings: Object.values(colMappings),
        // Recalculate stats
        stats: {
          uniqueCount: Object.keys(colMappings).length,
          matchedCount: Object.values(colMappings).filter(m => m.status === 'matched').length,
          unmatchedCount: Object.values(colMappings).filter(m => m.status === 'new').length,
        },
      };
    });

    const updatedSession: ImportSession = {
      ...session,
      tagAnalysis: updatedTagAnalysis,
    };

    try {
      saveImportSession(updatedSession);
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
    onSaveAndImport();
  };

  // Get selected rows for current column
  const currentColumnSelectedRows = filteredMappings.filter(m => 
    selectedRows.has(getRowKey(m.sourceValue))
  );

  return (
    <div className="space-y-4">
      {/* Column Selector */}
      {analyzedColumns.length > 1 && (
        <div className="space-y-2">
          <Label>Select Tag Column to Review</Label>
          <Select value={selectedColumn} onValueChange={setSelectedColumn}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {analyzedColumns.map(col => {
                const colAnalysis = session.tagAnalysis[col];
                const unmatchedCount = colAnalysis?.stats.unmatchedCount || 0;
                return (
                  <SelectItem key={col} value={col}>
                    {col} {unmatchedCount > 0 && `(${unmatchedCount} unmatched)`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary Bar */}
      <div className="p-3 bg-sidebar-background rounded-lg border border-foreground/10">
        <div className="flex items-center gap-4 text-sm">
          <span>{summaryStats.matched} matched existing</span>
          <span>•</span>
          <span>{summaryStats.willCreate} will be created as new labels</span>
          {analyzedColumns.length > 1 && (
            <>
              <span>•</span>
              <span className="text-foreground/60">
                Total: {totalStats.totalMatched} matched, {totalStats.totalWillCreate} new across all columns
              </span>
            </>
          )}
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={showFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilter('all')}
          >
            All
          </Button>
          <Button
            variant={showFilter === 'unmatched' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowFilter('unmatched')}
          >
            Unmatched only
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectAll}
        >
          {filteredMappings.length > 0 && filteredMappings.every(m => selectedRows.has(getRowKey(m.sourceValue))) ? (
            <>
              <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
              Deselect All
            </>
          ) : (
            <>
              <Square className="h-3.5 w-3.5 mr-1.5" />
              Select All
            </>
          )}
        </Button>
      </div>

      {/* Bulk Actions */}
      {currentColumnSelectedRows.length > 0 && (
        <div className="p-3 bg-sidebar-background rounded-lg border border-foreground/10">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {currentColumnSelectedRows.length} selected
            </Badge>
            {!bulkIsNew ? (
              <>
                <Select value={bulkMapValue} onValueChange={setBulkMapValue}>
                  <SelectTrigger className="h-8 w-[200px]">
                    <SelectValue placeholder="Map to existing value" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingValues.map((val) => (
                      <SelectItem key={val} value={val}>
                        {val}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleBulkMap} disabled={!bulkMapValue} size="sm" className="h-8">
                  Map Selected
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkIsNew(true);
                    setBulkCreateValue("");
                  }}
                  size="sm"
                  className="h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create New
                </Button>
              </>
            ) : (
              <>
                <Input
                  value={bulkCreateValue}
                  onChange={(e) => setBulkCreateValue(e.target.value)}
                  placeholder="New label value"
                  className="h-8 w-[200px]"
                />
                <Button
                  onClick={handleBulkCreate}
                  disabled={!bulkCreateValue.trim()}
                  size="sm"
                  className="h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Create
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setBulkIsNew(false);
                    setBulkCreateValue("");
                  }}
                  size="sm"
                  className="h-8"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-foreground/20 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === filteredMappings.length && filteredMappings.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Source Value</TableHead>
              <TableHead>Mapped to Label</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMappings.map((mapping) => {
              const isSelected = selectedRows.has(getRowKey(mapping.sourceValue));
              const isMatched = mapping.status === 'matched';
              
              return (
                <TableRow key={mapping.sourceValue}>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRowSelection(mapping.sourceValue)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{mapping.sourceValue}</TableCell>
                  <TableCell>
                    {isMatched ? (
                      <Badge variant="secondary">{mapping.mappedTagName}</Badge>
                    ) : (
                      <Select
                        value={mapping.mappedTagName || ""}
                        onValueChange={(value) => {
                          if (value === "__create_new__") {
                            // Handle create new inline
                            const newValue = prompt("Enter new label value:", mapping.sourceValue);
                            if (newValue && newValue.trim()) {
                              const success = addTagTypeValue(analysis.tagTypeName, newValue.trim());
                              if (success) {
                                updateMapping(mapping.sourceValue, {
                                  status: 'matched',
                                  mappedTagName: newValue.trim(),
                                  existingTagName: newValue.trim(),
                                });
                              }
                            }
                          } else {
                            updateMapping(mapping.sourceValue, {
                              status: 'matched',
                              mappedTagName: value,
                              existingTagName: value,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select or create" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingValues.map((val) => (
                            <SelectItem key={val} value={val}>
                              {val}
                            </SelectItem>
                          ))}
                          <SelectItem value="__create_new__">
                            <div className="flex items-center gap-2">
                              <Plus className="h-3.5 w-3.5" />
                              Create new
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={isMatched ? "secondary" : "outline"}>
                      {isMatched ? "Matched" : "Will create new"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {!isMatched && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newValue = prompt("Enter new label value:", mapping.sourceValue);
                          if (newValue && newValue.trim()) {
                            const success = addTagTypeValue(analysis.tagTypeName, newValue.trim());
                            if (success) {
                              updateMapping(mapping.sourceValue, {
                                status: 'matched',
                                mappedTagName: newValue.trim(),
                                existingTagName: newValue.trim(),
                              });
                            }
                          }
                        }}
                      >
                        Map to existing
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel review
        </Button>
        <Button
          onClick={handleSaveAndImport}
          className="bg-sidebar-primary hover:bg-sidebar-primary/80"
        >
          Save & Import to Vault
        </Button>
      </div>
    </div>
  );
}

