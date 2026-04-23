import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/manger/ui/card";
import { Badge } from "@/components/manger/ui/badge";
import { Button } from "@/components/manger/ui/button";
import { Clock, DollarSign, TrendingUp, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { apiFetch } from "@/lib/manger/api";

interface TimeEntry {
  id: string;
  employee: string;
  employeeId?: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  status: "clocked-in" | "clocked-out" | "on-break";
}

interface EmployeeProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company?: string;
  location?: string;
  status?: string;
  payType?: "hourly" | "monthly" | string;
  payRate?: string;
  [key: string]: any;
}

// Helper functions
function parsePayRate(rate: string): number {
  const match = String(rate).match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseMinutes(hhmm: string) {
  const [h, m] = String(hhmm || "").split(":").map((x) => Number(x));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function calcHoursWorked(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  const inMin = parseMinutes(clockIn);
  const outMin = parseMinutes(clockOut);
  if (inMin === null || outMin === null) return 0;
  const diff = outMin - inMin;
  return diff > 0 ? diff / 60 : 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function getMonthName(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function Payroll() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadData = async () => {
    try {
      setLoading(true);
      const profileRes = await apiFetch<{ item: EmployeeProfile }>("/api/employees/me");
      console.log("Employee profile from API:", profileRes.item);
      console.log("PayRate field:", profileRes.item.payRate);
      console.log("PayType field:", profileRes.item.payType);
      setEmployeeProfile(profileRes.item);
    } catch (err) {
      console.error("Failed to load employee data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeEntries = async () => {
    if (!employeeProfile) return;
    
    try {
      const res = await apiFetch<{ success: boolean; items: TimeEntry[] }>(
        "/api/employees/me/time-entry/history"
      );
      const allEntries = res.items || [];
      
      console.log("All time entries from API:", allEntries);
      
      // Filter entries for current month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
      
      console.log("Current month filter:", {
        currentMonth: currentMonth.toISOString(),
        year,
        month,
        startOfMonth: startOfMonth.toISOString(),
        endOfMonth: endOfMonth.toISOString()
      });
      
      const monthEntries = allEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        console.log(`Entry date check: ${entry.date} -> ${entryDate.toISOString()}, in range: ${entryDate >= startOfMonth && entryDate <= endOfMonth}`);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });
      
      console.log("Filtered month entries:", monthEntries);
      setTimeEntries(monthEntries);
    } catch (err) {
      console.error("Failed to load time entries:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (employeeProfile) {
      loadTimeEntries();
    }
  }, [employeeProfile, currentMonth]);

  const calculatedPayroll = useMemo(() => {
    if (!employeeProfile) return null;

    console.log("Time entries:", timeEntries);
    console.log("Employee profile:", employeeProfile);

    const totalHours = timeEntries.reduce((sum, entry) => {
      const hours = calcHoursWorked(entry.clockIn, entry.clockOut);
      console.log(`Entry ${entry.id}: clockIn=${entry.clockIn}, clockOut=${entry.clockOut}, hours=${hours}`);
      return sum + hours;
    }, 0);

    console.log("Total hours:", totalHours);

    const isMonthly = employeeProfile.payType === "monthly";
    const payRateValue = parsePayRate(employeeProfile.payRate || "0");
    
    console.log("Pay type:", isMonthly ? "monthly" : "hourly");
    console.log("Pay rate value:", payRateValue);
    
    let regularHours = 0;
    let overtimeHours = 0;
    let regularPay = 0;
    let overtimePay = 0;
    let totalPay = 0;
    let hourlyRate = 0;
    let monthlySalary = 0;

    if (isMonthly) {
      // Fixed salary employee
      monthlySalary = payRateValue;
      hourlyRate = payRateValue / 160; // For display purposes
      regularHours = totalHours;
      regularPay = monthlySalary;
      overtimeHours = 0;
      overtimePay = 0;
      totalPay = monthlySalary;
    } else {
      // Hourly employee
      hourlyRate = payRateValue;
      regularHours = Math.min(totalHours, 160);
      overtimeHours = Math.max(0, totalHours - 160);
      const overtimeRate = hourlyRate * 1.5;
      regularPay = regularHours * hourlyRate;
      overtimePay = overtimeHours * overtimeRate;
      totalPay = regularPay + overtimePay;
    }

    // Tax deductions (US standard rates)
    const federalTax = totalPay * 0.12; // ~12% federal tax
    const stateTax = totalPay * 0.05; // ~5% state tax
    const socialSecurity = totalPay * 0.062; // 6.2% Social Security
    const medicare = totalPay * 0.0145; // 1.45% Medicare
    const totalDeductions = federalTax + stateTax + socialSecurity + medicare;
    const netPay = totalPay - totalDeductions;

    console.log("Calculated payroll:", {
      totalHours,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      totalPay,
      hourlyRate,
    });

    return {
      totalHours,
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      totalPay,
      hourlyRate,
      isMonthly,
      monthlySalary,
      federalTax,
      stateTax,
      socialSecurity,
      medicare,
      totalDeductions,
      netPay,
    };
  }, [employeeProfile, timeEntries]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="ml-12 pl-6 p-6 text-center">
        <p>Loading payroll...</p>
      </div>
    );
  }

  return (
    <div className="ml-12 pl-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Payroll</h1>
          <p className="text-sm text-muted-foreground">Track your earnings and hours</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Badge variant="outline" className="px-4 py-2">
            {getMonthName(currentMonth)}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {calculatedPayroll && (
            <Button onClick={handleExportPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {calculatedPayroll && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <p className="text-xl font-bold">{formatHours(calculatedPayroll.totalHours)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Regular Hours</p>
              </div>
              <p className="text-xl font-bold">{formatHours(calculatedPayroll.regularHours)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-muted-foreground">Overtime Hours</p>
              </div>
              <p className="text-xl font-bold text-orange-600">{formatHours(calculatedPayroll.overtimeHours)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Total Pay</p>
              </div>
              <p className="text-xl font-bold text-green-600">{formatCurrency(calculatedPayroll.totalPay)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BREAKDOWN */}
      {calculatedPayroll && (
        <Card>
          <CardHeader>
            <CardTitle>Pay Breakdown - {getMonthName(currentMonth)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pay Type</span>
                <Badge variant={calculatedPayroll.isMonthly ? "default" : "secondary"}>
                  {calculatedPayroll.isMonthly ? "Monthly" : "Hourly"}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">{formatCurrency(calculatedPayroll.hourlyRate)}/hr</span>
              </div>
              {calculatedPayroll.isMonthly && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Monthly Salary</span>
                  <span className="font-medium">{formatCurrency(calculatedPayroll.monthlySalary)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Regular Pay</span>
                <span className="font-medium">{formatCurrency(calculatedPayroll.regularPay)}</span>
              </div>
              {calculatedPayroll.overtimePay > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Overtime Pay (1.5x)</span>
                  <span className="font-medium text-orange-600">{formatCurrency(calculatedPayroll.overtimePay)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total Pay</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(calculatedPayroll.totalPay)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAX DEDUCTIONS */}
      {calculatedPayroll && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Deductions - {getMonthName(currentMonth)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Federal Tax (12%)</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculatedPayroll.federalTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">State Tax (5%)</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculatedPayroll.stateTax)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Social Security (6.2%)</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculatedPayroll.socialSecurity)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Medicare (1.45%)</span>
                <span className="font-medium text-red-600">-{formatCurrency(calculatedPayroll.medicare)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total Deductions</span>
                <span className="font-bold text-red-600">{formatCurrency(calculatedPayroll.totalDeductions)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold text-lg">Net Pay</span>
                <span className="font-bold text-green-600 text-xl">{formatCurrency(calculatedPayroll.netPay)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!calculatedPayroll && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No time entries found for this month</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
