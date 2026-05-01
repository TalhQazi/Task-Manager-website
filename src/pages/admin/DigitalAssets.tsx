import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/admin/ui/tabs";
import { ActiveWebsites } from "@/components/admin/ActiveWebsites";
import { FutureWebsites } from "@/components/admin/FutureWebsites";
import { SocialMediaAccounts } from "@/components/admin/SocialMediaAccounts";
import { EmailAccounts } from "@/components/admin/EmailAccounts";

export function DigitalAssets() {
  return (
    <div className="pl-6 space-y-4 sm:space-y-5 md:space-y-6">
      <div className="space-y-1.5 sm:space-y-2">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Digital Assets
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-3xl">
          Manage websites, domains, and social media accounts
        </p>
      </div>

      <Tabs defaultValue="active-websites" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active-websites">Active Websites</TabsTrigger>
          <TabsTrigger value="future-websites">Future Websites</TabsTrigger>
          <TabsTrigger value="social-media">Social Media</TabsTrigger>
          <TabsTrigger value="email-accounts">Email Accounts</TabsTrigger>
        </TabsList>

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
