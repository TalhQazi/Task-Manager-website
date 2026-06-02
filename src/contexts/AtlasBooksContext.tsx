import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type EntityLevel = "holding" | "company" | "location" | "department" | "unit";

export interface EntityNode {
  id: string;
  name: string;
  level: EntityLevel;
  parentId?: string;
  children?: EntityNode[];
}

export type UserRole = "Executive" | "Auditor" | "Accountant" | "PropertyManager";
export type ChartTimeframe = "Daily" | "Monthly" | "Quarterly" | "Yearly";

export interface PulseAlert {
  id: string;
  timestamp: Date;
  type: "duplicate_payment" | "missing_receipt" | "vendor_anomaly" | "cash_decline" | "credit_change" | "new_lien" | "system";
  severity: "info" | "warning" | "critical";
  message: string;
  entityName: string;
  resolved: boolean;
  value?: string;
}

export interface FinancialStats {
  revenueToday: number;
  revenueMtd: number;
  revenueYtd: number;
  expensesMtd: number;
  netProfit: number;
  cashPosition: number;
  accountsReceivable: number;
  accountsPayable: number;
  integrityScore: number;
  creditScore: number;
}

interface AtlasBooksContextType {
  activeEntity: EntityNode;
  entities: EntityNode;
  activeRole: UserRole;
  timeframe: ChartTimeframe;
  liveEventStream: PulseAlert[];
  stats: FinancialStats;
  entityHierarchy: EntityNode[];
  selectEntity: (id: string) => void;
  updateRole: (role: UserRole) => void;
  updateTimeframe: (timeframe: ChartTimeframe) => void;
  triggerMockPulseAlert: (type?: string) => void;
  resolveAlert: (id: string) => void;
}

// Full entity hierarchy structure matching Holding -> Company -> Location -> Department -> Unit
export const mockEntityHierarchy: EntityNode = {
  id: "holding-01",
  name: "Atlas Global Holdings",
  level: "holding",
  children: [
    {
      id: "company-01",
      name: "Atlas Enterprises Tech",
      level: "company",
      parentId: "holding-01",
      children: [
        {
          id: "loc-ny",
          name: "New York HQ",
          level: "location",
          parentId: "company-01",
          children: [
            {
              id: "dept-eng",
              name: "Software Engineering",
              level: "department",
              parentId: "loc-ny",
              children: [
                { id: "unit-saas", name: "SaaS Dev Team", level: "unit", parentId: "dept-eng" },
                { id: "unit-infra", name: "Cloud Infrastructure", level: "unit", parentId: "dept-eng" }
              ]
            },
            {
              id: "dept-sales",
              name: "Enterprise Sales",
              level: "department",
              parentId: "loc-ny",
              children: [
                { id: "unit-sales-us", name: "US West / East", level: "unit", parentId: "dept-sales" }
              ]
            }
          ]
        },
        {
          id: "loc-sf",
          name: "San Francisco R&D",
          level: "location",
          parentId: "company-01",
          children: [
            {
              id: "dept-ai",
              name: "Artificial Intelligence",
              level: "department",
              parentId: "loc-sf",
              children: [
                { id: "unit-llm", name: "Model Training", level: "unit", parentId: "dept-ai" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "company-02",
      name: "Atlas Properties LLC",
      level: "company",
      parentId: "holding-01",
      children: [
        {
          id: "loc-miami",
          name: "Miami Division",
          level: "location",
          parentId: "company-02",
          children: [
            {
              id: "dept-res",
              name: "Residential Portfolios",
              level: "department",
              parentId: "loc-miami",
              children: [
                { id: "unit-blue-tower", name: "Blue Water Condos", level: "unit", parentId: "dept-res" },
                { id: "unit-sand-villas", name: "Sandcastle Villas", level: "unit", parentId: "dept-res" }
              ]
            },
            {
              id: "dept-maint",
              name: "Operations & Repairs",
              level: "department",
              parentId: "loc-miami",
              children: [
                { id: "unit-field-ops", name: "Field Technicians", level: "unit", parentId: "dept-maint" }
              ]
            }
          ]
        },
        {
          id: "loc-la",
          name: "Los Angeles Division",
          level: "location",
          parentId: "company-02",
          children: [
            {
              id: "dept-comm",
              name: "Commercial Office Spaces",
              level: "department",
              parentId: "loc-la",
              children: [
                { id: "unit-dtla-plaza", name: "DTLA Center Plaza", level: "unit", parentId: "dept-comm" }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Flatten utility to search for entity node by ID
const findNodeById = (node: EntityNode, id: string): EntityNode | null => {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

// Path builder utility for breadcrumbs
const buildPathToNode = (node: EntityNode, targetId: string, currentPath: EntityNode[] = []): EntityNode[] | null => {
  const path = [...currentPath, node];
  if (node.id === targetId) return path;
  if (node.children) {
    for (const child of node.children) {
      const result = buildPathToNode(child, targetId, path);
      if (result) return result;
    }
  }
  return null;
};

// Base baseline financial configurations per entity level (for generating realistic but mock data)
const baseStatsMap: Record<string, FinancialStats> = {
  "holding-01": {
    revenueToday: 184500,
    revenueMtd: 5420900,
    revenueYtd: 65120300,
    expensesMtd: 3105400,
    netProfit: 2315500,
    cashPosition: 24500000,
    accountsReceivable: 4120000,
    accountsPayable: 1850000,
    integrityScore: 98,
    creditScore: 815
  },
  "company-01": {
    revenueToday: 112000,
    revenueMtd: 3340000,
    revenueYtd: 39500000,
    expensesMtd: 1890000,
    netProfit: 1450000,
    cashPosition: 14200000,
    accountsReceivable: 2500000,
    accountsPayable: 950000,
    integrityScore: 99,
    creditScore: 820
  },
  "company-02": {
    revenueToday: 72500,
    revenueMtd: 2080900,
    revenueYtd: 25620300,
    expensesMtd: 1215400,
    netProfit: 865500,
    cashPosition: 10300000,
    accountsReceivable: 1620000,
    accountsPayable: 900000,
    integrityScore: 96,
    creditScore: 805
  },
  "loc-ny": {
    revenueToday: 78000,
    revenueMtd: 2280000,
    revenueYtd: 27100000,
    expensesMtd: 1250000,
    netProfit: 1030000,
    cashPosition: 9100000,
    accountsReceivable: 1700000,
    accountsPayable: 610000,
    integrityScore: 99,
    creditScore: 810
  },
  "loc-sf": {
    revenueToday: 34000,
    revenueMtd: 1060000,
    revenueYtd: 12400000,
    expensesMtd: 640000,
    netProfit: 420000,
    cashPosition: 5100000,
    accountsReceivable: 800000,
    accountsPayable: 340000,
    integrityScore: 98,
    creditScore: 825
  },
  "loc-miami": {
    revenueToday: 49000,
    revenueMtd: 1410900,
    revenueYtd: 17320300,
    expensesMtd: 825400,
    netProfit: 585500,
    cashPosition: 6800000,
    accountsReceivable: 1100000,
    accountsPayable: 600000,
    integrityScore: 97,
    creditScore: 808
  },
  "loc-la": {
    revenueToday: 23500,
    revenueMtd: 670000,
    revenueYtd: 8300000,
    expensesMtd: 390000,
    netProfit: 280000,
    cashPosition: 3500000,
    accountsReceivable: 520000,
    accountsPayable: 300000,
    integrityScore: 95,
    creditScore: 802
  }
};

const defaultStats: FinancialStats = {
  revenueToday: 12400,
  revenueMtd: 340000,
  revenueYtd: 4100000,
  expensesMtd: 195000,
  netProfit: 145000,
  cashPosition: 1200000,
  accountsReceivable: 190000,
  accountsPayable: 110000,
  integrityScore: 95,
  creditScore: 780
};

const initialAlerts: PulseAlert[] = [
  {
    id: "alert-1",
    timestamp: new Date(Date.now() - 1000 * 60 * 12),
    type: "duplicate_payment",
    severity: "critical",
    message: "Potential duplicate checkout detected: invoice VND-9081 paid twice",
    entityName: "Atlas Enterprises Tech (NY)",
    resolved: false,
    value: "$4,250.00"
  },
  {
    id: "alert-2",
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    type: "missing_receipt",
    severity: "warning",
    message: "Missing receipt from corporate card: Uber ride expense by CTO",
    entityName: "San Francisco R&D",
    resolved: false,
    value: "$48.50"
  },
  {
    id: "alert-3",
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    type: "new_lien",
    severity: "critical",
    message: "New Mechanic's Lien filed against real estate asset",
    entityName: "Blue Water Condos (Miami)",
    resolved: false,
    value: "$18,500.00"
  },
  {
    id: "alert-4",
    timestamp: new Date(Date.now() - 1000 * 60 * 250),
    type: "cash_decline",
    severity: "warning",
    message: "Cash reserves dropped by more than 15% in commercial operations",
    entityName: "Los Angeles Division",
    resolved: false,
    value: "-$125,000"
  }
];

const AtlasBooksContext = createContext<AtlasBooksContextType | undefined>(undefined);

export const AtlasBooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEntity, setActiveEntity] = useState<EntityNode>(mockEntityHierarchy);
  const [activeRole, setActiveRole] = useState<UserRole>("Executive");
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("Monthly");
  const [liveEventStream, setLiveEventStream] = useState<PulseAlert[]>(initialAlerts);
  const [stats, setStats] = useState<FinancialStats>(baseStatsMap["holding-01"]);

  // Build the current list path from Root down to Selected Entity
  const [entityHierarchy, setEntityHierarchy] = useState<EntityNode[]>([mockEntityHierarchy]);

  const selectEntity = useCallback((id: string) => {
    const node = findNodeById(mockEntityHierarchy, id);
    if (node) {
      setActiveEntity(node);
      const path = buildPathToNode(mockEntityHierarchy, id);
      if (path) setEntityHierarchy(path);

      // Pull base stats from map or compute dynamic ones
      const baseStats = baseStatsMap[id] || {
        ...defaultStats,
        revenueToday: defaultStats.revenueToday * (node.level === "unit" ? 0.3 : 0.6),
        revenueMtd: defaultStats.revenueMtd * (node.level === "unit" ? 0.3 : 0.6),
        revenueYtd: defaultStats.revenueYtd * (node.level === "unit" ? 0.3 : 0.6),
        expensesMtd: defaultStats.expensesMtd * (node.level === "unit" ? 0.3 : 0.6),
        cashPosition: defaultStats.cashPosition * (node.level === "unit" ? 0.2 : 0.5),
        netProfit: (defaultStats.revenueMtd - defaultStats.expensesMtd) * (node.level === "unit" ? 0.3 : 0.6),
      };
      setStats(baseStats);
    }
  }, []);

  const updateRole = useCallback((role: UserRole) => {
    setActiveRole(role);
  }, []);

  const updateTimeframe = useCallback((tf: ChartTimeframe) => {
    setTimeframe(tf);
  }, []);

  const resolveAlert = useCallback((id: string) => {
    setLiveEventStream((prev) =>
      prev.map((alert) => (alert.id === id ? { ...alert, resolved: true } : alert))
    );
  }, []);

  // Actionable function to generate mock event ticks (simulated WebSocket feed)
  const triggerMockPulseAlert = useCallback((specificType?: string) => {
    const alertTypes: Array<PulseAlert["type"]> = [
      "duplicate_payment",
      "missing_receipt",
      "vendor_anomaly",
      "cash_decline",
      "credit_change",
      "new_lien"
    ];
    const type = (specificType || alertTypes[Math.floor(Math.random() * alertTypes.length)]) as PulseAlert["type"];

    let message = "";
    let severity: PulseAlert["severity"] = "warning";
    let value = "";
    let entityName = activeEntity.name;

    switch (type) {
      case "duplicate_payment":
        message = `Potential duplicate billing flagged on invoice #${Math.floor(Math.random() * 9000 + 1000)}`;
        severity = "critical";
        value = `$${(Math.random() * 5000 + 200).toFixed(2)}`;
        break;
      case "missing_receipt":
        message = "Missing transactional support receipt detected in latest card sync";
        severity = "info";
        value = `$${(Math.random() * 300 + 10).toFixed(2)}`;
        break;
      case "vendor_anomaly":
        message = "Alert: Banking wire instructions modified for vendor payout";
        severity = "critical";
        value = "MDF-BANK";
        break;
      case "cash_decline":
        message = "Cash position variance exceeded warning threshold of 10%";
        severity = "warning";
        value = "-$42,000";
        break;
      case "credit_change":
        message = "Fitch / D&B Credit Integrity Index shift registered";
        severity = "warning";
        value = "-15 pts";
        break;
      case "new_lien":
        message = "Warning: Cloud on title / new tax lien notification posted";
        severity = "critical";
        value = "Lien Ref #" + Math.floor(Math.random() * 8000 + 1000);
        break;
      default:
        message = "System parameters within operational standard guidelines";
        severity = "info";
    }

    const newAlert: PulseAlert = {
      id: `alert-${Date.now()}`,
      timestamp: new Date(),
      type,
      severity,
      message,
      entityName,
      resolved: false,
      value
    };

    setLiveEventStream((prev) => [newAlert, ...prev.slice(0, 19)]); // Keep last 20

    // Adjust stats slightly on alert to show real-time stream binding
    setStats((prev) => {
      const isNegative = severity === "critical" || severity === "warning";
      const factor = isNegative ? -0.015 : 0.01;
      const shift = 1 + (Math.random() * factor);
      return {
        ...prev,
        revenueToday: Math.round(prev.revenueToday * (1 + Math.random() * 0.005)),
        revenueMtd: Math.round(prev.revenueMtd + (isNegative ? -1200 : 2500)),
        cashPosition: Math.round(prev.cashPosition * shift),
        netProfit: Math.round(prev.netProfit * shift),
        integrityScore: Math.max(70, Math.min(100, prev.integrityScore + (isNegative ? -2 : 1)))
      };
    });
  }, [activeEntity]);

  // Set up the background simulated ticker interval to refresh metrics/push pulses
  useEffect(() => {
    const interval = setInterval(() => {
      // 25% chance of warning pulse trigger every 15 seconds
      if (Math.random() < 0.25) {
        triggerMockPulseAlert();
      } else {
        // Just fluctuate stats slightly to show "Sub-2-second loads & Real-time updates"
        setStats((prev) => ({
          ...prev,
          revenueToday: Math.round(prev.revenueToday + (Math.random() * 200 - 80)),
          cashPosition: Math.round(prev.cashPosition + (Math.random() * 1000 - 400)),
          revenueMtd: Math.round(prev.revenueMtd + (Math.random() * 200 - 50)),
        }));
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [triggerMockPulseAlert]);

  return (
    <AtlasBooksContext.Provider
      value={{
        activeEntity,
        entities: mockEntityHierarchy,
        activeRole,
        timeframe,
        liveEventStream,
        stats,
        entityHierarchy,
        selectEntity,
        updateRole,
        updateTimeframe,
        triggerMockPulseAlert,
        resolveAlert
      }}
    >
      {children}
    </AtlasBooksContext.Provider>
  );
};

export const useAtlasBooks = () => {
  const context = useContext(AtlasBooksContext);
  if (!context) {
    throw new Error("useAtlasBooks must be used within an AtlasBooksProvider");
  }
  return context;
};
