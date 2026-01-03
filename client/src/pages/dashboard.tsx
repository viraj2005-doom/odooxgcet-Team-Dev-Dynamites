import { useAuth } from "@/hooks/use-auth";
import { useUsers, useCreateUser } from "@/hooks/use-users";
import LayoutShell from "@/components/layout-shell";
import { EmployeeCard } from "@/components/employee-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Plus, Users, UserPlus } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

export default function Dashboard() {
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
    <LayoutShell>
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
                key={employee.id}
                id={employee.id}
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
    </LayoutShell>
  );
}
