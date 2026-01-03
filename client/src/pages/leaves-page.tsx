import { useAuth } from "@/hooks/use-auth";
import { useLeaves, useCreateLeave, useUpdateLeaveStatus } from "@/hooks/use-leaves";
import LayoutShell from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Check, X, Plane } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertLeaveSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

const createLeaveSchema = insertLeaveSchema.pick({
  type: true,
  startDate: true,
  endDate: true,
  reason: true,
});

type CreateLeaveFormValues = z.infer<typeof createLeaveSchema>;

export default function LeavesPage() {
  const { user } = useAuth();
  const { data: leaves, isLoading } = useLeaves();
  const createLeave = useCreateLeave();
  const updateStatus = useUpdateLeaveStatus();
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  const form = useForm<CreateLeaveFormValues>({
    resolver: zodResolver(createLeaveSchema),
    defaultValues: {
      type: "paid",
      reason: "",
    },
  });

  const onSubmit = (data: CreateLeaveFormValues) => {
    createLeave.mutate(data, {
      onSuccess: () => {
        setIsRequestOpen(false);
        form.reset();
      },
    });
  };

  const myLeaves = leaves?.filter((l: any) => l.userId === user?.id);
  const pendingLeaves = leaves?.filter((l: any) => l.status === "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600 hover:bg-green-700">Approved</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25">Pending</Badge>;
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Time Off</h1>
            <p className="text-muted-foreground mt-1">
              Manage your leave requests and balances.
            </p>
          </div>

          <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Request Time Off
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Time Off</DialogTitle>
                <DialogDescription>Submit a new leave request for approval.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Leave Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="paid">Paid Leave</SelectItem>
                          <SelectItem value="sick">Sick Leave</SelectItem>
                          <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="startDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="endDate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="reason" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason</FormLabel>
                      <FormControl><Textarea {...field} placeholder="Why are you taking leave?" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createLeave.isPending}>Submit Request</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="my-leaves">
           <TabsList>
             <TabsTrigger value="my-leaves">My Requests</TabsTrigger>
             {user?.role === 'admin' && (
               <TabsTrigger value="team-requests" className="relative">
                 Team Requests
                 {pendingLeaves?.length > 0 && (
                   <span className="ml-2 flex h-2 w-2 rounded-full bg-destructive animate-pulse" />
                 )}
               </TabsTrigger>
             )}
           </TabsList>

           <TabsContent value="my-leaves" className="mt-4">
             <Card>
               <CardContent className="p-0">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead>Type</TableHead>
                       <TableHead>Dates</TableHead>
                       <TableHead>Reason</TableHead>
                       <TableHead>Status</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isLoading ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                     ) : myLeaves?.length === 0 ? (
                       <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No leave requests yet.</TableCell></TableRow>
                     ) : (
                       myLeaves?.map((leave: any) => (
                         <TableRow key={leave.id}>
                           <TableCell className="capitalize font-medium flex items-center gap-2">
                             <Plane className="h-4 w-4 text-muted-foreground" />
                             {leave.type}
                           </TableCell>
                           <TableCell>
                             {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd, yyyy")}
                           </TableCell>
                           <TableCell className="max-w-[200px] truncate text-muted-foreground">
                             {leave.reason}
                           </TableCell>
                           <TableCell>{getStatusBadge(leave.status)}</TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
           </TabsContent>

           {user?.role === 'admin' && (
             <TabsContent value="team-requests" className="mt-4">
               <Card>
                 <CardHeader>
                   <CardTitle>Pending Approvals</CardTitle>
                   <CardDescription>Review and manage time off requests from your team.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="space-y-4">
                     {pendingLeaves?.length === 0 ? (
                       <div className="text-center py-10 text-muted-foreground">No pending requests to review.</div>
                     ) : (
                       pendingLeaves?.map((leave: any) => (
                         <div key={leave.id} className="flex items-start justify-between p-4 border rounded-xl bg-muted/20">
                           <div className="space-y-1">
                             <h4 className="font-semibold">{leave.user?.firstName} {leave.user?.lastName}</h4>
                             <div className="text-sm text-muted-foreground">
                               <span className="capitalize font-medium text-foreground">{leave.type} Leave</span>
                               {" • "}
                               {format(new Date(leave.startDate), "MMM dd")} - {format(new Date(leave.endDate), "MMM dd")}
                             </div>
                             <p className="text-sm italic">"{leave.reason}"</p>
                           </div>
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                               onClick={() => updateStatus.mutate({ id: leave.id, status: 'rejected' })}
                               disabled={updateStatus.isPending}
                             >
                               <X className="h-4 w-4 mr-1" /> Reject
                             </Button>
                             <Button 
                               size="sm"
                               className="bg-green-600 hover:bg-green-700"
                               onClick={() => updateStatus.mutate({ id: leave.id, status: 'approved' })}
                               disabled={updateStatus.isPending}
                             >
                               <Check className="h-4 w-4 mr-1" /> Approve
                             </Button>
                           </div>
                         </div>
                       ))
                     )}
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>
           )}
        </Tabs>
      </div>
    </LayoutShell>
  );
}
