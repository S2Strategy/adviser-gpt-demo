import { ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuestionCard, QuestionCardData } from "./QuestionCard";

interface SingleFileViewProps {
  fileName: string;
  questionCount: number;
  onBack: () => void;
}

// Mock data for questions - in real app this would come from props or API
const mockQuestions = [
  {
    id: "1",
    fileName: "AI_Policy_Document_April_2025",
    updatedAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedBy: "Brian",
    question: "What specific pre-approval requirements must Granite Peak employees adhere to when using AI Systems involving proprietary information, and what roles do the Deputy CCO and Director of Operations play in the due diligence process to prevent unauthorized sharing of confidential information?",
    answer: "II. PRE-APPROVAL REQUIREMENT Granite Peak employees are prohibited from using any AI Systems involving the consumption of data or proprietary information related to Granite Peak's business without specific authorization from the Deputy CCO and the Director of Operations. Once notified, these officers will be responsible for conducting due diligence on the specific AI System for several purposes, including but not limited to avoiding the inappropriate or unauthorized sharing of confidential information, and avoiding the unintended loss of intellectual property. IF YOU ARE UNSURE WHETHER USE OF ANY AI SYSTEM REQUIRES PRE-APPROVAL, PLEASE CONTACT THE DEPUTY CCO. PLEASE DO NOT MAKE AN ASSUMPTION. III. PRESENT AUTHORIZED USE AND MONITORING Granite Peak employees may use AI Systems for general business purposes, including but not limited to research, analysis, and communication, provided that such use does not involve the input of confidential or proprietary information related to Granite Peak's business.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)",
    tags: ["DDQ", "RFP"]
  },
  {
    id: "2", 
    fileName: "AI_Policy_Document_April_2025",
    updatedAt: new Date(Date.now() - 5184000000), // 2 months ago
    updatedBy: "Brian",
    question: "What specific approval process must Granite Peak employees follow before implementing AI systems like ChatGPT or CoPilot, and what limitations are currently placed on their use for client-facing business purposes?",
    answer: "Employees must obtain pre-approval from the Deputy CCO and Director of Operations before using any AI systems that involve proprietary information. The approval process includes due diligence review to prevent unauthorized sharing of confidential information and intellectual property loss.",
    duration: "Evergreen",
    strategy: "Firm Wide (Not Strategy Specific)", 
    tags: ["AI", "DDQ"]
  }
];

export function SingleFileView({ fileName, questionCount, onBack }: SingleFileViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Files
        </Button>
      </div>

      {/* File Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{fileName}</h1>
        <p className="text-muted-foreground">{questionCount} questions</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search questions"
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter questions
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        {mockQuestions.map((question) => (
          <QuestionCard 
            key={question.id} 
            data={question}
            hideFileName={true}
          />
        ))}
      </div>
    </div>
  );
}