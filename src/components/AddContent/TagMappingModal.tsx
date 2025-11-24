import { useState, useMemo } from "react";
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
import { X, Plus, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TagMappingModalProps {
  open: boolean;
  onClose: () => void;
  rows: ParsedExcelRow[];
  tagColumns: string[]; // Columns that contain tags (comma-separated values)
  onSave: (mappedTags: Record<number, Tag[]>) => void; // row index -> tags
}

interface TagMapping {
  rowIndex: number;
  columnName: string;
  value: string; // Individual value from comma-separated list
  tagType: string;
  tagValue: string;
  isNewValue: boolean;
}

export function TagMappingModal({
  open,
  onClose,
  rows,
  tagColumns,
  onSave,
}: TagMappingModalProps) {
  const { tagTypes, addTagTypeValue } = useTagTypes();
  const [mappings, setMappings] = useState<Record<string, TagMapping>>({});
  const [newTagValueInputs, setNewTagValueInputs] = useState<Record<string, string>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkTagType, setBulkTagType] = useState<string>("");
  const [bulkTagValue, setBulkTagValue] = useState<string>("");
  const [bulkIsNewValue, setBulkIsNewValue] = useState(false);
  const [bulkNewValueInput, setBulkNewValueInput] = useState<string>("");

  // Extract unique values from tag columns (only process selected columns)
  // Deduplicate by value+column to avoid showing the same mapping multiple times
  const tagValuesToMap = useMemo(() => {
    const seen = new Set<string>();
    const values: Array<{ rowIndex: number; columnName: string; value: string }> = [];
    
    // Only process the selected tag columns (not all columns)
    rows.forEach((row, rowIndex) => {
      tagColumns.forEach((columnName) => {
        const cellValue = row[columnName];
        if (cellValue) {
          const parsedValues = parseCommaSeparatedValues(String(cellValue));
          parsedValues.forEach((value) => {
            const trimmedValue = value.trim();
            if (trimmedValue) {
              // Use column:value as key to deduplicate (same value in same column only mapped once)
              const key = `${columnName}:${trimmedValue}`;
              if (!seen.has(key)) {
                seen.add(key);
                values.push({ rowIndex, columnName, value: trimmedValue });
              }
            }
          });
        }
      });
    });
    
    return values;
  }, [rows, tagColumns]);

  const getMappingKey = (rowIndex: number, columnName: string, value: string) => {
    return `${rowIndex}-${columnName}-${value}`;
  };

  const updateMapping = (
    rowIndex: number,
    columnName: string,
    value: string,
    tagType: string,
    tagValue: string,
    isNewValue: boolean = false
  ) => {
    const key = getMappingKey(rowIndex, columnName, value);
    setMappings((prev) => ({
      ...prev,
      [key]: {
        rowIndex,
        columnName,
        value,
        tagType,
        tagValue,
        isNewValue,
      },
    }));
  };

  const handleTagTypeChange = (
    rowIndex: number,
    columnName: string,
    value: string,
    tagType: string
  ) => {
    const existingMapping = mappings[getMappingKey(rowIndex, columnName, value)];
    const tagTypeObj = tagTypes.find((tt) => tt.name === tagType);
    const existingValues = tagTypeObj?.values || [];
    
    // Try to find a matching value
    const matchingValue = existingValues.find(
      (v) => v.toLowerCase() === value.toLowerCase()
    );
    
    if (matchingValue) {
      updateMapping(rowIndex, columnName, value, tagType, matchingValue, false);
    } else {
      // No match, user will need to create or select
      updateMapping(rowIndex, columnName, value, tagType, value, true);
      setNewTagValueInputs((prev) => ({
        ...prev,
        [getMappingKey(rowIndex, columnName, value)]: value,
      }));
    }
  };

  const handleTagValueChange = (
    rowIndex: number,
    columnName: string,
    value: string,
    tagValue: string
  ) => {
    const key = getMappingKey(rowIndex, columnName, value);
    const existingMapping = mappings[key];
    if (existingMapping) {
      updateMapping(
        rowIndex,
        columnName,
        value,
        existingMapping.tagType,
        tagValue,
        false
      );
    }
  };

  const handleCreateNewValue = (
    rowIndex: number,
    columnName: string,
    value: string
  ) => {
    const key = getMappingKey(rowIndex, columnName, value);
    const mapping = mappings[key];
    const newValueInput = newTagValueInputs[key] || value;
    
    if (!mapping || !mapping.tagType) {
      return;
    }

    // Add the new value to the tag type
    const success = addTagTypeValue(mapping.tagType, newValueInput);
    if (success) {
      updateMapping(
        rowIndex,
        columnName,
        value,
        mapping.tagType,
        newValueInput,
        false
      );
      setNewTagValueInputs((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = () => {
    // Convert mappings to tags per row
    const rowTags: Record<number, Tag[]> = {};
    
    Object.values(mappings).forEach((mapping) => {
      if (!rowTags[mapping.rowIndex]) {
        rowTags[mapping.rowIndex] = [];
      }
      
      // Check if this tag already exists for this row
      const existingTag = rowTags[mapping.rowIndex].find(
        (t) => t.type === mapping.tagType && t.value === mapping.tagValue
      );
      
      if (!existingTag) {
        rowTags[mapping.rowIndex].push({
          type: mapping.tagType,
          value: mapping.tagValue,
        });
      }
    });
    
    onSave(rowTags);
    onClose();
  };

  const getMappingForValue = (rowIndex: number, columnName: string, value: string) => {
    return mappings[getMappingKey(rowIndex, columnName, value)];
  };

  // Bulk selection handlers
  const toggleItemSelection = (key: string) => {
    setSelectedItems((prev) => {
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
    if (selectedItems.size === tagValuesToMap.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(tagValuesToMap.map((item, index) => getMappingKey(item.rowIndex, item.columnName, item.value))));
    }
  };

  // Bulk apply tag type
  const handleBulkApplyTagType = () => {
    if (!bulkTagType) return;

    const tagTypeObj = tagTypes.find((tt) => tt.name === bulkTagType);
    const existingValues = tagTypeObj?.values || [];

    selectedItems.forEach((key) => {
      // Find the item by key
      const item = tagValuesToMap.find(
        (item) => getMappingKey(item.rowIndex, item.columnName, item.value) === key
      );
      
      if (!item) return;

      // Try to find matching value
      const matchingValue = existingValues.find(
        (v) => v.toLowerCase() === item.value.toLowerCase()
      );

      if (matchingValue) {
        updateMapping(item.rowIndex, item.columnName, item.value, bulkTagType, matchingValue, false);
      } else {
        updateMapping(item.rowIndex, item.columnName, item.value, bulkTagType, item.value, true);
        setNewTagValueInputs((prev) => ({
          ...prev,
          [key]: item.value,
        }));
      }
    });

    setBulkTagType("");
  };

  // Bulk apply tag value
  const handleBulkApplyTagValue = () => {
    if (!bulkTagValue && !bulkIsNewValue) return;

    selectedItems.forEach((key) => {
      // Find the item by key
      const item = tagValuesToMap.find(
        (item) => getMappingKey(item.rowIndex, item.columnName, item.value) === key
      );
      
      if (!item) return;

      const mapping = mappings[key];
      const tagType = mapping?.tagType || bulkTagType;
      if (!tagType) return;

      if (bulkIsNewValue) {
        // Create new value for all selected items
        const newValue = bulkNewValueInput.trim() || item.value;
        const success = addTagTypeValue(tagType, newValue);
        if (success) {
          updateMapping(item.rowIndex, item.columnName, item.value, tagType, newValue, false);
        }
      } else {
        // Use existing value
        updateMapping(item.rowIndex, item.columnName, item.value, tagType, bulkTagValue, false);
      }
    });

    setBulkTagValue("");
    setBulkIsNewValue(false);
    setBulkNewValueInput("");
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col p-0 !translate-x-[-50%] !translate-y-[-50%] !left-1/2 !top-1/2">
        <DialogHeader className="pl-4 pr-12 pt-4 pb-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">Map Tags from Excel</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="h-8"
              >
                {selectedItems.size === tagValuesToMap.length ? (
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
              {selectedItems.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-8 text-xs"
                >
                  Clear ({selectedItems.size})
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-3">

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
              <div className="p-3 bg-sidebar-background rounded-md border border-foreground/10">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{selectedItems.size} selected</Badge>
                  <div className="flex items-center gap-2 flex-1">
                    <Select value={bulkTagType} onValueChange={setBulkTagType}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Tag Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tagTypes.map((tt) => (
                          <SelectItem key={tt.id} value={tt.name}>
                            {tt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleBulkApplyTagType}
                      disabled={!bulkTagType}
                      size="sm"
                      className="h-8"
                    >
                      Apply Type
                    </Button>
                    {bulkTagType && (
                      <>
                        {bulkIsNewValue ? (
                          <div className="flex gap-2 flex-1">
                            <Input
                              value={bulkNewValueInput}
                              onChange={(e) => setBulkNewValueInput(e.target.value)}
                              placeholder="New value"
                              className="h-8 text-sm"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                setBulkIsNewValue(false);
                                handleBulkApplyTagValue();
                              }}
                              className="h-8"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 flex-1">
                            <Select
                              value={bulkTagValue}
                              onValueChange={(val) => {
                                if (val === "__create_new__") {
                                  setBulkIsNewValue(true);
                                  setBulkNewValueInput("");
                                } else {
                                  setBulkTagValue(val);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue placeholder="Tag Value" />
                              </SelectTrigger>
                              <SelectContent>
                                {tagTypes
                                  .find((tt) => tt.name === bulkTagType)
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
                              onClick={handleBulkApplyTagValue}
                              disabled={!bulkTagValue}
                              size="sm"
                              className="h-8"
                            >
                              Apply Value
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
            {tagValuesToMap.map(({ rowIndex, columnName, value }, index) => {
              const mapping = getMappingForValue(rowIndex, columnName, value);
              const key = getMappingKey(rowIndex, columnName, value);
              const tagTypeObj = tagTypes.find((tt) => tt.name === mapping?.tagType);
              const existingValues = tagTypeObj?.values || [];
              const newValueInput = newTagValueInputs[key] || value;
              
              const isSelected = selectedItems.has(key);
              
              return (
                <div
                  key={`${key}-${index}`}
                  className={`p-2.5 border rounded-md ${
                    isSelected
                      ? "border-sidebar-primary bg-sidebar-primary/5"
                      : "border-foreground/10 bg-background"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleItemSelection(key)}
                      className="h-4 w-4"
                    />
                    <div className="flex items-center gap-1.5 min-w-12">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">R{rowIndex + 1}</Badge>
                      {/* <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">{columnName}</Badge> */}
                    </div>
                    <span className="text-sm font-medium min-w-0 flex flex-1 max-w-xs truncate">{value}</span>
                    
                    <div className="flex items-center gap-2 flex-1 justify-start">
                      <Select
                        value={mapping?.tagType || ""}
                        onValueChange={(tagType) =>
                          handleTagTypeChange(rowIndex, columnName, value, tagType)
                        }
                      >
                        <SelectTrigger className="h-8 text-sm w-auto">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {tagTypes.map((tt) => (
                            <SelectItem key={tt.id} value={tt.name}>
                              {tt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {mapping?.tagType && (
                        <>
                          {mapping.isNewValue ? (
                            <div className="flex gap-1.5">
                              <Input
                                value={newValueInput}
                                onChange={(e) =>
                                  setNewTagValueInputs((prev) => ({
                                    ...prev,
                                    [key]: e.target.value,
                                  }))
                                }
                                placeholder="New value"
                                className="h-8 flex-1 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleCreateNewValue(rowIndex, columnName, value)
                                }
                                className="h-8 min-w-8 flex gap-1 items-center"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Select
                                value={mapping.tagValue || ""}
                                onValueChange={(tagValue) => {
                                  if (tagValue === "__create_new__") {
                                    updateMapping(
                                      rowIndex,
                                      columnName,
                                      value,
                                      mapping.tagType,
                                      value,
                                      true
                                    );
                                    setNewTagValueInputs((prev) => ({
                                      ...prev,
                                      [key]: value,
                                    }));
                                  } else {
                                    handleTagValueChange(rowIndex, columnName, value, tagValue);
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-sm w-auto">
                                  <SelectValue placeholder="Value" />
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
                              {mapping.tagValue && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMappings((prev) => {
                                      const next = { ...prev };
                                      delete next[key];
                                      return next;
                                    });
                                  }}
                                  className="h-8 min-w-8 flex gap-1 items-center"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Clear
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    {mapping?.tagValue && !mapping.isNewValue && (
                      <Badge variant="secondary" className="text-xs w-auto flex">
                        {mapping.tagType}: {mapping.tagValue}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
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

