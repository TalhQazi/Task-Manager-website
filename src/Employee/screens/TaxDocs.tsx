import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getEmployeeTaxDocs } from "../lib/api";

interface TaxDoc {
  id: string;
  year: number;
  type: string;
  fileUrl: string;
}

export default function TaxDocs() {
  const [docs, setDocs] = useState<TaxDoc[]>([]);
  const [year, setYear] = useState("all");

  useEffect(() => {
    getEmployeeTaxDocs().then((res) => setDocs(res.items || []));
  }, []);

  const filtered = year === "all" ? docs : docs.filter(d => d.year.toString() === year);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <select onChange={(e) => setYear(e.target.value)}>
          <option value="all">All Years</option>
          {[...new Set(docs.map(d => d.year))].map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>

          {filtered.length === 0 && (
            <div className="text-center py-6 text-gray-500">
                No documents uploaded yet
            </div>
            )}
        {filtered.map(doc => (
          <div key={doc.id} className="flex justify-between p-3 border-b">
            <div>{doc.type} - {doc.year}</div>
            <Button onClick={() => window.open(doc.fileUrl)}>
              Download
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}