import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <Card className="shadow-soft">
          <CardContent className="py-16">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Construction className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                This module is under development. Check back soon for updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export const Appliances = () => (
  <PlaceholderPage
    title="Appliances Management"
    description="Track and manage appliances, warranties, and maintenance records."
  />
);

export const Scheduling = () => (
  <PlaceholderPage
    title="Location Scheduling"
    description="Create and manage daily/weekly schedules for all locations."
  />
);

export const Messaging = () => (
  <PlaceholderPage
    title="Messaging & Notifications"
    description="Send system-wide notifications and manage message logs."
  />
);

export const DoNotHire = () => (
  <PlaceholderPage
    title="Do Not Hire List"
    description="Manage blacklisted profiles and incident records."
  />
);

export const Settings = () => (
  <PlaceholderPage
    title="Settings"
    description="Configure system-wide settings and preferences."
  />
);
