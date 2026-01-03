import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Building2, UserCircle } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  
  // Register state
  const [companyName, setCompanyName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ loginId, password });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      companyName,
      adminName,
      email,
      phone,
      password: regPassword
    });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
        {/* Abstract shapes/texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center font-bold text-xl">D</div>
            <h1 className="font-display text-2xl font-bold">Dayflow</h1>
          </div>
          <h2 className="text-4xl font-bold max-w-md leading-tight">
            Manage your workforce with elegance and ease.
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80 max-w-sm">
            The complete HR solution for modern companies. Attendance, payroll, and employee management in one place.
          </p>
        </div>

        <div className="relative z-10 text-sm opacity-60">
          © 2024 Dayflow Inc. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Forms */}
      <div className="flex items-center justify-center p-6 bg-muted/20">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">D</div>
              <span className="font-display font-bold text-xl">Dayflow</span>
            </div>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Employee Login</TabsTrigger>
              <TabsTrigger value="register">Company Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/50 shadow-xl shadow-black/5">
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="loginId">Login ID</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="loginId" 
                          placeholder="e.g. EMP-001" 
                          className="pl-9"
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Log In
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl shadow-black/5">
                <CardHeader>
                  <CardTitle>Register Company</CardTitle>
                  <CardDescription>Start your 30-day free trial. No credit card required.</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="companyName" 
                          placeholder="Acme Inc." 
                          className="pl-9"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="adminName">Admin Name</Label>
                        <Input 
                          id="adminName" 
                          placeholder="John Doe" 
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          placeholder="+1 234..." 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="admin@acme.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <Input 
                        id="regPassword" 
                        type="password" 
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={registerMutation.isPending}>
                      {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
