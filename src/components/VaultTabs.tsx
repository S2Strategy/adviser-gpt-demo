import { useState } from "react";
import { File, Shapes, Target, Database, MoreHorizontal, Tag, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DocumentTable } from "./DocumentTable";

const mockFiles = [
  { name: "AI_Policy_Document_April_2025", totalItems: 22 },
  { name: "CalPERS Pension Fund Global Fixed Income Strategy Management", totalItems: 3 },
  { name: "Comprehensive Request for Proposal (RFP)", totalItems: 1 },
  { name: "ESG Triple-Double Fund: Request for Proposal (RFP)", totalItems: 20 },
  { name: "Global Emerging Markets Dunk Fund: Request for Proposal (RFP)", totalItems: 16 },
  { name: "Investment Approach", totalItems: 50 },
  { name: "Investment Management Proposal", totalItems: 4 },
  { name: "Large-Cap All-Star Fund: Request for Proposal (RFP)", totalItems: 26 },
];

const mockTypes = [
  { name: "Commentary", totalItems: 45 },
  { name: "Policy", totalItems: 67 },
  { name: "Questionnaire", totalItems: 30 },
];

const mockStrategies = [
  { name: "Firm Wide (Not Strategy-Specific)", totalItems: 89 },
  { name: "Large Cap Growth", totalItems: 32 },
  { name: "Small Cap Growth", totalItems: 21 },
];

export function VaultTabs() {
  const [activeTab, setActiveTab] = useState("files");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium">Documents</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Updates
            <Badge variant="destructive" className="ml-2">
              180
            </Badge>
          </Button>
          <Button variant="ghost" size="sm">
            <Tag className="h-4 w-4 mr-2" />
            Tags
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="files" className="flex items-center gap-2">
            <File className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="type" className="flex items-center gap-2">
            <Shapes className="h-4 w-4" />
            Type
          </TabsTrigger>
          <TabsTrigger value="strategy" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Strategy
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6">
          <DocumentTable data={mockFiles} />
        </TabsContent>

        <TabsContent value="type" className="mt-6">
          <DocumentTable data={mockTypes} />
        </TabsContent>

        <TabsContent value="strategy" className="mt-6">
          <DocumentTable data={mockStrategies} />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              Policy documents for the Microsoft Word plugin will appear here.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}