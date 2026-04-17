import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/admin/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4 sm:p-6 md:p-8">
      {/* Responsive Container */}
      <div className="w-full max-w-[90%] sm:max-w-md md:max-w-lg mx-auto text-center">
        
        {/* Animated 404 - Responsive Text */}
        <div className="relative mb-6 sm:mb-8">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent/60">
            404
          </h1>
          
          {/* Decorative Circle - Hidden on mobile */}
          <div className="hidden sm:block absolute -top-6 -left-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
          <div className="hidden sm:block absolute -bottom-6 -right-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl" />
        </div>

        {/* Icon - Responsive sizing */}
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-accent" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
            Page Not Found
          </h2>
          
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-sm mx-auto px-2">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Path that was attempted - Only show on tablet and up */}
          <div className="hidden sm:block">
            <p className="text-xs sm:text-sm text-muted-foreground/70 bg-muted-foreground/5 p-2 rounded-md inline-block px-4">
              <span className="font-mono">{location.pathname}</span>
            </p>
          </div>

          {/* Action Buttons - Stack on mobile, row on desktop */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
            <Button 
              asChild
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground 
                         h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base
                         transition-all duration-200 active:scale-[0.98]"
            >
              <a href="/" className="flex items-center justify-center">
                <Home className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Return Home</span>
              </a>
            </Button>
            
            <Button 
              variant="outline" 
              asChild
              className="w-full sm:w-auto h-10 sm:h-11 px-6 sm:px-8 text-sm sm:text-base
                         transition-all duration-200 active:scale-[0.98]"
            >
              <a href="/dashboard">
                Go to Dashboard
              </a>
            </Button>
          </div>
        </div>

        {/* Footer Note - Mobile only */}
        <p className="mt-8 sm:hidden text-xs text-muted-foreground/60">
          Route: <span className="font-mono">{location.pathname}</span>
        </p>

        {/* Decorative Elements - Desktop only */}
        <div className="hidden sm:block mt-8 text-xs text-muted-foreground/40">
          <p>© {new Date().getFullYear()} TaskFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;