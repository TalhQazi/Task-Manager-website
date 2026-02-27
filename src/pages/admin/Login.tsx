import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { getAuthState } from "@/lib/auth";
import { login } from "@/lib/apiClient";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? "/";
  }, [location.state]);

  const [formData, setFormData] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthState();
    if (auth.isAuthenticated && auth.role) {
      navigate(auth.role === "admin" ? "/admin" : "/manager", { replace: true });
    }
  }, [navigate]);

  const onLogin = async () => {
    if (!formData.username || !formData.password) return;
    try {
      setError(null);
      const result = await login(formData.username, formData.password);
      const defaultLanding = result.role === "admin" ? "/admin" : "/manager";
      const nextPath = redirectTo && redirectTo !== "/" && redirectTo !== "/login" ? redirectTo : defaultLanding;
      navigate(nextPath, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Responsive Card - Mobile first */}
      <Card className="w-full max-w-[90%] sm:max-w-md md:max-w-lg shadow-soft border-0 sm:border">
        <CardHeader className="space-y-1.5 sm:space-y-2 p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Login
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Sign in to continue to TaskFlow
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 sm:space-y-5 p-4 sm:p-6 pt-0 sm:pt-0">
          {/* Username Field */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">
              Username
            </label>
            <Input
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="username"
              autoComplete="username"
              className="h-9 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="block text-xs sm:text-sm font-medium">
              Password
            </label>
            <Input
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-9 sm:h-10 text-sm sm:text-base px-3 sm:px-4"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-2 sm:p-3">
              <p className="text-xs sm:text-sm text-destructive break-words">
                {error}
              </p>
            </div>
          )}

          {/* Login Button */}
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground 
                       h-9 sm:h-11 text-sm sm:text-base font-medium
                       transition-all duration-200 active:scale-[0.98]"
            onClick={onLogin}
          >
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}