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

export const mockEntityHierarchy: EntityNode = {
  id: "holding-default",
  name: "Default Holding Company",
  level: "holding",
  children: [
    {
      id: "company-default",
      name: "Default Company",
      level: "company",
      parentId: "holding-default",
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
const baseStatsMap: Record<string, FinancialStats> = {};

const defaultStats: FinancialStats = {
  revenueToday: 0,
  revenueMtd: 0,
  revenueYtd: 0,
  expensesMtd: 0,
  netProfit: 0,
  cashPosition: 0,
  accountsReceivable: 0,
  accountsPayable: 0,
  integrityScore: 100,
  creditScore: 0
};

const initialAlerts: PulseAlert[] = [];

const AtlasBooksContext = createContext<AtlasBooksContextType | undefined>(undefined);

export const AtlasBooksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeEntity, setActiveEntity] = useState<EntityNode>(mockEntityHierarchy);
  const [activeRole, setActiveRole] = useState<UserRole>("Executive");
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("Monthly");
  const [liveEventStream, setLiveEventStream] = useState<PulseAlert[]>(initialAlerts);
  const [stats, setStats] = useState<FinancialStats>(defaultStats);

  // Build the current list path from Root down to Selected Entity
  const [entityHierarchy, setEntityHierarchy] = useState<EntityNode[]>([mockEntityHierarchy]);

  const selectEntity = useCallback((id: string) => {
    const node = findNodeById(mockEntityHierarchy, id);
    if (node) {
      setActiveEntity(node);
      const path = buildPathToNode(mockEntityHierarchy, id);
      if (path) setEntityHierarchy(path);

      // Pull base stats from map or compute dynamic ones
      const baseStats = baseStatsMap[id] || defaultStats;
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
    // Mock alerts disabled
  }, [activeEntity]);

  // Set up the background simulated ticker interval to refresh metrics/push pulses
  useEffect(() => {
    // Disabled mock intervals
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
