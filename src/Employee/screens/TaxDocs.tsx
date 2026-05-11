import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Filter } from "lucide-react";
import { getEmployeeTaxDocs, employeeApiFetch } from "../lib/api";

interface TaxDoc {
  id: string;
  year: number;
  type: string;
  fileUrl: string;
}

interface TaxYears {
  years: number[];
}

export default function TaxDocs() {
  const [docs, setDocs] = useState<TaxDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [docType, setDocType] = useState<string>("all");
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, yearsRes] = await Promise.all([
        getEmployeeTaxDocs(),
        employeeApiFetch<TaxYears>("/api/employees/me/tax-docs/years").catch(() => ({ years: [] }))
      ]);
      setDocs(docsRes.items || []);
      setAvailableYears(yearsRes.years || []);
    } catch (err) {
      console.error("Failed to load tax docs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = docs.filter(d => {
    const yearMatch = selectedYear === "all" || d.year.toString() === selectedYear;
    const typeMatch = docType === "all" || d.type === docType;
    return yearMatch && typeMatch;
  });

  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tax Documents</h1>
          <p className="text-sm text-muted-foreground">Download your W-2 and 1099 forms</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <select
              className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {availableYears.length > 0 ? (
                availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))
              ) : (
                Array.from({ length: 5 }, (_, i) => currentYear - i).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))
              )}
            </select>
            <select
              className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="W-2">W-2</option>
              <option value="1099">1099</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents {filtered.length > 0 && <Badge variant="secondary">{filtered.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tax documents found for the selected filters
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(doc => (
                <div key={doc.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.type}</p>
                      <p className="text-sm text-muted-foreground">Tax Year {doc.year}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.open(doc.fileUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}