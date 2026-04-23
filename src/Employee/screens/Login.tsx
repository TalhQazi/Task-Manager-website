import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { setEmployeeAuth } from "../lib/auth";
import { employeeApiFetch } from "../lib/api";
import { Eye, EyeOff, User, Lock, ArrowLeft, Briefcase, Shield, Sparkles } from "lucide-react";

export default function EmployeeLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  // Animated background gradients
  const backgrounds = [
    "from-[#133767] via-blue-900 to-[#133767]",
    "from-[#1a4585] via-[#133767] to-[#0f2a52]",
    "from-[#0f2a52] via-blue-900 to-[#133767]",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await employeeApiFetch<{ 
        item: { 
          token: string; 
          role: string;
          username: string;
          name: string;
        } 
      }>("/api/auth/employee-login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      setEmployeeAuth({
        token: res.item.token,
        username: res.item.username,
        name: res.item.name,
        role: "employee",
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      });

      localStorage.setItem("token", res.item.token);
      navigate("/employee");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const goToAdminLogin = () => {
    navigate("/login");
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgrounds[backgroundIndex]} transition-all duration-1000 ease-in-out flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Animated particles/background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button - Enhanced */}
        <button
          onClick={goToAdminLogin}
          className="group mb-4 sm:mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-all duration-300 hover:translate-x-[-4px]"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Admin/Manager Login</span>
        </button>

        {/* Main Card - Enhanced with glass morphism effect */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="space-y-2 pb-4 sm:pb-6">
            <div className="flex justify-center mb-2 sm:mb-4">
              <div className="relative group">
                <img
                  src="/seven logo.png"
                  alt="SE7EN Inc. logo"
                  className="h-16 sm:h-20 w-auto transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute -inset-2 bg-gradient-to-r from-[#133767] to-blue-600 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </div>
            </div>
            
            <CardTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-[#133767] to-blue-600 bg-clip-text text-transparent">
              Employee Portal
            </CardTitle>
            
            <div className="flex items-center justify-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <p className="text-center text-muted-foreground text-sm sm:text-base">
                Access your work dashboard
              </p>
            </div>
          </CardHeader>

          <CardContent className="pt-2 sm:pt-4">
            {/* Error Alert - Enhanced */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md animate-shake">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Username Field - Enhanced */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#133767] transition-colors" />
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 transition-all duration-300 border-gray-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field - Enhanced */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#133767] transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 transition-all duration-300 border-gray-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#133767] transition-all duration-200 hover:scale-110"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button - Enhanced with animations */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#133767] to-blue-700 hover:from-[#1a4585] hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                disabled={loading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className={`h-4 w-4 transition-all duration-300 ${isHovered ? 'rotate-12 scale-110' : ''}`} />
                    <span>Login as Employee</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Divider - Enhanced */}
            <div className="relative my-6 sm:my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white dark:bg-gray-900 text-muted-foreground">Secure Access</span>
              </div>
            </div>

            {/* Admin Login Link - Enhanced */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Are you an Admin or Manager?
              </p>
              <button
                onClick={goToAdminLogin}
                className="mt-2 inline-flex items-center gap-2 text-[#133767] font-semibold hover:gap-3 transition-all duration-300 group"
              >
                <Shield className="h-4 w-4" />
                <span>Login with Admin/Manager credentials</span>
                <ArrowLeft className="h-3 w-3 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer - Enhanced */}
        <div className="mt-6 sm:mt-8 text-center space-y-2">
          <p className="text-white/60 text-xs sm:text-sm">
            © {new Date().getFullYear()} SE7EN Inc. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <span>•</span>
            <a href="#" className="hover:text-white/60 transition-colors">Contact Support</a>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}