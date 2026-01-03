import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail, Lock, UserCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Redirect, useLocation } from "wouter";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, verifyEmailMutation, resendVerificationMutation } = useAuth();
  const [, setLocation] = useLocation();
  
  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Register state
  const [employeeId, setEmployeeId] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"employee" | "hr">("employee");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  // Check for verification token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  if (urlToken && !showVerificationDialog) {
    setVerificationToken(urlToken);
    setShowVerificationDialog(true);
  }

  if (user) {
    return <Redirect to="/" />;
  }

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) {
      errors.push("At least 8 characters");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("One lowercase letter");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("One uppercase letter");
    }
    if (!/\d/.test(pwd)) {
      errors.push("One number");
    }
    if (!/[@$!%*?&]/.test(pwd)) {
      errors.push("One special character (@$!%*?&)");
    }
    return errors;
  };

  const handlePasswordChange = (pwd: string) => {
    setRegPassword(pwd);
    setPasswordErrors(validatePassword(pwd));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    loginMutation.mutate({ email, password }, {
      onError: (error: Error) => {
        setLoginError(error.message);
      },
      onSuccess: () => {
        setLocation("/");
      }
    });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (regPassword !== confirmPassword) {
      return;
    }

    if (passwordErrors.length > 0) {
      return;
    }

    registerMutation.mutate({
      employeeId,
      email: regEmail,
      password: regPassword,
      role,
    }, {
      onSuccess: (data) => {
        if (data.token) {
          setVerificationToken(data.token);
          setVerificationEmail(regEmail);
          setShowVerificationDialog(true);
        }
      }
    });
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    verifyEmailMutation.mutate({ token: verificationToken }, {
      onSuccess: () => {
        setShowVerificationDialog(false);
        setLocation("/auth");
      }
    });
  };

  const handleResendVerification = () => {
    resendVerificationMutation.mutate({ email: verificationEmail });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Panel: Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground relative overflow-hidden">
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
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
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
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="email" 
                          type="email"
                          placeholder="your.email@example.com" 
                          className="pl-9"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="password" 
                          type="password" 
                          placeholder="Enter your password"
                          className="pl-9"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    {loginError && (
                      <div className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {loginError}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl shadow-black/5">
                <CardHeader>
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Register to get started with Dayflow.</CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <div className="relative">
                        <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="employeeId" 
                          placeholder="EMP-001" 
                          className="pl-9"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          required
                          minLength={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regEmail">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="regEmail" 
                          type="email"
                          placeholder="your.email@example.com" 
                          className="pl-9"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={role} onValueChange={(value: "employee" | "hr") => setRole(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="regPassword">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="regPassword" 
                          type="password" 
                          placeholder="Create a strong password"
                          className="pl-9"
                          value={regPassword}
                          onChange={(e) => handlePasswordChange(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      {passwordErrors.length > 0 && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p className="font-medium">Password must contain:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {passwordErrors.map((error, idx) => (
                              <li key={idx} className="text-destructive">{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="confirmPassword" 
                          type="password" 
                          placeholder="Confirm your password"
                          className="pl-9"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                        />
                      </div>
                      {confirmPassword && regPassword !== confirmPassword && (
                        <p className="text-sm text-destructive">Passwords do not match</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
                      disabled={registerMutation.isPending || passwordErrors.length > 0 || regPassword !== confirmPassword}
                    >
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

      {/* Email Verification Dialog */}
      <Dialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription>
              Enter the verification token sent to your email address.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleVerifyEmail}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="verificationToken">Verification Token</Label>
                <Input
                  id="verificationToken"
                  placeholder="Enter verification token"
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  required
                />
              </div>
              {verificationEmail && (
                <p className="text-sm text-muted-foreground">
                  Token sent to: {verificationEmail}
                </p>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerification}
                disabled={resendVerificationMutation.isPending}
                className="w-full sm:w-auto"
              >
                {resendVerificationMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Token
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowVerificationDialog(false);
                  setLocation('/auth');
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifyEmailMutation.isPending || !verificationToken}
                className="w-full sm:w-auto"
              >
                {verifyEmailMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
