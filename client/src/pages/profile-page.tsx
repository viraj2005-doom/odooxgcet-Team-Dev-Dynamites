import { useAuth } from "@/hooks/use-auth";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import LayoutShell from "@/components/layout-shell";
import { useLocation, useRoute } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Building, Calendar, DollarSign, Shield } from "lucide-react";
import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [, params] = useRoute("/users/:id");
  const userId = params ? parseInt(params.id) : null;
  const { data: userProfile, isLoading } = useUser(userId || 0);
  const { user: currentUser } = useAuth();
  const updateUser = useUpdateUser();
  const [activeTab, setActiveTab] = useState("resume");

  const isEditable = currentUser?.role === 'admin' || currentUser?.id === userProfile?.id;
  const isAdmin = currentUser?.role === 'admin';

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </LayoutShell>
    );
  }

  if (!userProfile) return <div>User not found</div>;

  return (
    <LayoutShell>
      <div className="space-y-8">
        {/* Header Profile Card */}
        <div className="relative">
          <div className="h-48 bg-gradient-to-r from-primary/80 to-accent/80 rounded-2xl shadow-lg" />
          <div className="absolute -bottom-16 left-8 flex items-end gap-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
              <AvatarImage src={userProfile.avatarUrl} />
              <AvatarFallback className="text-4xl bg-muted">{userProfile.firstName[0]}</AvatarFallback>
            </Avatar>
            <div className="mb-2">
              <h1 className="text-3xl font-bold text-foreground drop-shadow-sm">{userProfile.firstName} {userProfile.lastName}</h1>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <span>{userProfile.jobPosition}</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                <span>{userProfile.department}</span>
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4">
             <Badge variant={userProfile.status === 'active' ? 'default' : 'destructive'}>
               {userProfile.status}
             </Badge>
          </div>
        </div>

        <div className="mt-20">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
              <TabsTrigger 
                value="resume" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Profile & Resume
              </TabsTrigger>
              <TabsTrigger 
                value="private" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
              >
                Private Info
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger 
                  value="salary" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3 font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
                >
                  Salary & Payroll
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-8 grid gap-8">
              <TabsContent value="resume">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Details</CardTitle>
                    <CardDescription>Work contact information and role details.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</Label>
                        <div className="flex items-center gap-2 font-medium">
                          <Mail className="h-4 w-4 text-primary" /> {userProfile.email}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</Label>
                        <div className="flex items-center gap-2 font-medium">
                          <Phone className="h-4 w-4 text-primary" /> {userProfile.phone}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Location</Label>
                        <div className="flex items-center gap-2 font-medium">
                          <MapPin className="h-4 w-4 text-primary" /> {userProfile.location || "Remote"}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Department</Label>
                        <div className="flex items-center gap-2 font-medium">
                          <Building className="h-4 w-4 text-primary" /> {userProfile.department}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Date of Joining</Label>
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="h-4 w-4 text-primary" /> {userProfile.joiningDate ? new Date(userProfile.joiningDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="private">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal & Banking Information</CardTitle>
                    <CardDescription>Sensitive personal details and bank account for payroll.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <Label>Address</Label>
                         <Input defaultValue={userProfile.address || ""} readOnly={!isEditable} />
                       </div>
                       <div className="space-y-2">
                         <Label>Personal Email</Label>
                         <Input defaultValue={userProfile.personalEmail || ""} readOnly={!isEditable} />
                       </div>
                       <div className="space-y-2">
                         <Label>Date of Birth</Label>
                         <Input type="date" defaultValue={userProfile.dob || ""} readOnly={!isEditable} />
                       </div>
                       <div className="space-y-2">
                         <Label>Nationality</Label>
                         <Input defaultValue={userProfile.nationality || ""} readOnly={!isEditable} />
                       </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Building className="h-4 w-4" /> Bank Details
                      </h3>
                      <div className="grid md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-lg border">
                         <div className="space-y-2">
                           <Label>Bank Name</Label>
                           <Input defaultValue={userProfile.bankName || ""} readOnly={!isEditable} />
                         </div>
                         <div className="space-y-2">
                           <Label>Account Number</Label>
                           <Input defaultValue={userProfile.accountNumber || ""} readOnly={!isEditable} />
                         </div>
                         <div className="space-y-2">
                           <Label>IFSC Code</Label>
                           <Input defaultValue={userProfile.ifscCode || ""} readOnly={!isEditable} />
                         </div>
                         <div className="space-y-2">
                           <Label>PAN Number</Label>
                           <Input defaultValue={userProfile.panNo || ""} readOnly={!isEditable} />
                         </div>
                      </div>
                    </div>
                    
                    {isEditable && (
                      <div className="flex justify-end">
                        <Button onClick={() => { /* Real implementation would collect form state */ }}>
                          Save Changes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="salary">
                  <Card>
                    <CardHeader>
                      <CardTitle>Salary Structure</CardTitle>
                      <CardDescription>Compensation details visible only to Admin.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-xl border border-primary/10 mb-8">
                         <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                           <DollarSign className="h-6 w-6" />
                         </div>
                         <div>
                           <p className="text-sm text-muted-foreground font-medium uppercase">Total Monthly Wage</p>
                           <p className="text-3xl font-bold font-mono text-primary">${userProfile.monthlyWage?.toLocaleString()}</p>
                         </div>
                       </div>

                       <div className="space-y-4">
                         <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Breakdown (Estimated)</h4>
                         <div className="grid gap-2">
                           <div className="flex justify-between p-3 rounded-lg bg-background border">
                             <span>Basic Salary (50%)</span>
                             <span className="font-mono">${((userProfile.monthlyWage || 0) * 0.5).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between p-3 rounded-lg bg-background border">
                             <span>HRA (20%)</span>
                             <span className="font-mono">${((userProfile.monthlyWage || 0) * 0.2).toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between p-3 rounded-lg bg-background border">
                             <span>Special Allowances (30%)</span>
                             <span className="font-mono">${((userProfile.monthlyWage || 0) * 0.3).toLocaleString()}</span>
                           </div>
                         </div>
                       </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </LayoutShell>
  );
}
