import React, { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AtlasBooksProvider } from "../contexts/AtlasBooksContext";
import { AtlasBooksLayout } from "../components/atlasbooks/AtlasBooksLayout";

// Lazy-loaded pages for code-splitting and sub-2-second loads
const CommandCenter = lazy(() => import("../pages/atlasbooks/CommandCenter"));

// Financials
const ProfitAndLoss = lazy(() => import("../pages/atlasbooks/financials/ProfitAndLoss"));
const BalanceSheet = lazy(() => import("../pages/atlasbooks/financials/BalanceSheet"));
const CashFlow = lazy(() => import("../pages/atlasbooks/financials/CashFlow"));
const BudgetVsActual = lazy(() => import("../pages/atlasbooks/financials/BudgetVsActual"));
const Forecasting = lazy(() => import("../pages/atlasbooks/financials/Forecasting"));
const ConsolidatedStatements = lazy(() => import("../pages/atlasbooks/financials/ConsolidatedStatements"));

// Operations
const Payroll = lazy(() => import("../pages/atlasbooks/operations/Payroll"));
const Vendors = lazy(() => import("../pages/atlasbooks/operations/Vendors"));
const Expenses = lazy(() => import("../pages/atlasbooks/operations/Expenses"));
const Assets = lazy(() => import("../pages/atlasbooks/operations/Assets"));
const Approvals = lazy(() => import("../pages/atlasbooks/operations/Approvals"));

// Properties
const PropertiesList = lazy(() => import("../pages/atlasbooks/properties/PropertiesList"));
const UnitsList = lazy(() => import("../pages/atlasbooks/properties/UnitsList"));
const Occupancy = lazy(() => import("../pages/atlasbooks/properties/Occupancy"));
const NOI = lazy(() => import("../pages/atlasbooks/properties/NOI"));
const MaintenanceCosts = lazy(() => import("../pages/atlasbooks/properties/MaintenanceCosts"));
const TitleMonitoring = lazy(() => import("../pages/atlasbooks/properties/TitleMonitoring"));

// Monitoring
const FraudAnalytics = lazy(() => import("../pages/atlasbooks/monitoring/FraudAnalytics"));
const CreditMonitoring = lazy(() => import("../pages/atlasbooks/monitoring/CreditMonitoring"));
const TitleAlerts = lazy(() => import("../pages/atlasbooks/monitoring/TitleAlerts"));
const LienAlerts = lazy(() => import("../pages/atlasbooks/monitoring/LienAlerts"));
const CashAlerts = lazy(() => import("../pages/atlasbooks/monitoring/CashAlerts"));
const AnomalyDetection = lazy(() => import("../pages/atlasbooks/monitoring/AnomalyDetection"));

// AtlasPulse
const DuplicatePayments = lazy(() => import("../pages/atlasbooks/pulse/DuplicatePayments"));
const MissingReceipts = lazy(() => import("../pages/atlasbooks/pulse/MissingReceipts"));
const VendorAnomalies = lazy(() => import("../pages/atlasbooks/pulse/VendorAnomalies"));
const CashDeclines = lazy(() => import("../pages/atlasbooks/pulse/CashDeclines"));
const CreditChanges = lazy(() => import("../pages/atlasbooks/pulse/CreditChanges"));
const NewLiens = lazy(() => import("../pages/atlasbooks/pulse/NewLiens"));

const PageLoader = () => (
  <div className="flex items-center justify-center h-[50vh] bg-transparent">
    <div className="w-8 h-8 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
  </div>
);

const AtlasBooksRoutes: React.FC = () => {
  return (
    <AtlasBooksProvider>
      <Suspense fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a0f" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "#D4AF37", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <Routes>
          <Route element={<AtlasBooksLayout />}>
            <Route index element={<Navigate to="executive-snapshot" replace />} />
            
            {/* Core Command Dashboard */}
            <Route path="executive-snapshot" element={<Suspense fallback={<PageLoader />}><CommandCenter /></Suspense>} />

            {/* Financial Screens */}
            <Route path="financials/p-and-l" element={<Suspense fallback={<PageLoader />}><ProfitAndLoss /></Suspense>} />
            <Route path="financials/balance-sheet" element={<Suspense fallback={<PageLoader />}><BalanceSheet /></Suspense>} />
            <Route path="financials/cash-flow" element={<Suspense fallback={<PageLoader />}><CashFlow /></Suspense>} />
            <Route path="financials/budget-vs-actual" element={<Suspense fallback={<PageLoader />}><BudgetVsActual /></Suspense>} />
            <Route path="financials/forecasting" element={<Suspense fallback={<PageLoader />}><Forecasting /></Suspense>} />
            <Route path="financials/consolidated-statements" element={<Suspense fallback={<PageLoader />}><ConsolidatedStatements /></Suspense>} />

            {/* Operations Screens */}
            <Route path="operations/payroll" element={<Suspense fallback={<PageLoader />}><Payroll /></Suspense>} />
            <Route path="operations/vendors" element={<Suspense fallback={<PageLoader />}><Vendors /></Suspense>} />
            <Route path="operations/expenses" element={<Suspense fallback={<PageLoader />}><Expenses /></Suspense>} />
            <Route path="operations/assets" element={<Suspense fallback={<PageLoader />}><Assets /></Suspense>} />
            <Route path="operations/approvals" element={<Suspense fallback={<PageLoader />}><Approvals /></Suspense>} />

            {/* Property Screens */}
            <Route path="properties/list" element={<Suspense fallback={<PageLoader />}><PropertiesList /></Suspense>} />
            <Route path="properties/units" element={<Suspense fallback={<PageLoader />}><UnitsList /></Suspense>} />
            <Route path="properties/occupancy" element={<Suspense fallback={<PageLoader />}><Occupancy /></Suspense>} />
            <Route path="properties/noi" element={<Suspense fallback={<PageLoader />}><NOI /></Suspense>} />
            <Route path="properties/maintenance" element={<Suspense fallback={<PageLoader />}><MaintenanceCosts /></Suspense>} />
            <Route path="properties/title-monitoring" element={<Suspense fallback={<PageLoader />}><TitleMonitoring /></Suspense>} />

            {/* Monitoring Screens */}
            <Route path="monitoring/fraud" element={<Suspense fallback={<PageLoader />}><FraudAnalytics /></Suspense>} />
            <Route path="monitoring/credit" element={<Suspense fallback={<PageLoader />}><CreditMonitoring /></Suspense>} />
            <Route path="monitoring/title-alerts" element={<Suspense fallback={<PageLoader />}><TitleAlerts /></Suspense>} />
            <Route path="monitoring/lien-alerts" element={<Suspense fallback={<PageLoader />}><LienAlerts /></Suspense>} />
            <Route path="monitoring/cash-alerts" element={<Suspense fallback={<PageLoader />}><CashAlerts /></Suspense>} />
            <Route path="monitoring/anomaly" element={<Suspense fallback={<PageLoader />}><AnomalyDetection /></Suspense>} />

            {/* AtlasPulse Alerts */}
            <Route path="pulse/duplicate-payments" element={<Suspense fallback={<PageLoader />}><DuplicatePayments /></Suspense>} />
            <Route path="pulse/missing-receipts" element={<Suspense fallback={<PageLoader />}><MissingReceipts /></Suspense>} />
            <Route path="pulse/vendor-anomalies" element={<Suspense fallback={<PageLoader />}><VendorAnomalies /></Suspense>} />
            <Route path="pulse/cash-declines" element={<Suspense fallback={<PageLoader />}><CashDeclines /></Suspense>} />
            <Route path="pulse/credit-changes" element={<Suspense fallback={<PageLoader />}><CreditChanges /></Suspense>} />
            <Route path="pulse/new-liens" element={<Suspense fallback={<PageLoader />}><NewLiens /></Suspense>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="executive-snapshot" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </AtlasBooksProvider>
  );
};

export default AtlasBooksRoutes;
