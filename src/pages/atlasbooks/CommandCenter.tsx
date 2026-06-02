import React, { useState } from "react";
import { useAtlasBooks } from "../../contexts/AtlasBooksContext";
import { KpiCard } from "../../components/atlasbooks/KpiCard";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { 
  DollarSign, Landmark, TrendingUp, Wallet, 
  FileDown, ChevronDown, CheckSquare, Square, AlertCircle
} from "lucide-react";

interface TransactionRow {
  label: string;
  value: string;
}

interface VendorRow {
  name: string;
  amount: string;
}

interface TaskItem {
  id: string;
  label: string;
  checked: boolean;
}

const CommandCenter: React.FC = () => {
  const { timeframe, activeEntity } = useAtlasBooks();
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "T1", label: "Review Lease Agreements", checked: true },
    { id: "T2", label: "Approve Invoices", checked: true },
    { id: "T3", label: "Schedule Property Inspection", checked: true }
  ]);

  const toggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  // Mock data for the exact Cash Flow Composed Chart
  const cashFlowData = [
    { name: "Jan", Income: 220, Expenses: 180, NetCashFlow: 140 },
    { name: "Jan", Income: 480, Expenses: 220, NetCashFlow: 230 },
    { name: "May", Income: 580, Expenses: 320, NetCashFlow: 190 },
    { name: "Man", Income: 620, Expenses: 480, NetCashFlow: 380 },
    { name: "Jun", Income: 720, Expenses: 510, NetCashFlow: 280 },
    { name: "Jun", Income: 900, Expenses: 440, NetCashFlow: 360 },
    { name: "Jul", Income: 980, Expenses: 550, NetCashFlow: 540 }
  ];

  // Property Heatmap Matrix data (mockup uses colored cells)
  const heatmapRows = [
    { name: "Properties A", cells: ["bg-emerald-600", "bg-emerald-600", "bg-yellow-400", "bg-lime-400", "bg-emerald-600", "bg-emerald-700"] },
    { name: "Properties B", cells: ["bg-emerald-600", "bg-lime-500", "bg-rose-600", "bg-amber-500", "bg-amber-500", "bg-rose-500"] },
    { name: "Properties C", cells: ["bg-emerald-600", "bg-lime-400", "bg-amber-500", "bg-amber-500", "bg-rose-600", "bg-rose-500"] },
    { name: "Properties D", cells: ["bg-emerald-600", "bg-lime-500", "bg-emerald-600", "bg-emerald-600", "bg-rose-600", "bg-rose-600"] },
    { name: "Properties E", cells: ["bg-[#1b5e20]", "bg-emerald-600", "bg-emerald-600", "bg-emerald-700", "bg-emerald-600", "bg-emerald-700"] }
  ];

  const transactions: TransactionRow[] = [
    { label: "Rent Received", value: "$1,200" },
    { label: "Office Supplies", value: "$3,000" },
    { label: "Maintenance Fee", value: "$2,800" },
    { label: "Legal Consulting", value: "$2,800" }
  ];

  const vendors: VendorRow[] = [
    { name: "Home Depot", amount: "$4,500" },
    { name: "Staples", amount: "$3,200" },
    { name: "ABC Plumbing", amount: "$2,800" },
    { name: "Direct Utilities", amount: "$2,800" }
  ];

  return (
    <div className="space-y-6">
      
      {/* 4 Mockup KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Company Balance"
          value="$1,250,750"
          subtitle={`Scope: ${activeEntity.name}`}
        />
        <KpiCard
          title="Monthly Income"
          value="$85,420"
          subtitle="Cleared revenue deposits"
        />
        <KpiCard
          title="Monthly Expenses"
          value="$42,350"
          subtitle="Operating overhead burns"
        />
        <KpiCard
          title="Occupancy Rate"
          value="92%"
          trend={{ value: "+2.4%", isPositive: true }}
          subtitle="Lease rollover check"
        />
      </div>

      {/* Row 2: Charts (Cash Flow Composed Chart + Property Heatmap Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Chart Box: Cash Flow Overview Composed */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#2c3e50] tracking-wide">
              Cash Flow Overview
            </h3>
            <span className="text-[10px] font-mono bg-zinc-100 text-zinc-650 px-2 py-0.5 rounded uppercase">
              {timeframe}
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashFlowData} margin={{ top: 10, right: -5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#cbd5e1", borderRadius: "8px" }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Income" fill="#2e7d32" name="Income" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Expenses" fill="#e65100" name="Expenses" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="NetCashFlow" name="Net Cash Flow" stroke="#fbc02d" strokeWidth={3} dot={{ fill: "#fbc02d", r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart Box: Property Performance Heatmap Matrix */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-sm font-extrabold text-[#2c3e50] tracking-wide">
              Property Performance
            </h3>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
              Leased
            </span>
          </div>
          
          <div className="space-y-3.5">
            {heatmapRows.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between space-x-4">
                <span className="text-xs font-bold text-[#34495e] w-24 truncate">{row.name}</span>
                <div className="flex-1 grid grid-cols-6 gap-2">
                  {row.cells.map((cellClass, cIdx) => (
                    <div 
                      key={cIdx} 
                      className={`h-8 rounded-md transition-all duration-300 hover:scale-105 shadow-inner ${cellClass}`}
                      title="Occupancy heat index check"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-3.5 text-[9px] font-mono text-zinc-500 border-t border-zinc-100">
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded" /> <span>90%+</span></div>
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-yellow-450 rounded" /> <span>80%+</span></div>
            <div className="flex items-center space-x-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded" /> <span>&lt;75%</span></div>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom 4 Column Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Col 1: Recent Transactions */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <h4 className="text-xs font-black text-[#2c3e50] uppercase tracking-wider border-b border-zinc-100 pb-2.5 flex items-center justify-between">
            <span>Recent Transactions</span>
            <CheckSquare className="w-3.5 h-3.5 text-[#34495e]" />
          </h4>
          <div className="space-y-3 font-mono text-xs">
            {transactions.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5 border-b border-zinc-50 last:border-0">
                <span className="text-zinc-600">{tx.label}</span>
                <span className="font-bold text-[#1e293b]">{tx.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Top Vendors */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <h4 className="text-xs font-black text-[#2c3e50] uppercase tracking-wider border-b border-zinc-100 pb-2.5 flex items-center justify-between">
            <span>Top Vendors</span>
            <Landmark className="w-3.5 h-3.5 text-[#34495e]" />
          </h4>
          <div className="space-y-3 font-mono text-xs">
            {vendors.map((vendor, idx) => (
              <div key={idx} className="flex justify-between items-center py-0.5 border-b border-zinc-50 last:border-0">
                <span className="text-zinc-600">{vendor.name}</span>
                <span className="font-bold text-[#1e293b]">{vendor.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3: Financial Alerts */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <h4 className="text-xs font-black text-[#2c3e50] uppercase tracking-wider border-b border-zinc-100 pb-2.5 flex items-center justify-between">
            <span>Financial Alerts</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </h4>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg">
              <span>Over Budget Alert</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
            <div className="flex justify-between items-center p-2.5 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg">
              <span>Late Payment Warning</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Col 4: Task Manager checkboxes */}
        <div className="bg-white border border-[#c9d4e2] rounded-xl p-5 shadow-[0_4px_6px_rgba(200,210,225,0.3)] space-y-4">
          <h4 className="text-xs font-black text-[#2c3e50] uppercase tracking-wider border-b border-zinc-100 pb-2.5 flex items-center justify-between">
            <span>Task Manager</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
          </h4>
          <div className="space-y-2.5 text-xs">
            {tasks.map((task) => (
              <button 
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center justify-between text-left text-[#34495e] hover:text-[#111827] py-1 border-b border-zinc-50 last:border-0"
              >
                <span>{task.label}</span>
                {task.checked ? (
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-400" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommandCenter;
