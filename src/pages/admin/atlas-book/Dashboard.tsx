import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Book, Building2, Landmark, LayoutDashboard, Calculator, ListTree, Receipt, 
  ArrowRightLeft, FileText, Users, ScanLine, Box, Wallet, PieChart, 
  ShieldAlert, CreditCard, BarChart3, Activity, Globe, Scale, Coins, 
  PiggyBank, UserCheck, Search, ShieldCheck, ClipboardCheck, Timer
} from "lucide-react";

export const atlasModules = [
  { id: "company", title: "Company Management", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "property", title: "Property Management", icon: Landmark, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "unit", title: "Unit Management", icon: LayoutDashboard, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "coa", title: "Chart of Accounts", icon: ListTree, color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "gl", title: "General Ledger", icon: Calculator, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: "transactions", title: "Transaction Management", icon: ArrowRightLeft, color: "text-pink-500", bg: "bg-pink-500/10" },
  { id: "ap", title: "Accounts Payable", icon: Receipt, color: "text-red-500", bg: "bg-red-500/10" },
  { id: "ar", title: "Accounts Receivable", icon: Wallet, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  { id: "vendor", title: "Vendor Management", icon: Users, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "customer", title: "Customer/Tenant Management", icon: UserCheck, color: "text-teal-500", bg: "bg-teal-500/10" },
  { id: "ocr", title: "Receipt & OCR Module", icon: ScanLine, color: "text-violet-500", bg: "bg-violet-500/10" },
  { id: "inventory", title: "Inventory Management", icon: Box, color: "text-blue-600", bg: "bg-blue-600/10" },
  { id: "payroll", title: "Payroll Module", icon: Coins, color: "text-green-600", bg: "bg-green-600/10" },
  { id: "budget", title: "Budget Management", icon: PiggyBank, color: "text-yellow-600", bg: "bg-yellow-600/10" },
  { id: "reporting", title: "Financial Reporting", icon: PieChart, color: "text-indigo-600", bg: "bg-indigo-600/10" },
  { id: "fraud", title: "Fraud Detection", icon: ShieldAlert, color: "text-red-600", bg: "bg-red-600/10" },
  { id: "credit", title: "Credit Monitoring", icon: CreditCard, color: "text-sky-600", bg: "bg-sky-600/10" },
  { id: "title", title: "Title & Lien Monitoring", icon: ShieldCheck, color: "text-lime-600", bg: "bg-lime-600/10" },
  { id: "analytics", title: "Dashboard & Analytics", icon: BarChart3, color: "text-rose-600", bg: "bg-rose-600/10" },
  { id: "audit", title: "Audit & Compliance", icon: ClipboardCheck, color: "text-slate-600", bg: "bg-slate-600/10" },
  { id: "currency", title: "Multi-Currency Module", icon: Globe, color: "text-cyan-600", bg: "bg-cyan-600/10" },
  { id: "tax", title: "Tax Management", icon: Scale, color: "text-orange-600", bg: "bg-orange-600/10" },
  { id: "fixed-assets", title: "Fixed Asset Management", icon: Activity, color: "text-blue-700", bg: "bg-blue-700/10" },
  { id: "loans", title: "Loan & Financing", icon: Landmark, color: "text-emerald-700", bg: "bg-emerald-700/10" },
  { id: "investor", title: "Investor Reporting", icon: PieChart, color: "text-purple-700", bg: "bg-purple-700/10" },
  { id: "approval", title: "Approval Workflow", icon: Timer, color: "text-amber-700", bg: "bg-amber-700/10" },
  { id: "search", title: "Search & Analytics", icon: Search, color: "text-indigo-700", bg: "bg-indigo-700/10" },
];

export default function AtlasBookDashboard() {
  const navigate = useNavigate();

  return (
    <div className="px-4 md:px-6 md:pl-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <img src="/atlas.png" alt="AtlasBook Logo" className="h-10 w-10 object-contain" />
          Atlas<span className="text-primary">Book</span>
        </h1>
        <p className="text-muted-foreground text-lg">The ultimate business engine for comprehensive financial and operational management.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {atlasModules.map((m) => (
          <Card 
            key={m.id} 
            className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-card/50 backdrop-blur-sm hover:translate-y-[-4px]"
            onClick={() => navigate(`/admin/atlas-book/${m.id}`)}
          >
            <CardHeader className="pb-4">
              <div className={`h-12 w-12 rounded-2xl ${m.bg} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                {m.icon && <m.icon className={`h-6 w-6 ${m.color}`} />}
              </div>
              <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest gap-2">
                View Module <ArrowRightLeft className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
