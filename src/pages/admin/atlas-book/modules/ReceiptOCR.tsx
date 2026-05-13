import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Badge } from "@/components/admin/ui/badge";
import { ScanLine, Upload, FileText, CheckCircle2, RefreshCw, X } from "lucide-react";

export default function ReceiptOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startScan = () => {
    setScanning(true);
    // Simulate OCR delay
    setTimeout(() => {
      setResults({
        vendor: "Amazon.com",
        date: "2024-05-10",
        total: 124.99,
        currency: "USD",
        items: [
          { desc: "Office Supplies", price: 89.99 },
          { desc: "Shipping", price: 35.00 }
        ]
      });
      setScanning(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ScanLine className="h-8 w-8 text-primary" />
            Receipt & OCR Module
          </h1>
          <p className="text-muted-foreground">Automate expense entry by scanning receipts with AI-powered OCR.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-soft border-dashed border-2 flex flex-col items-center justify-center py-20 text-center space-y-4 h-full">
          {file ? (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-2xl relative">
                <FileText className="h-20 w-20 text-primary mx-auto" />
                <button onClick={() => setFile(null)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"><X size={14} /></button>
              </div>
              <p className="font-medium">{file.name}</p>
              <Button onClick={startScan} disabled={scanning} className="w-full gap-2">
                {scanning ? <RefreshCw className="animate-spin" size={16} /> : <ScanLine size={16} />}
                {scanning ? "Scanning Receipt..." : "Start AI Scan"}
              </Button>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-full">
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Upload Receipt</h3>
                <p className="text-muted-foreground text-sm">Drag and drop or click to browse</p>
              </div>
              <Input type="file" className="hidden" id="receipt-upload" onChange={handleUpload} accept="image/*,application/pdf" />
              <Button asChild variant="outline">
                <label htmlFor="receipt-upload" className="cursor-pointer">Choose File</label>
              </Button>
            </>
          )}
        </Card>

        <Card className="shadow-soft h-full">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="text-emerald-500" size={20} />
              Scan Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!results && !scanning && (
              <div className="py-20 text-center text-muted-foreground italic">
                Upload and scan a receipt to see extracted data.
              </div>
            )}
            {scanning && (
              <div className="py-20 text-center space-y-4">
                <RefreshCw className="animate-spin h-10 w-10 text-primary mx-auto" />
                <p className="text-sm font-medium animate-pulse">Analyzing document structure and extracting text...</p>
              </div>
            )}
            {results && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Vendor</p>
                    <p className="text-lg font-black">{results.vendor}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">Date</p>
                    <p className="text-lg font-black">{results.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Items Extracted</p>
                  <div className="space-y-2">
                    {results.items.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-dashed">
                        <span className="text-sm">{item.desc}</span>
                        <span className="font-mono font-bold">${item.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center p-4 bg-primary text-primary-foreground rounded-2xl">
                  <span className="font-bold">Total Amount</span>
                  <span className="text-2xl font-black">${results.total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1">Create Expense</Button>
                  <Button variant="outline" className="flex-1">Discard</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
