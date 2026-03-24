import { Bell, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { getEmployeeAuth, clearEmployeeAuth } from "@/Employee/lib/auth";
import { useEffect, useMemo, useState } from "react";
import { getEmployeeProfile } from "@/Employee/lib/api";

interface EmployeeHeaderProps {
  onMenuClick?: () => void;
}

interface ProfileData {
  name: string;
  email: string;
  avatarUrl?: string;
}

export function EmployeeHeader({ onMenuClick }: EmployeeHeaderProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const auth = getEmployeeAuth();

  // Fetch profile for avatar image
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getEmployeeProfile();
        setProfile(res.item);
      } catch (err) {
        console.error("Failed to load profile for header:", err);
      }
    };
    loadProfile();
  }, []);

  const fullName = (profile?.name || auth?.name || auth?.username || "Employee").trim();
  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "E";

  const unreadCount = 0;

  const onLogout = () => {
    clearEmployeeAuth();
    localStorage.removeItem("token");
    navigate("/login/employee", { replace: true });
  };

  const notifications = useMemo(() => {
    return [] as Array<{ id: string; content?: string }>;
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 md:left-20 z-30 shadow-floating">
      <div className="w-full bg-gradient-to-r from-[#133767] via-[#133767] to-[#133767]">
        <div className="hidden md:block fixed top-0 left-0 h-36 w-20 bg-gradient-to-r from-[#133767] via-[#133767] to-[#133767]" />
        <div className="relative flex h-20 sm:h-24 md:h-36 items-center justify-between px-3 sm:px-6 lg:px-10 py-2 md:py-4 animate-fade-in">
          <div className="flex items-center z-10">
            <img
              src="/seven logo.png"
              alt="SE7EN Inc. logo"
              className="h-14 sm:h-16 md:h-36 w-auto max-w-[180px] sm:max-w-[200px] md:max-w-[300px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
            />
          </div>

          <div className="flex absolute left-1/2 -translate-x-1/2 items-center">
            <div className="relative">
              <div className="absolute inset-0 -z-10 blur-2xl bg-blue-400/30 scale-110 rounded-full" />
              <img
                src="/clock2.png"
                alt="TaskManager by Reardon"
                className="h-12 sm:h-16 md:h-32 lg:h-40 w-auto max-w-[140px] sm:max-w-[190px] md:max-w-[280px] lg:max-w-[380px] object-contain mix-blend-screen opacity-95 [mask-image:radial-gradient(closest-side,black_79%,transparent_100%)]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-white z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden sm:inline-flex relative h-9 w-9 rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px]">
                      {Math.min(unreadCount, 9)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 mr-2">
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-xs text-muted-foreground">No notifications</DropdownMenuItem>
                ) : (
                  notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex flex-col items-start gap-0.5 text-xs"
                      onClick={() => navigate("/employee/notifications")}
                    >
                      <span className="font-medium line-clamp-2">{String(n.content || "")}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="hidden sm:inline-flex items-center justify-center h-12 w-12 p-0 rounded-full bg-transparent hover:bg-transparent"
                  aria-label="Account menu"
                >
                  <Avatar className="h-12 w-12 border-2 border-white/70">
                    <AvatarImage src={profile?.avatarUrl} alt={fullName} />
                    <AvatarFallback className="bg-white/20 text-sm font-semibold text-white">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mr-2">
                <DropdownMenuLabel className="text-xs">{fullName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs" onClick={() => navigate("/employee/profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs text-destructive" onClick={onLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              className="inline-flex md:hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Open navigation"
              onClick={() => onMenuClick?.()}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
