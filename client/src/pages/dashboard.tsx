import { useAuth } from "@/hooks/use-auth";
import { useUsers, useCreateUser } from "@/hooks/use-users";
import { useAttendance } from "@/hooks/use-attendance";
import { useLeaves } from "@/hooks/use-leaves";
import LayoutShell from "@/components/layout-shell";
import { EmployeeCard } from "@/components/employee-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Search, Plus, Users, UserPlus, User, CalendarCheck, Plane, LogOut, AlertCircle, CheckCircle2, Clock, Bell } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { format } from "date-fns";

// Define the form schema based on the insertUserSchema but picking required fields for creation
const createUserFormSchema = insertUserSchema.pick({
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  jobPosition: true,
  department: true,
  location: true,
  joiningDate: true,
  monthlyWage: true,
});

type CreateUserFormValues = z.infer<typeof createUserFormSchema>;

// Employee Dashboard Component
function EmployeeDashboard() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const { data: attendanceData } = useAttendance();
  const { data: leavesData } = useLeaves();

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceData?.find((a: any) => {
    const attDate = new Date(a.date).toISOString().split('T')[0];
    return attDate === today;
  });

  // Get pending leaves
  const pendingLeaves = leavesData?.filter((l: any) => l.status === 'pending') || [];
  
  // Get recent leaves (last 5)
  const recentLeaves = leavesData?.slice(0, 5) || [];

  // Quick access cards
  const quickAccessCards = [
    {
      title: "My Profile",
      description: "View and edit your profile",
      icon: User,
      href: `/users/${user?._id || user?.id}`,
      color: "bg-blue-500",
    },
    {
      title: "Attendance",
      description: "Check in/out and view records",
      icon: CalendarCheck,
      href: "/attendance",
      color: "bg-green-500",
    },
    {
      title: "Leave Requests",
      description: "Request and track time off",
      icon: Plane,
      href: "/leaves",
      color: "bg-purple-500",
    },
  ];

  // Recent activity/alerts
  const alerts = [];
  
  if (!todayAttendance || !todayAttendance.checkIn) {
    alerts.push({
      type: "warning",
      title: "Not Checked In",
      description: "You haven't checked in today. Please check in to record your attendance.",
      icon: AlertCircle,
    });
  }

  if (pendingLeaves.length > 0) {
    alerts.push({
      type: "info",
      title: "Pending Leave Requests",
      description: `You have ${pendingLeaves.length} pending leave request${pendingLeaves.length > 1 ? 's' : ''} awaiting approval.`,
      icon: Clock,
    });
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h1>
        <p className="text-muted-foreground mt-1">
          Here's a quick overview of your dashboard.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickAccessCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-border/60"
              onClick={() => {
                if (card.onClick) {
                  card.onClick();
                } else if (card.href !== "#") {
                  setLocation(card.href);
                }
              }}
            >
              <CardHeader className="pb-3">
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-2`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription className="text-xs">{card.description}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Notifications
          </h2>
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <Alert key={index} variant={alert.type === "warning" ? "destructive" : "default"}>
                <Icon className="h-4 w-4" />
                <AlertTitle>{alert.title}</AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={todayAttendance.status === 'present' ? 'default' : 'secondary'}>
                    {todayAttendance.status || 'Not checked in'}
                  </Badge>
                </div>
                {todayAttendance.checkIn && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Check In</span>
                    <span className="text-sm font-medium">
                      {format(new Date(todayAttendance.checkIn), 'hh:mm a')}
                    </span>
                  </div>
                )}
                {todayAttendance.checkOut && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Check Out</span>
                    <span className="text-sm font-medium">
                      {format(new Date(todayAttendance.checkOut), 'hh:mm a')}
                    </span>
                  </div>
                )}
                {todayAttendance.workHours && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Work Hours</span>
                    <span className="text-sm font-medium">{todayAttendance.workHours} hrs</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setLocation("/attendance")}
                >
                  View Full Attendance
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">No attendance record for today</p>
                <Button onClick={() => setLocation("/attendance")}>
                  Check In Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Recent Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLeaves.length > 0 ? (
              <div className="space-y-3">
                {recentLeaves.map((leave: any) => (
                  <div key={leave._id || leave.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}
                      </p>
                      <p className="text-xs text-muted-foreground">{leave.type} Leave</p>
                    </div>
                    <Badge 
                      variant={
                        leave.status === 'approved' ? 'default' :
                        leave.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setLocation("/leaves")}
                >
                  View All Leaves
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">No leave requests yet</p>
                <Button onClick={() => setLocation("/leaves")}>
                  Request Leave
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Admin/HR Dashboard Component (Team Overview)
function AdminDashboard() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const createUser = useCreateUser();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobPosition: "",
      department: "",
      location: "",
      joiningDate: new Date().toISOString().split('T')[0],
      monthlyWage: 0,
    },
  });

  const onSubmit = (data: CreateUserFormValues) => {
    createUser.mutate(data, {
      onSuccess: () => {
        setIsCreateOpen(false);
        form.reset();
      },
    });
  };

  const filteredUsers = users?.filter((u: any) => 
    u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.jobPosition?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage your employees and view their current status.
          </p>
        </div>
        
        <div className="flex gap-3">
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search employees..." 
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           
           {currentUser?.role === 'admin' && (
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
               <DialogTrigger asChild>
                 <Button className="shrink-0 bg-primary hover:bg-primary/90">
                   <Plus className="mr-2 h-4 w-4" /> New Employee
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl">
                 <DialogHeader>
                   <DialogTitle>Add New Employee</DialogTitle>
                   <DialogDescription>
                     Create a new employee profile. They will receive login credentials via email.
                   </DialogDescription>
                 </DialogHeader>
                 
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                     <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name="firstName" render={({ field }) => (
                         <FormItem>
                           <FormLabel>First Name</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="lastName" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Last Name</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="email" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Email</FormLabel>
                           <FormControl><Input type="email" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="phone" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Phone</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="jobPosition" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Position</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="department" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Department</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="location" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Location</FormLabel>
                           <FormControl><Input {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="joiningDate" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Joining Date</FormLabel>
                           <FormControl><Input type="date" {...field} /></FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                       <FormField control={form.control} name="monthlyWage" render={({ field }) => (
                         <FormItem>
                           <FormLabel>Monthly Wage</FormLabel>
                           <FormControl>
                             <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                           </FormControl>
                           <FormMessage />
                         </FormItem>
                       )} />
                     </div>
                     
                     <DialogFooter>
                       <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                       <Button type="submit" disabled={createUser.isPending}>
                          {createUser.isPending ? "Creating..." : "Create Profile"}
                       </Button>
                     </DialogFooter>
                   </form>
                 </Form>
               </DialogContent>
             </Dialog>
           )}
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border/60">
          <div className="mx-auto h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No employees found</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {searchQuery ? "Try adjusting your search query." : "Get started by adding your first employee."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers?.map((employee: any) => (
            <EmployeeCard
              key={employee._id || employee.id}
              id={employee._id || employee.id}
              firstName={employee.firstName}
              lastName={employee.lastName}
              role={employee.role}
              jobPosition={employee.jobPosition}
              avatarUrl={employee.avatarUrl}
              status={employee.status}
              attendanceStatus={employee.todayAttendance?.status || 'absent'}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <LayoutShell>
      {user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
    </LayoutShell>
  );
}
