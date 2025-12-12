import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTagTypes } from "@/hooks/useTagTypes";
import { Tag } from "@/types/vault";
import { ParsedExcelRow } from "@/utils/excelParser";
import { parseCommaSeparatedValues } from "@/utils/excelParser";
import { X, Plus, CheckSquare, Square, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TagMappingModalProps {
  open: boolean;
  onClose: () => void;
  rows: ParsedExcelRow[];
  tagColumns: string[]; // Columns that contain tags (comma-separated values)
  onSave: (mappedTags: Record<number, Tag[]>) => void; // row index -> tags
}

interface ColumnTagState {
  tagType: string | null;
  uniqueValues: string[];
  matchedTags: Map<string, { type: string; value: string }>; // value → matched tag
  customMappings: Map<string, { type: string; value: string }>; // value → custom mapped tag
  removedTags: Set<string>; // values to exclude
}

interface TagValueInfo {
  columnName: string;
  value: string;
  isMatched: boolean;
  matchedTag?: { type: string; value: string };
  customMapping?: { type: string; value: string };
  isRemoved: boolean;
}

export function TagMappingModal({
  open,
  onClose,
  rows,
  tagColumns,
  onSave,
}: TagMappingModalProps) {
  const { tagTypes, addTagTypeValue } = useTagTypes();
  
  // Column-based state: column name → ColumnTagState
  const [columnStates, setColumnStates] = useState<Record<string, ColumnTagState>>({});
  
  // Individual tag editing state
  const [editingTag, setEditingTag] = useState<{ column: string; value: string } | null>(null);
  const [editingInput, setEditingInput] = useState<string>("");
  const [editingIsNew, setEditingIsNew] = useState(false);
  
  // Bulk selection state
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set()); // "column:value" keys
  const [bulkActions, setBulkActions] = useState<Record<string, { mapValue: string; createValue: string; isNew: boolean }>>({});

  // Extract unique values per column
  const columnUniqueValues = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    
    tagColumns.forEach((columnName) => {
      const values = new Set<string>();
      rows.forEach((row) => {
        const cellValue = row[columnName];
        if (cellValue) {
          const parsedValues = parseCommaSeparatedValues(String(cellValue));
          parsedValues.forEach((value) => {
            const trimmedValue = value.trim();
            if (trimmedValue) {
              values.add(trimmedValue);
            }
          });
        }
      });
      result[columnName] = values;
    });
    
    return result;
  }, [rows, tagColumns]);

  // Initialize column states when modal opens
  useEffect(() => {
    if (open) {
      const initialStates: Record<string, ColumnTagState> = {};
      tagColumns.forEach((columnName) => {
        const uniqueValues = Array.from(columnUniqueValues[columnName] || []);
        initialStates[columnName] = {
          tagType: null,
          uniqueValues,
          matchedTags: new Map(),
          customMappings: new Map(),
          removedTags: new Set(),
        };
      });
      setColumnStates(initialStates);
      setSelectedTags(new Set());
      setEditingTag(null);
      setBulkActions({});
    }
  }, [open, tagColumns, columnUniqueValues]);

  // Smart matching function: checks ALL tag types case-insensitively
  const findMatchingTag = (value: string): { type: string; value: string } | null => {
    const normalizedValue = value.trim().toLowerCase();
    
    for (const tagType of tagTypes) {
      const match = tagType.values.find(
        (existingValue) => existingValue.toLowerCase() === normalizedValue
      );
      if (match) {
        return { type: tagType.name, value: match };
      }
    }
    return null;
  };

  // Handle tag type selection for a column
  const handleColumnTagTypeChange = (columnName: string, selectedTagType: string) => {
    setColumnStates((prev) => {
      const currentState = prev[columnName];
      if (!currentState) return prev;

      const newState: ColumnTagState = {
        ...currentState,
        tagType: selectedTagType,
        matchedTags: new Map(),
        customMappings: new Map(),
      };

      // Auto-match all values in this column against ALL tag types
      // If a match is found, use it (even if it's from a different tag type)
      // The user can override by mapping manually
      currentState.uniqueValues.forEach((value) => {
        if (currentState.removedTags.has(value)) return; // Skip removed tags
        
        const match = findMatchingTag(value);
        if (match) {
          // Found a match - use it, but if it's from a different tag type,
          // we'll still show it as matched but user can override
          newState.matchedTags.set(value, match);
        }
      });

      return {
        ...prev,
        [columnName]: newState,
      };
    });
  };

  // Get tag info for a value
  const getTagInfo = (columnName: string, value: string): TagValueInfo => {
    const state = columnStates[columnName];
    if (!state) {
      return {
        columnName,
        value,
        isMatched: false,
        isRemoved: false,
      };
    }

    const isRemoved = state.removedTags.has(value);
    const matchedTag = state.matchedTags.get(value);
    const customMapping = state.customMappings.get(value);

    // Consider it matched only if:
    // 1. There's a match AND
    // 2. The match is for the selected tag type (or there's a custom mapping)
    const isMatched = !!matchedTag && matchedTag.type === state.tagType;

    return {
      columnName,
      value,
      isMatched,
      matchedTag,
      customMapping,
      isRemoved,
    };
  };

  // Toggle tag removal
  const toggleTagRemoval = (columnName: string, value: string) => {
    setColumnStates((prev) => {
      const state = prev[columnName];
      if (!state) return prev;

      const newRemovedTags = new Set(state.removedTags);
      if (newRemovedTags.has(value)) {
        newRemovedTags.delete(value);
      } else {
        newRemovedTags.add(value);
      }

      return {
        ...prev,
        [columnName]: {
          ...state,
          removedTags: newRemovedTags,
        },
      };
    });
  };

  // Start editing a tag (map to existing or create new)
  const startEditingTag = (columnName: string, value: string) => {
    const state = columnStates[columnName];
    const customMapping = state?.customMappings.get(value);
    
    setEditingTag({ column: columnName, value });
    setEditingInput(customMapping?.value || value);
    setEditingIsNew(!!customMapping);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTag(null);
    setEditingInput("");
    setEditingIsNew(false);
  };

  // Apply individual tag mapping
  const applyTagMapping = (columnName: string, value: string, mappedValue: string, isNew: boolean) => {
    const state = columnStates[columnName];
    if (!state || !state.tagType) return;

    if (isNew) {
      // Create new tag value
      const success = addTagTypeValue(state.tagType, mappedValue);
      if (success) {
        setColumnStates((prev) => {
          const currentState = prev[columnName];
          if (!currentState) return prev;

          const newMappings = new Map(currentState.customMappings);
          newMappings.set(value, { type: state.tagType!, value: mappedValue });

          return {
            ...prev,
            [columnName]: {
              ...currentState,
              customMappings: newMappings,
            },
          };
        });
      }
    } else {
      // Map to existing value
      setColumnStates((prev) => {
        const currentState = prev[columnName];
        if (!currentState) return prev;

        const newMappings = new Map(currentState.customMappings);
        newMappings.set(value, { type: state.tagType!, value: mappedValue });

        return {
          ...prev,
          [columnName]: {
            ...currentState,
            customMappings: newMappings,
          },
        };
      });
    }

    cancelEditing();
  };

  // Bulk selection handlers
  const getTagKey = (columnName: string, value: string) => `${columnName}:${value}`;

  const toggleTagSelection = (columnName: string, value: string) => {
    const key = getTagKey(columnName, value);
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSelectAll = (columnName: string) => {
    const state = columnStates[columnName];
    if (!state) return;

    const allKeys = state.uniqueValues
      .filter((v) => !state.removedTags.has(v))
      .map((v) => getTagKey(columnName, v));

    const allSelected = allKeys.every((key) => selectedTags.has(key));

    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        allKeys.forEach((key) => next.delete(key));
      } else {
        allKeys.forEach((key) => next.add(key));
      }
      return next;
    });
  };

  // Bulk map to existing value
  const handleBulkMap = (columnName: string) => {
    const action = bulkActions[columnName];
    if (!action || !action.mapValue) return;

    const columnSelectedTags = Array.from(selectedTags).filter((key) => key.startsWith(`${columnName}:`));
    columnSelectedTags.forEach((key) => {
      const [, value] = key.split(":", 2);
      const state = columnStates[columnName];
      if (!state || !state.tagType) return;

      applyTagMapping(columnName, value, action.mapValue, false);
    });

    // Clear selection for this column
    setSelectedTags((prev) => {
      const next = new Set(prev);
      columnSelectedTags.forEach((key) => next.delete(key));
      return next;
    });
    
    // Clear bulk action for this column
    setBulkActions((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
  };

  // Bulk create new values
  const handleBulkCreate = (columnName: string) => {
    const action = bulkActions[columnName];
    if (!action || !action.createValue.trim()) return;

    const columnSelectedTags = Array.from(selectedTags).filter((key) => key.startsWith(`${columnName}:`));
    columnSelectedTags.forEach((key) => {
      const [, value] = key.split(":", 2);
      const state = columnStates[columnName];
      if (!state || !state.tagType) return;

      applyTagMapping(columnName, value, action.createValue.trim(), true);
    });

    // Clear selection for this column
    setSelectedTags((prev) => {
      const next = new Set(prev);
      columnSelectedTags.forEach((key) => next.delete(key));
      return next;
    });
    
    // Clear bulk action for this column
    setBulkActions((prev) => {
      const next = { ...prev };
      delete next[columnName];
      return next;
    });
  };

  // Get all unmatched tags for bulk actions (filtered by selected column if needed)
  const getUnmatchedTagsForBulk = (columnName: string) => {
    const state = columnStates[columnName];
    if (!state || !state.tagType) return [];

    return state.uniqueValues.filter((value) => {
      if (state.removedTags.has(value)) return false;
      // Consider unmatched if no match OR if match is from different tag type
      const match = state.matchedTags.get(value);
      if (match && match.type === state.tagType) {
        return false; // Matched to the correct tag type
      }
      // If matched to different tag type or not matched, allow bulk action
      return true;
    });
  };

  // Save handler
  const handleSave = () => {
    const rowTags: Record<number, Tag[]> = {};

    // Process each row
    rows.forEach((row, rowIndex) => {
      const tagsForRow: Tag[] = [];

      // Process each tag column
      tagColumns.forEach((columnName) => {
        const state = columnStates[columnName];
        if (!state || !state.tagType) return;

        const cellValue = row[columnName];
        if (!cellValue) return;

        const parsedValues = parseCommaSeparatedValues(String(cellValue));
        parsedValues.forEach((value) => {
          const trimmedValue = value.trim();
          if (!trimmedValue) return;

          // Skip removed tags
          if (state.removedTags.has(trimmedValue)) return;

          // Check for custom mapping first (user override)
          const customMapping = state.customMappings.get(trimmedValue);
          if (customMapping) {
            tagsForRow.push(customMapping);
            return;
          }

          // Check for matched tag (only use if it matches the selected tag type)
          const matchedTag = state.matchedTags.get(trimmedValue);
          if (matchedTag && matchedTag.type === state.tagType) {
            tagsForRow.push(matchedTag);
            return;
          }

          // If matched to different tag type, use the column's tag type with the matched value
          // This preserves the matched value but applies it to the correct tag type
          if (matchedTag && state.tagType) {
            tagsForRow.push({
              type: state.tagType,
              value: matchedTag.value, // Use the matched value (properly cased)
            });
            return;
          }

          // If no mapping exists but tag type is set, use the value as-is with the column's tag type
          // This handles cases where user didn't map but wants to create
          if (state.tagType) {
            tagsForRow.push({
              type: state.tagType,
              value: trimmedValue,
            });
          }
        });
      });

      if (tagsForRow.length > 0) {
        rowTags[rowIndex] = tagsForRow;
      }
    });

    onSave(rowTags);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !left-1/2 !top-1/2">
        <DialogHeader className="px-4 pt-4 pb-3 border-b flex-shrink-0">
          <DialogTitle className="text-lg">Map Tags from Excel</DialogTitle>
          <p className="text-sm text-foreground/70 mt-2">
            Select a tag type for each column. Tags that match existing values will be auto-mapped.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-6">
            {tagColumns.map((columnName) => {
              const state = columnStates[columnName];
              const uniqueValues = state?.uniqueValues || [];
              const unmatchedTags = getUnmatchedTagsForBulk(columnName);
              const columnSelectedTags = uniqueValues
                .filter((v) => !state?.removedTags.has(v))
                .map((v) => getTagKey(columnName, v))
                .filter((key) => selectedTags.has(key));

              return (
                <div key={columnName} className="space-y-3 border border-foreground/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">{columnName}</Label>
                      <p className="text-xs text-foreground/60 mt-1">
                        {uniqueValues.length} unique value{uniqueValues.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Select
                      value={state?.tagType || ""}
                      onValueChange={(tagType) => handleColumnTagTypeChange(columnName, tagType)}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select tag type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tagTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.name}>
                            {tt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {state?.tagType && (
                    <>
                      {/* Bulk Actions Bar */}
                      {columnSelectedTags.length > 0 && (
                        <div className="p-3 bg-sidebar-background rounded-md border border-foreground/10">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">
                              {columnSelectedTags.length} selected
                            </Badge>
                            {!bulkActions[columnName]?.isNew ? (
                              <>
                                <Select
                                  value={bulkActions[columnName]?.mapValue || ""}
                                  onValueChange={(val) => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: val, createValue: "", isNew: false },
                                    }));
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-[200px]">
                                    <SelectValue placeholder="Map to existing value" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tagTypes
                                      .find((tt) => tt.name === state.tagType)
                                      ?.values.map((val) => (
                                        <SelectItem key={val} value={val}>
                                          {val}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  onClick={() => handleBulkMap(columnName)}
                                  disabled={!bulkActions[columnName]?.mapValue}
                                  size="sm"
                                  className="h-8"
                                >
                                  Map Selected
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: "", createValue: "", isNew: true },
                                    }));
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
                                  value={bulkActions[columnName]?.createValue || ""}
                                  onChange={(e) => {
                                    setBulkActions((prev) => ({
                                      ...prev,
                                      [columnName]: { mapValue: "", createValue: e.target.value, isNew: true },
                                    }));
                                  }}
                                  placeholder="New tag value"
                                  className="h-8 w-[200px]"
                                />
                                <Button
                                  onClick={() => handleBulkCreate(columnName)}
                                  disabled={!bulkActions[columnName]?.createValue.trim()}
                                  size="sm"
                                  className="h-8"
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                                  Create
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setBulkActions((prev) => {
                                      const next = { ...prev };
                                      delete next[columnName];
                                      return next;
                                    });
                                  }}
                                  size="sm"
                                  className="h-8"
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTags((prev) => {
                                  const next = new Set(prev);
                                  columnSelectedTags.forEach((key) => next.delete(key));
                                  return next;
                                });
                              }}
                              className="h-8 ml-auto"
                            >
                              Clear Selection
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Render Tag Component */}
                      {(() => {
                        const renderTag = (value: string) => {
                          const tagInfo = getTagInfo(columnName, value);
                          if (tagInfo.isRemoved) return null;

                          const tagKey = getTagKey(columnName, value);
                          const isSelected = selectedTags.has(tagKey);
                          const isEditing = editingTag?.column === columnName && editingTag?.value === value;

                          // Determine final tag to display
                          const finalTag = tagInfo.customMapping || tagInfo.matchedTag;
                          const isMatched = !!tagInfo.matchedTag && !tagInfo.customMapping && tagInfo.matchedTag.type === state.tagType;

                          return (
                            <div key={value} className="relative">
                              {isEditing ? (
                                <div className="flex items-center gap-2 p-2 border border-sidebar-primary rounded-md bg-sidebar-primary/5">
                                  {!editingIsNew ? (
                                    <>
                                      <Select
                                        value={editingInput}
                                        onValueChange={(val) => {
                                          if (val === "__create_new__") {
                                            setEditingIsNew(true);
                                            setEditingInput(value);
                                          } else {
                                            applyTagMapping(columnName, value, val, false);
                                          }
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-[200px]">
                                          <SelectValue placeholder="Select value" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {tagTypes
                                            .find((tt) => tt.name === state.tagType)
                                            ?.values.map((val) => (
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
                                      <Button
                                        size="sm"
                                        onClick={cancelEditing}
                                        variant="outline"
                                        className="h-8"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Input
                                        value={editingInput}
                                        onChange={(e) => setEditingInput(e.target.value)}
                                        placeholder="New value"
                                        className="h-8 w-[200px]"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (editingInput.trim()) {
                                            applyTagMapping(columnName, value, editingInput.trim(), true);
                                          }
                                        }}
                                        className="h-8"
                                      >
                                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                                        Create
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={cancelEditing}
                                        variant="outline"
                                        className="h-8"
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div
                                  className={`flex items-center gap-1.5 ${
                                    isSelected
                                      ? "ring-2 ring-sidebar-primary rounded-md p-0.5"
                                      : ""
                                  }`}
                                >
                                  {!isMatched && (
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => toggleTagSelection(columnName, value)}
                                      className="h-4 w-4"
                                    />
                                  )}
                                  <Badge
                                    variant={isMatched ? "secondary" : "outline"}
                                    className={`flex items-center gap-1 px-2 py-1 ${
                                      !isMatched ? "cursor-pointer hover:bg-foreground/5" : ""
                                    }`}
                                    onClick={() => {
                                      if (!isMatched) {
                                        startEditingTag(columnName, value);
                                      }
                                    }}
                                  >
                                    {isMatched && <Check className="h-3 w-3 text-green-600" />}
                                    {finalTag ? finalTag.value : value}
                                    <X
                                      className="h-3 w-3 cursor-pointer hover:text-destructive ml-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTagRemoval(columnName, value);
                                      }}
                                    />
                                  </Badge>
                                </div>
                              )}
                            </div>
                          );
                        };

                        // Separate matched and unmatched tags
                        const matchedTags: string[] = [];
                        const unmatchedTags: string[] = [];

                        uniqueValues.forEach((value) => {
                          const tagInfo = getTagInfo(columnName, value);
                          if (tagInfo.isRemoved) return;

                          const isMatched = !!tagInfo.matchedTag && !tagInfo.customMapping && tagInfo.matchedTag.type === state.tagType;
                          if (isMatched) {
                            matchedTags.push(value);
                          } else {
                            unmatchedTags.push(value);
                          }
                        });

                        return (
                          <>
                            {/* Matched Tags Section */}
                            {matchedTags.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground/70">
                                  Matched Tags ({matchedTags.length})
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {matchedTags.map((value) => renderTag(value))}
                                </div>
                              </div>
                            )}

                            {/* Unmatched Tags Section */}
                            {unmatchedTags.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground/70">
                                  Unmatched Tags ({unmatchedTags.length})
                                </Label>
                                <div className="grid grid-cols-6 gap-2">
                                  {unmatchedTags.map((value) => renderTag(value))}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      {/* Select All / Deselect All */}
                      {unmatchedTags.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSelectAll(columnName)}
                            className="h-8"
                          >
                            {columnSelectedTags.length === unmatchedTags.length ? (
                              <>
                                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
                                Deselect All
                              </>
                            ) : (
                              <>
                                <Square className="h-3.5 w-3.5 mr-1.5" />
                                Select All Unmatched
                              </>
                            )}
                          </Button>
                          <span className="text-xs text-foreground/60">
                            {unmatchedTags.length} unmatched tag{unmatchedTags.length !== 1 ? "s" : ""} need mapping
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t bg-background flex-shrink-0">
          <Button variant="outline" onClick={onClose} size="sm" className="h-9">
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm" className="bg-sidebar-primary hover:bg-sidebar-primary/80 h-9">
            Save to Vault
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
