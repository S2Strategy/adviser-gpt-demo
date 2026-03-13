import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Home, FileText, MessageSquare, FileSpreadsheet, Database, FileCheck, Megaphone } from "lucide-react";
import { VaultSidebar } from "@/components/VaultSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompletedQuestionnaire } from "@/components/AddContent/CompletedQuestionnaire";
import { SingleQAPair } from "@/components/AddContent/SingleQAPair";
import { ExcelQAPair } from "@/components/AddContent/ExcelQAPair";
import { DataUpdates } from "@/components/AddContent/DataUpdates";
import { PolicyDocs } from "@/components/AddContent/PolicyDocs";
import { CommentaryDocs } from "@/components/AddContent/CommentaryDocs";
import { useTour } from "@/contexts/TourContext";

type UploadType = "questionnaire" | "single-qa" | "excel-qa" | "data-updates" | "policy-docs" | "commentary" | null;

export function AddContent() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<UploadType>(null);
  const { isActive, steps, currentStepIndex } = useTour();

  const uploadTypes = [
    {
      id: "questionnaire" as UploadType,
      title: "Completed Questionnaire",
      description: "Upload a completed Word or PDF file of question/answer pairs",
      icon: FileCheck,
      helpText: "Upload a completed Word or PDF file of question/answer pairs",
    },
    {
      id: "data-updates" as UploadType,
      title: "Data Files",
      description: "Upload an Excel file of performance and personnel data, attribution, and related strategy characteristics",
      icon: Database,
      helpText: "Upload an Excel file of performance and personnel data, attribution, and related strategy characteristics",
    },
    {
      id: "single-qa" as UploadType,
      title: "Single Q&A Pair",
      description: "Add a single question/answer pair",
      icon: MessageSquare,
      helpText: "Add a single question/answer pair",
    },
    {
      id: "commentary" as UploadType,
      title: "Insights Files",
      description: "Add recent interview transcripts, short policy documents, Form CRS and ADVs",
      icon: FileText,
      helpText: "Add recent interview transcripts, short policy documents, Form CRS and ADVs",
    },
    {
      id: "excel-qa" as UploadType,
      title: "Excel Q&A Pairs",
      description: "Upload an Excel file of question/answer pairs",
      icon: FileSpreadsheet,
      helpText: "Upload an Excel file of question/answer pairs",
    },
    {
      id: "policy-docs" as UploadType,
      title: "Samples",
      description: "Upload compliance-approved templates for drafting client talking points, market recaps, and commentary",
      icon: FileText,
      helpText: "Upload compliance-approved templates for drafting client talking points, market recaps, and commentary",
    },
  ];

  const renderContent = () => {
    switch (selectedType) {
      case "questionnaire":
        return <CompletedQuestionnaire />;
      case "single-qa":
        return <SingleQAPair />;
      case "excel-qa":
        return <ExcelQAPair />;
      case "data-updates":
        return <DataUpdates />;
      case "policy-docs":
        return <PolicyDocs />;
      case "commentary":
        return <CommentaryDocs />;
      default:
        return null;
    }
  };

  const selectedTypeData = uploadTypes.find((t) => t.id === selectedType);

  useEffect(() => {
    const step = steps[currentStepIndex];
    if (isActive && step?.id === "add-content-page") {
      setSelectedType(null);
    }
  }, [isActive, steps, currentStepIndex]);

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
              <Link to="/vault" className="text-foreground/70 hover:text-foreground">
                Vault
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">Add Content</span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">Add Content</h1>
                <p className="text-foreground/70">Choose a method to add content for your Vault</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div data-tour-id="add-content-options" className="max-w-4xl mx-auto h-full">
              {!selectedType ? (
                /* Upload Type Selection */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Card
                          key={type.id}
                          className="cursor-pointer hover:border-sidebar-primary transition-colors"
                          onClick={() => setSelectedType(type.id)}
                        >
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-sidebar-background">
                                <Icon className="h-5 w-5 text-foreground/70" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{type.title}</CardTitle>
                                <CardDescription className="mt-1">
                                  {type.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Selected Upload Type Content */
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedTypeData?.title}</h2>
                      <p className="text-sm text-foreground/70 mt-1">
                        {selectedTypeData?.helpText}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedType(null)}
                      className="text-sm text-foreground/70 hover:text-foreground"
                    >
                      ← Back to selection
                    </button>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      {renderContent()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

