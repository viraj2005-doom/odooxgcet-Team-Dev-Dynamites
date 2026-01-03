import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useAttendance, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  CalendarCheck, 
  Plane, 
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  Menu,
  Clock
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { format } from "date-fns";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: attendanceData } = useAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  // Get today's attendance for check in/out button
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceData?.find((a: any) => {
    const attDate = new Date(a.date).toISOString().split('T')[0];
    return attDate === today;
  });
  const isCheckedIn = !!todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isCheckedOut = !!todayAttendance?.checkOut;

  const handleCheckIn = () => {
    if (!isCheckedIn && !isCheckedOut) {
      checkIn.mutate();
    }
  };

  const handleCheckOut = () => {
    if (isCheckedIn && !isCheckedOut) {
      checkOut.mutate();
    }
  };

  // Format time for display
  const formatTime = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch {
      return '';
    }
  };

  // Navigation items - different for HR/Admin
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin
    ? [
        { href: "/", label: "Employees", icon: Users },
        { href: "/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/leaves", label: "Timeoff", icon: Plane },
      ]
    : [
        { href: "/", label: "Dashboard", icon: LayoutDashboard },
        { href: "/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/leaves", label: "Time Off", icon: Plane },
      ];

  // Add Employees link only for Admin? Or visible to all but restricted actions? 
  // Requirement says "Dashboard (Home): Employees Grid". So it's the main view.

  const NavigationContent = () => (
    <>
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
              ${
                location === item.href
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </div>
        </Link>
      ))}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
                  D
                </div>
                <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
                  Dayflow
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              <NavigationContent />
            </nav>
          </div>

          <div className="flex items-center gap-3">
             {/* Check In/Out Dropdown Button - for HR/Admin */}
             {isAdmin && (
               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button
                     variant="outline"
                     size="sm"
                     disabled={checkIn.isPending || checkOut.isPending}
                     className={`transition-all ${
                       isCheckedIn
                         ? "bg-green-600 hover:bg-green-700 text-white border-green-600"
                         : "bg-red-600 hover:bg-red-700 text-white border-red-600"
                     }`}
                   >
                     <Clock className="mr-2 h-4 w-4" />
                     {isCheckedIn ? "Checked In" : "Check In"}
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end" className="w-48">
                   <DropdownMenuItem
                     onClick={handleCheckIn}
                     disabled={isCheckedIn || isCheckedOut || checkIn.isPending}
                     className="cursor-pointer"
                   >
                     <div className="flex flex-col w-full">
                       <span className="font-medium">Check In</span>
                       {todayAttendance?.checkIn && (
                         <span className="text-xs text-muted-foreground">
                           {formatTime(todayAttendance.checkIn)}
                         </span>
                       )}
                     </div>
                   </DropdownMenuItem>
                   <DropdownMenuItem
                     onClick={handleCheckOut}
                     disabled={!isCheckedIn || isCheckedOut || checkOut.isPending}
                     className="cursor-pointer"
                   >
                     <div className="flex flex-col w-full">
                       <span className="font-medium">Check Out</span>
                       {todayAttendance?.checkOut && (
                         <span className="text-xs text-muted-foreground">
                           {formatTime(todayAttendance.checkOut)}
                         </span>
                       )}
                     </div>
                   </DropdownMenuItem>
                 </DropdownMenuContent>
               </DropdownMenu>
             )}

             {/* User Profile Dropdown */}
             <div className="flex items-center gap-3">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all p-0">
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarImage src={user?.avatarUrl || ""} alt={`${user?.firstName} ${user?.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = `/users/${user?._id || user?.id}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                    onClick={() => logoutMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Trigger */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[80%] max-w-[300px] pt-12">
                   <div className="flex flex-col gap-2">
                     <NavigationContent />
                   </div>
                </SheetContent>
              </Sheet>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-500 slide-in-from-bottom-2">
        {children}
      </main>
    </div>
  );
}
