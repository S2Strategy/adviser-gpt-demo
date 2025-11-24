import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { VaultSidebar } from "@/components/VaultSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FileUpload() {
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
              <Link to="/vault/add-content" className="text-foreground/70 hover:text-foreground">
                Add Content
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">File Upload</span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">File Upload</h1>
                <p className="text-foreground/70">Upload questionnaire documents</p>
              </div>
            </div>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Questionnaire</CardTitle>
                  <CardDescription>
                    Upload your completed questionnaire document here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-foreground/70">
                      File upload functionality will be implemented here.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.history.back()}
                    >
                      Go Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

