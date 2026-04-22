import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, FileText } from "lucide-react";
import { getEmployeePayroll } from "../lib/api";

interface Payroll {
  _id: string;
  payPeriod: string;
  gross: number;
  net: number;
  taxes: number;
  deductions: number;
  pdfUrl: string;
}

export default function EmployeePayroll() {
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
   
    loadPayroll();
  }, []);

   const loadPayroll = async () => {
      try {
        const res = await getEmployeePayroll();
        setPayroll(res.items || []);
      } catch (err) {
        console.error("Failed to load payroll:", err);
      } finally {
        setLoading(false);
      }
    };

  const filtered = payroll.filter((p) =>
    p.payPeriod.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (url: string) => {
    window.open(url, "_blank"); // S3 pre-signed URL
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p>Loading payroll...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Payroll</h1>
        <Badge variant="outline">{payroll.length} records</Badge>
      </div>

      {/* SEARCH */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by pay period..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>


      <div className="space-y-6">

  {/* HEADER */}

  {/* SEARCH */}

  {/* ✅ ADD SUMMARY CARDS HERE */}
  <div className="grid grid-cols-2 gap-4">
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">Total Earnings</p>
        <p className="text-xl font-bold">
          ${payroll.reduce((s, p) => s + p.net, 0)}
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-gray-500">Total Taxes</p>
        <p className="text-xl font-bold text-red-500">
          ${payroll.reduce((s, p) => s + p.taxes, 0)}
        </p>
      </CardContent>
    </Card>
  </div>

  {/* PAYROLL LIST */}

</div>


      {/* PAYROLL LIST */}
      <Card>
        <CardHeader>
          <CardTitle>Pay History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                    <FileText className="mx-auto h-10 w-10 opacity-30 mb-2" />
                    <p>No payroll records found</p>

                    <Button
                    className="mt-3"
                    onClick={loadPayroll}
                    >
                    Refresh 
                    </Button>
                </div>
                ) : (
            <div className="divide-y">
              {filtered.map((p) => (
                <div
                  key={p._id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold">{p.payPeriod}</h3>

                    <div className="text-sm text-gray-500 space-y-1 mt-1">
                      <p>Gross: ${p.gross}</p>
                      <p>Net: ${p.net}</p>
                      <p>Taxes: ${p.taxes}</p>
                      <p>Deductions: ${p.deductions}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <Badge className="bg-green-100 text-green-700">
                      Paid
                    </Badge>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(p.pdfUrl)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Payslip
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}