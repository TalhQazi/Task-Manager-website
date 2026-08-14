import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { FiledPatents } from "@/components/admin/FiledPatents";
import { PendingPatents } from "@/components/admin/PendingPatents";
import { ExpirationWatch } from "@/components/admin/ExpirationWatch";
import { FiledTrademarks } from "@/components/admin/FiledTrademarks";
import { GrantedTrademarks } from "@/components/admin/GrantedTrademarks";
import { ExpiredPatents } from "@/components/admin/ExpiredPatents";
import { AlertCircle, FileText, Globe, ShieldCheck, Mail, Clock, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/admin/apiClient";

export function IntellectualProperty() {
  const [activeTab, setActiveTab] = useState("filed-patents");

  const filedQuery = useQuery<any[]>({
    queryKey: ["filed-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/filed");
      return res.items || [];
    },
  });

  const pendingQuery = useQuery<any[]>({
    queryKey: ["pending-patents"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/pending");
      return res.items || [];
    },
  });

  const watchQuery = useQuery<any[]>({
    queryKey: ["expiration-watch-count"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/patents/expiration-watch");
      return res.items || [];
    },
  });

  const filedCount = filedQuery.data?.length || 0;
  const pendingCount = pendingQuery.data?.length || 0;
  const expiringCount = watchQuery.data?.length || 0;

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Intellectual Property Management
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Manage and track patents and trademarks with automated Expiration Date monitoring, real-time search, and instant Admin email alerts.
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300">
            <FileText size={16} />
            <span>{filedCount} Filed</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-semibold text-purple-800 dark:text-purple-300">
            <Clock size={16} />
            <span>{pendingCount} Pending</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle size={16} />
            <span>{expiringCount} Expiring Soon</span>
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <Card className="border-amber-200 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-800">
        <CardContent className="p-4 flex items-start gap-3">
          <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm text-amber-900 dark:text-amber-200 flex items-center gap-2">
              <span>Admin Email Notification System Active</span>
              <span className="text-[10px] px-2 py-0.5 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-full">AUTO-ALERT</span>
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              Automated emails are sent to all active <strong>Admins</strong> and <strong>Super-Admins</strong> whenever a patent is filed, or when a patent expiration date is less than 30 days away.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-2 p-1 bg-muted/50 w-fit">
          <TabsTrigger value="filed-patents" className="px-4 py-2">Filed Patents ({filedCount})</TabsTrigger>
          <TabsTrigger value="pending-patents" className="px-4 py-2">Pending Patents ({pendingCount})</TabsTrigger>
          <TabsTrigger value="expired-patents" className="px-4 py-2">Expired Patents</TabsTrigger>
          <TabsTrigger value="filed-trademarks" className="px-4 py-2">Filed Trademarks</TabsTrigger>
          <TabsTrigger value="granted-trademarks" className="px-4 py-2">Granted Trademarks</TabsTrigger>
          <TabsTrigger value="expiration-watch" className="px-4 py-2 flex items-center gap-1.5">
            <span>Expiration Watch</span>
            {expiringCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">{expiringCount}</span>
            )}
          </TabsTrigger>
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

        <TabsContent value="expired-patents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Expired Patents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ExpiredPatents />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="filed-trademarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Globe className="h-5 w-5" />
                Filed Trademarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FiledTrademarks />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="granted-trademarks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <ShieldCheck className="h-5 w-5" />
                Granted Trademarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GrantedTrademarks />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiration-watch">
          <ExpirationWatch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
