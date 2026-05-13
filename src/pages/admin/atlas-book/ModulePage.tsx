import { useParams } from "react-router-dom";
import AtlasModule from "./ModuleTemplate";
import { 
  Building2, Landmark, LayoutDashboard, Calculator, ListTree, Receipt, 
  ArrowRightLeft, FileText, Users, ScanLine, Box, Wallet, PieChart, 
  ShieldAlert, CreditCard, BarChart3, Activity, Globe, Scale, Coins, 
  PiggyBank, UserCheck, Search, ShieldCheck, ClipboardCheck, Timer
} from "lucide-react";

const moduleData: Record<string, { title: string; features: string[]; accounts: string[]; icon: any }> = {
  "company": {
    title: "Company Management",
    features: ["Company Creation", "Legal Entity Information", "Tax Information", "Base Currency", "Branch Management", "Fiscal Year Setup"],
    accounts: ["Company Equity", "Retained Earnings", "Capital Accounts"],
    icon: Building2
  },
  "property": {
    title: "Property Management",
    features: ["Property Registration", "Address & Parcel Information", "Purchase Details", "Ownership Tracking", "Property Status"],
    accounts: ["Property Assets", "Land Assets", "Building Assets", "Property Depreciation"],
    icon: Landmark
  },
  "unit": {
    title: "Unit Management",
    features: ["Unit Creation", "Unit Status", "Rental Information", "Occupancy Tracking", "Unit Profitability"],
    accounts: ["Unit Revenue", "Unit Maintenance Expense", "Unit Utility Expense"],
    icon: LayoutDashboard
  },
  "coa": {
    title: "Chart of Accounts",
    features: ["Assets Management", "Liabilities Management", "Equity Management", "Revenue Management", "Expenses Management"],
    accounts: ["Cash", "Bank Accounts", "Accounts Receivable", "Inventory", "Fixed Assets", "Accounts Payable", "Loans Payable", "Mortgage Payable", "Owner Equity", "Retained Earnings", "Rental Income", "Sales Revenue", "Other Income", "Salaries", "Utilities", "Repairs & Maintenance", "Insurance", "Depreciation"],
    icon: ListTree
  },
  "gl": {
    title: "General Ledger",
    features: ["Double Entry Accounting", "Journal Entries", "Reversal Entries", "Trial Balance"],
    accounts: ["Debit/Credit Accounts", "Adjustment Accounts"],
    icon: Calculator
  },
  "transactions": {
    title: "Transaction Management",
    features: ["Income Transactions", "Expense Transactions", "Vendor Payments", "Customer Payments"],
    accounts: ["Cash Account", "Bank Account", "Expense Accounts", "Revenue Accounts"],
    icon: ArrowRightLeft
  },
  "ap": {
    title: "Accounts Payable",
    features: ["Vendor Bills", "Outstanding Payables", "Aging Reports"],
    accounts: ["Accounts Payable", "Vendor Liability"],
    icon: Receipt
  },
  "ar": {
    title: "Accounts Receivable",
    features: ["Customer Invoices", "Payment Collection", "Due Tracking"],
    accounts: ["Accounts Receivable", "Bad Debt Expense"],
    icon: Wallet
  },
  "vendor": {
    title: "Vendor Management",
    features: ["Vendor Profiles", "Spending Analytics"],
    accounts: ["Vendor Payable Accounts", "Vendor Expense Accounts"],
    icon: Users
  },
  "customer": {
    title: "Customer / Tenant Management",
    features: ["Tenant Profiles", "Lease Agreements", "Rent Tracking"],
    accounts: ["Rental Income", "Security Deposits"],
    icon: UserCheck
  },
  "ocr": {
    title: "Receipt & OCR Module",
    features: ["Receipt Upload", "OCR Processing", "Expense Auto Entry"],
    accounts: ["Expense Accounts", "Reimbursement Accounts"],
    icon: ScanLine
  },
  "inventory": {
    title: "Inventory Management",
    features: ["Raw Inventory", "Finished Inventory", "Warehouse Tracking"],
    accounts: ["Inventory Asset", "Cost of Goods Sold"],
    icon: Box
  },
  "payroll": {
    title: "Payroll Module",
    features: ["Employee Salaries", "Deductions", "Payroll Reports"],
    accounts: ["Salary Expense", "Payroll Liability"],
    icon: Coins
  },
  "budget": {
    title: "Budget Management",
    features: ["Annual Budgets", "Budget vs Actual"],
    accounts: ["Budget Accounts", "Forecast Accounts"],
    icon: PiggyBank
  },
  "reporting": {
    title: "Financial Reporting",
    features: ["Profit & Loss", "Balance Sheet", "Cash Flow", "Tax Reports"],
    accounts: ["All Financial Accounts"],
    icon: PieChart
  },
  "fraud": {
    title: "Fraud Detection",
    features: ["Duplicate Payment Detection", "Expense Spike Alerts", "Missing Receipt Detection"],
    accounts: ["Risk Adjustment Accounts"],
    icon: ShieldAlert
  },
  "credit": {
    title: "Credit Monitoring",
    features: ["Business Credit Tracking", "Debt Ratio Monitoring"],
    accounts: ["Credit Accounts", "Loan Accounts"],
    icon: CreditCard
  },
  "title": {
    title: "Title & Lien Monitoring",
    features: ["Mortgage Monitoring", "Ownership Changes"],
    accounts: ["Mortgage Liability", "Legal Expense"],
    icon: ShieldCheck
  },
  "analytics": {
    title: "Dashboard & Analytics",
    features: ["Global Dashboard", "Financial KPIs"],
    accounts: ["KPI Metric Accounts"],
    icon: BarChart3
  },
  "audit": {
    title: "Audit & Compliance",
    features: ["Audit Trails", "Transaction History"],
    accounts: ["Audit Adjustments"],
    icon: ClipboardCheck
  },
  "currency": {
    title: "Multi-Currency Module",
    features: ["Currency Exchange", "Exchange Gain/Loss"],
    accounts: ["Exchange Gain", "Exchange Loss"],
    icon: Globe
  },
  "tax": {
    title: "Tax Management",
    features: ["VAT/GST", "Tax Filing"],
    accounts: ["Tax Payable", "Tax Expense"],
    icon: Scale
  },
  "fixed-assets": {
    title: "Fixed Asset Management",
    features: ["Asset Purchase", "Depreciation", "Asset Register"],
    accounts: ["Fixed Assets", "Accumulated Depreciation"],
    icon: Activity
  },
  "loans": {
    title: "Loan & Financing",
    features: ["Loan Tracking", "EMI Schedules"],
    accounts: ["Loan Liability", "Interest Expense"],
    icon: Landmark
  },
  "investor": {
    title: "Investor Reporting",
    features: ["Investor Statements", "ROI Reports"],
    accounts: ["Investor Equity", "Dividend Payable"],
    icon: PieChart
  },
  "approval": {
    title: "Approval Workflow",
    features: ["Expense Approval", "Multi-Level Approval"],
    accounts: ["Pending Approval Accounts"],
    icon: Timer
  },
  "search": {
    title: "Search & Analytics",
    features: ["Global Search", "Financial Analytics", "AI Insights"],
    accounts: ["Search Metric Accounts"],
    icon: Search
  }
};

export default function AtlasModulePage() {
  const { moduleId } = useParams();
  const data = moduleId ? moduleData[moduleId] : null;

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground italic">Module not found.</p>
      </div>
    );
  }

  return <AtlasModule {...data} />;
}
