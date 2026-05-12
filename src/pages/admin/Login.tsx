import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { getAuthState, setAuthState, type UserRole } from "@/lib/auth";
import { login, setupPassword } from "@/lib/apiClient";
import { setEmployeeAuth } from "@/Employee/lib/auth";
import { Eye, EyeOff, Lock, User, LogIn, KeyRound, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import logoImage from "../../../public/new_logo.jpeg";
import { useTheme } from "@/contexts/ThemeContext";

type Step = "login" | "setup-password" | "password-done" | "no-role";

const EMPLOYEE_ROLES = ["employee", "team-lead", "coder"];
const ADMIN_ROLES = ["admin", "super-admin", "manager", "developer"];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadFromBackend } = useTheme();

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? "/";
  }, [location.state]);

  const [step, setStep] = useState<Step>("login");
  const [formData, setFormData] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  });
  const [setupIdentifier, setSetupIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const auth = getAuthState();
    if (auth.isAuthenticated && auth.role) {
      const to =
        auth.role === "developer"
          ? "/developer"
          : auth.role === "admin" || auth.role === "super-admin"
            ? "/admin"
            : "/manager";
      navigate(to, { replace: true });
    }
  }, [navigate]);

  const onLogin = async () => {
    if (!formData.username || !formData.password) return;
    setIsLoading(true);
    try {
      setError(null);
      const result = await login(formData.username, formData.password);

      if (result.status === "needs-password-setup") {
        setSetupIdentifier(result.identifier);
        setStep("setup-password");
        return;
      }

      if (result.status === "role-not-defined") {
        setStep("no-role");
        return;
      }

      const { role, username, name, token } = result;

      // Unknown / no role — contact admin
      if (!role || (!EMPLOYEE_ROLES.includes(role) && !ADMIN_ROLES.includes(role))) {
        setStep("no-role");
        return;
      }

      if (EMPLOYEE_ROLES.includes(role)) {
        // Employee-type users go to the employee portal
        setEmployeeAuth({
          token,
          username,
          name,
          role: role as "employee" | "team-lead" | "coder",
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });
        localStorage.setItem("token", token);
        loadFromBackend().catch(() => {});
        navigate("/employee", { replace: true });
        return;
      }

      // Admin / manager / developer
      setAuthState({
        isAuthenticated: true,
        role: role as UserRole,
        username,
        name: name || username,
        token,
      });
      const defaultLanding =
        role === "developer" ? "/developer" :
        role === "admin" || role === "super-admin" ? "/admin" :
        "/manager";
      const nextPath =
        redirectTo && redirectTo !== "/" && redirectTo !== "/login"
          ? redirectTo
          : defaultLanding;
      loadFromBackend().catch(() => {});
      navigate(nextPath, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const onSetupPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      setError(null);
      await setupPassword(setupIdentifier, newPassword);
      setStep("password-done");
      setFormData({ username: setupIdentifier, password: "" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (step === "login") onLogin();
      else if (step === "setup-password") onSetupPassword();
    }
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delayChildren: 0.3, staggerChildren: 0.2 } },
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 100, damping: 12 } },
  };
  const cardVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0, y: 50 },
    visible: { scale: 1, opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15, mass: 1, when: "beforeChildren", staggerChildren: 0.1 } },
  };
  const buttonVariants: Variants = {
    hover: { scale: 1.02, transition: { type: "spring" as const, stiffness: 400, damping: 10 } },
    tap: { scale: 0.98, transition: { type: "spring" as const, stiffness: 400, damping: 10 } },
  };
  const errorVariants: Variants = {
    hidden: { opacity: 0, x: -20, height: 0 },
    visible: { opacity: 1, x: 0, height: "auto" },
    exit: { opacity: 0, x: 20, height: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white flex items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[95%] sm:max-w-md md:max-w-xl lg:max-w-2xl"
      >
        <motion.div
          variants={cardVariants}
          whileHover={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Logo */}
            <div className="flex justify-center pt-6 sm:pt-8 px-6 sm:px-8 pb-2">
              <div className="h-20 w-28 sm:h-24 sm:w-32 rounded-full bg-white flex items-center justify-center p-2">
                <img
                  src={logoImage}
                  alt="SE7EN Logo"
                  className="h-full w-full object-contain drop-shadow-lg"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              </div>
            </div>

            {/* ── STEP: LOGIN ── */}
            {step === "login" && (
              <>
                <CardHeader className="space-y-1.5 sm:space-y-2 p-6 sm:p-8 pt-2 sm:pt-4 text-center">
                  <motion.div variants={itemVariants}>
                    <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      Welcome Back
                    </CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-sm sm:text-base md:text-lg text-slate-500">
                      Sign in to continue to Task Manager
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent className="space-y-5 sm:space-y-6 p-6 sm:p-8 pt-0">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Username or Email</label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-[#133767] transition-colors duration-200" size={18} />
                      <Input
                        value={formData.username}
                        onChange={(e) => {
                          const v = e.target.value;
                          setFormData({ ...formData, username: v.charAt(0).toLowerCase() + v.slice(1) });
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        className="h-11 sm:h-12 text-sm sm:text-base pl-10 pr-4 bg-white border-slate-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20 transition-all duration-300 group-hover:border-[#133767]/50"
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-[#133767] transition-colors duration-200" size={18} />
                      <Input
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onKeyDown={handleKeyDown}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="h-11 sm:h-12 text-sm sm:text-base pl-10 pr-12 bg-white border-slate-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20 transition-all duration-300 group-hover:border-[#133767]/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#133767] transition-all duration-200 focus:outline-none p-1 rounded-full hover:bg-[#133767]/10"
                      >
                        <motion.div initial={false} animate={{ rotate: showPassword ? 180 : 0 }} transition={{ duration: 0.3, type: "spring", stiffness: 200 }}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </motion.div>
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div variants={errorVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                        <p className="text-sm text-destructive break-words">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                      <Button
                        className="w-full bg-[#133767] hover:bg-[#1a4585] text-white h-12 sm:h-14 text-base sm:text-lg font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group"
                        onClick={onLogin}
                        disabled={isLoading}
                      >
                        <AnimatePresence mode="wait">
                          {isLoading ? (
                            <motion.div key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-center space-x-2">
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                              <span>Signing in...</span>
                            </motion.div>
                          ) : (
                            <motion.div key="login" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex items-center justify-center space-x-2">
                              <LogIn size={20} />
                              <span>Sign In</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" initial={{ x: "-100%" }} animate={{ x: "200%" }} transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }} />
                      </Button>
                    </motion.div>
                  </motion.div>
                </CardContent>
              </>
            )}

            {/* ── STEP: SET PASSWORD (first time only) ── */}
            {step === "setup-password" && (
              <>
                <CardHeader className="space-y-1.5 sm:space-y-2 p-6 sm:p-8 pt-2 sm:pt-4 text-center">
                  <motion.div variants={itemVariants}>
                    <div className="flex justify-center mb-3">
                      <div className="h-12 w-12 rounded-full bg-[#133767]/10 flex items-center justify-center">
                        <KeyRound className="h-6 w-6 text-[#133767]" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                      Set Your Password
                    </CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <CardDescription className="text-sm sm:text-base text-slate-500">
                      Welcome! Please create a password for your account. This is a one-time setup.
                    </CardDescription>
                  </motion.div>
                </CardHeader>

                <CardContent className="space-y-5 p-6 sm:p-8 pt-0">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">New Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-[#133767] transition-colors duration-200" size={18} />
                      <Input
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Minimum 6 characters"
                        autoFocus
                        className="h-11 sm:h-12 text-sm pl-10 pr-12 bg-white border-slate-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20 transition-all duration-300"
                      />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#133767] p-1 rounded-full hover:bg-[#133767]/10">
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-hover:text-[#133767] transition-colors duration-200" size={18} />
                      <Input
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter your password"
                        className="h-11 sm:h-12 text-sm pl-10 pr-12 bg-white border-slate-200 focus:border-[#133767] focus:ring-2 focus:ring-[#133767]/20 transition-all duration-300"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-[#133767] p-1 rounded-full hover:bg-[#133767]/10">
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div variants={errorVariants} initial="hidden" animate="visible" exit="exit" transition={{ duration: 0.3 }} className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                        <p className="text-sm text-destructive break-words">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.div variants={itemVariants}>
                    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                      <Button
                        className="w-full bg-[#133767] hover:bg-[#1a4585] text-white h-12 sm:h-14 text-base font-semibold shadow-lg shadow-blue-900/20 disabled:opacity-70 relative overflow-hidden"
                        onClick={onSetupPassword}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            <span>Saving...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <KeyRound size={20} />
                            <span>Set Password</span>
                          </div>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>

                  <div className="text-center">
                    <button onClick={() => { setStep("login"); setError(null); }} className="text-sm text-slate-500 hover:text-[#133767] transition-colors flex items-center gap-1 mx-auto">
                      <ArrowLeft size={14} />
                      Back to login
                    </button>
                  </div>
                </CardContent>
              </>
            )}

            {/* ── STEP: PASSWORD SET SUCCESSFULLY ── */}
            {step === "password-done" && (
              <>
                <CardHeader className="space-y-1.5 p-6 sm:p-8 pt-2 sm:pt-4 text-center">
                  <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <div className="flex justify-center mb-3">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10 }} className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </motion.div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Password Set!</CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <CardDescription className="text-sm sm:text-base text-slate-500">
                      Your password has been saved. You can now log in with your credentials.
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 pt-0">
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                      className="w-full bg-[#133767] hover:bg-[#1a4585] text-white h-12 text-base font-semibold"
                      onClick={() => { setStep("login"); setError(null); }}
                    >
                      <LogIn size={20} className="mr-2" />
                      Go to Login
                    </Button>
                  </motion.div>
                </CardContent>
              </>
            )}

            {/* ── STEP: NO ROLE DEFINED ── */}
            {step === "no-role" && (
              <>
                <CardHeader className="space-y-1.5 p-6 sm:p-8 pt-2 sm:pt-4 text-center">
                  <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <div className="flex justify-center mb-3">
                      <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-amber-600" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900">Access Not Configured</CardTitle>
                  </motion.div>
                  <motion.div variants={itemVariants} initial="hidden" animate="visible">
                    <CardDescription className="text-sm sm:text-base text-slate-500">
                      Your account does not have a role assigned. Please contact your administrator to set up your access level before logging in.
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 pt-0">
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-[#133767] text-[#133767] hover:bg-[#133767]/5"
                      onClick={() => { setStep("login"); setError(null); }}
                    >
                      <ArrowLeft size={18} className="mr-2" />
                      Back to Login
                    </Button>
                  </motion.div>
                </CardContent>
              </>
            )}
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
