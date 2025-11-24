import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

export function CompletedQuestionnaire() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Button
        onClick={() => navigate('/file-upload')}
        className="bg-sidebar-primary hover:bg-sidebar-primary/80"
      >
        <FileText className="h-4 w-4 mr-2" />
        Go to File Upload
      </Button>
    </div>
  );
}

