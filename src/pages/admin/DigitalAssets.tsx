import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { Printer } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { ActiveWebsites } from "@/components/admin/ActiveWebsites";
import { FutureWebsites } from "@/components/admin/FutureWebsites";
import { SocialMediaAccounts } from "@/components/admin/SocialMediaAccounts";
import { EmailAccounts } from "@/components/admin/EmailAccounts";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/admin/apiClient";

export function DigitalAssets() {
  const activeWebsitesQuery = useQuery({
    queryKey: ["active-websites"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/websites/active");
      return res.items || [];
    },
  });

  const futureWebsitesQuery = useQuery({
    queryKey: ["future-websites"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/websites/future");
      return res.items || [];
    },
  });

  const socialMediaQuery = useQuery({
    queryKey: ["social-media-accounts"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/social-media");
      return res.items || [];
    },
  });

  const emailAccountsQuery = useQuery({
    queryKey: ["email-accounts"],
    queryFn: async () => {
      const res = await apiFetch<{ items: any[] }>("/api/email-accounts");
      return res.items || [];
    },
  });

  const activeCount = activeWebsitesQuery.data?.length ?? 0;
  const futureCount = futureWebsitesQuery.data?.length ?? 0;
  const socialCount = socialMediaQuery.data?.length ?? 0;
  const emailCount = emailAccountsQuery.data?.length ?? 0;

  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Digital Assets
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
            Manage websites, domains, and social media accounts
          </p>
        </div>
        <Button 
          onClick={() => window.print()} 
          variant="outline" 
          className="flex items-center gap-2 print:hidden"
        >
          <Printer className="h-4 w-4" />
          Print Report
        </Button>
      </div>

      <Tabs defaultValue="active-websites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="active-websites" className="py-2.5 flex items-center justify-center gap-2">
            <span>Active Websites</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-semibold rounded-full min-w-[20px] text-center">
              {activeCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="future-websites" className="py-2.5 flex items-center justify-center gap-2">
            <span>Future Websites</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-semibold rounded-full min-w-[20px] text-center">
              {futureCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="social-media" className="py-2.5 flex items-center justify-center gap-2">
            <span>Social Media</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-semibold rounded-full min-w-[20px] text-center">
              {socialCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="email-accounts" className="py-2.5 flex items-center justify-center gap-2">
            <span>Email Accounts</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] font-semibold rounded-full min-w-[20px] text-center">
              {emailCount}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <style>{`
          @media print {
            aside, nav, header, .print\\:hidden {
              display: none !important;
            }
            .pl-6 {
              padding-left: 0 !important;
            }
            main {
              margin: 0 !important;
              padding: 0 !important;
            }
            .TabsContent {
              display: block !important;
            }
            /* Force all tabs to show in print if needed, but usually we just print the active one */
          }
        `}</style>

        <TabsContent value="active-websites">
          <Card>
            <CardHeader>
              <CardTitle>Active Websites</CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveWebsites />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="future-websites">
          <Card>
            <CardHeader>
              <CardTitle>Future Websites</CardTitle>
            </CardHeader>
            <CardContent>
              <FutureWebsites />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social-media">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <SocialMediaAccounts />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email-accounts">
          <Card>
            <CardHeader>
              <CardTitle>Email Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <EmailAccounts />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
