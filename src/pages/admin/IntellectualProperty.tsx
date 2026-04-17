import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { FiledPatents } from "@/components/admin/FiledPatents";
import { PendingPatents } from "@/components/admin/PendingPatents";
import { ExpirationWatch } from "@/components/admin/ExpirationWatch";
import { AlertCircle, FileText, Archive } from "lucide-react";

export function IntellectualProperty() {
  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Intellectual Property Management
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
          Manage and track patents, including filing dates, expiration alerts, and status updates
        </p>
      </div>

      {/* Alert Banner */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
              Expiration Monitoring Active
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
              Patents expiring within 60 days will be flagged. Alerts are sent 180, 120, 90, 60, and 30 days before expiration.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="filed-patents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="filed-patents">Filed Patents</TabsTrigger>
          <TabsTrigger value="pending-patents">Pending Patents</TabsTrigger>
          <TabsTrigger value="expiration-watch">Expiration Watch</TabsTrigger>
        </TabsList>

        <TabsContent value="filed-patents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Filed Patents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiledPatents />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-patents">
          <PendingPatents />
        </TabsContent>

        <TabsContent value="expiration-watch">
          <ExpirationWatch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
