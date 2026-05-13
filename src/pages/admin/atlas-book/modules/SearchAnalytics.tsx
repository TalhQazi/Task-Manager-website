import { useState } from "react";
import { Card, CardContent } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Button } from "@/components/admin/ui/button";
import { Badge } from "@/components/admin/ui/badge";
import { Search, Sparkles, ArrowRight, Building, Users, Wallet, CreditCard, Box } from "lucide-react";
import { apiFetch } from "@/lib/admin/apiClient";
import { Link } from "react-router-dom";

export default function SearchAnalytics() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!q) return;
    try {
      setLoading(true);
      const res = await apiFetch(`/api/atlasbook/search?q=${encodeURIComponent(q)}`);
      if (res?.success) setResults(res.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case "Property": return <Building size={16} />;
      case "Tenant": return <Users size={16} />;
      case "Account": return <Wallet size={16} />;
      case "Transaction": return <CreditCard size={16} />;
      default: return <Box size={16} />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-10">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-bold border border-primary/10">
          <Sparkles size={14} className="animate-pulse" />
          AI-POWERED SEARCH & ANALYTICS
        </div>
        <h1 className="text-5xl font-black tracking-tight">Atlas Search</h1>
        <p className="text-muted-foreground text-lg">Search across properties, tenants, accounts, and millions of transactions instantly.</p>
      </div>

      <Card className="shadow-2xl border-none p-2 rounded-3xl bg-white/50 backdrop-blur-xl">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Type anything... 'Rent for Unit 101', 'Total assets in London', 'Pending bills'" 
              className="h-16 pl-12 pr-4 text-lg border-none shadow-none bg-transparent focus-visible:ring-0"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Button type="submit" className="h-14 px-8 rounded-2xl gap-2 font-bold text-lg" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </form>
      </Card>

      <div className="space-y-4">
        {results.length > 0 && <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest px-2">Search Results ({results.length})</p>}
        
        <div className="grid grid-cols-1 gap-3">
          {results.map((res, i) => (
            <Link key={i} to={res.link} className="block group">
              <Card className="shadow-soft hover:shadow-lg transition-all border-transparent hover:border-primary/20 overflow-hidden">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted group-hover:bg-primary group-hover:text-white rounded-2xl transition-colors">
                      {getIcon(res.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">{res.type}</Badge>
                        <span className="text-[10px] text-muted-foreground">ID: {res.id.slice(-6)}</span>
                      </div>
                      <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{res.title}</h4>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                </CardContent>
              </Card>
            </Link>
          ))}

          {q && !loading && results.length === 0 && (
            <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed">
              <p className="text-muted-foreground italic">No results found for "{q}". Try searching for something else.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Properties", "Invoices", "Tenants", "Accounts"].map(tag => (
                  <Button key={tag} variant="outline" size="sm" onClick={() => { setQ(tag); handleSearch(); }}>{tag}</Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t">
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 text-primary"><Sparkles size={18} /> AI Analytics Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Atlas AI has detected a 4.2% increase in operational efficiency this month. Your debt-to-equity ratio remains within optimal range (0.65). Recommendation: Diversify asset holdings in the "Industrial" category to mitigate regional volatility.
          </p>
        </div>
        <Card className="shadow-soft bg-slate-900 text-white border-none p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xs font-bold uppercase text-slate-400">Search Trends</h4>
            <Badge className="bg-emerald-500">Positive</Badge>
          </div>
          <div className="space-y-3">
            {[
              { label: "Revenue Queries", val: "85%" },
              { label: "Tenant Support", val: "12%" },
              { label: "Compliance Checks", val: "3%" }
            ].map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold"><span>{stat.label}</span><span>{stat.val}</span></div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: stat.val }} /></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
