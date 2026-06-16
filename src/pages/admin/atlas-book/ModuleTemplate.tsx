import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Book, LayoutDashboard, Calculator, ListTree, Receipt, ArrowRightLeft, FileText, Users, ScanLine, Box, Wallet, PieChart, ShieldAlert, CreditCard, Landmark, BarChart3, Activity, Globe, Scale, Coins, PiggyBank, UserCheck, Search } from "lucide-react";

interface AtlasModuleProps {
  title: string;
  features: string[];
  accounts: string[];
  icon?: any;
}

export default function AtlasModule({ title, features, accounts, icon: Icon = Book }: AtlasModuleProps) {
  return (
    <div className="px-4 md:px-6 md:pl-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            {Icon && <Icon className="h-8 w-8 text-primary" />}
            {title}
          </h1>
          <p className="text-muted-foreground">Comprehensive module management within AtlasBook.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Features & Components</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {features.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Associated Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {accounts.map((a, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 text-sm font-semibold bg-primary/10 text-primary border-primary/20">
                  {a}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft border-dashed border-2 bg-muted/20">
        <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 rounded-full bg-primary/5">
            {Icon && <Icon className="h-12 w-12 text-primary opacity-20" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Module under active development</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              This module is being integrated into the core AtlasBook engine. Data visualization and interactive management tools will appear here soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
