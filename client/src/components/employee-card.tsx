import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocation } from "wouter";
import { Plane, CheckCircle2, AlertCircle } from "lucide-react";

interface EmployeeCardProps {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  jobPosition: string;
  avatarUrl?: string;
  status: "active" | "inactive";
  attendanceStatus?: "present" | "absent" | "leave";
}

export function EmployeeCard({
  id,
  firstName,
  lastName,
  jobPosition,
  avatarUrl,
  attendanceStatus = "absent", // Default to absent if no data for today
}: EmployeeCardProps) {
  const [, setLocation] = useLocation();

  const getStatusIndicator = () => {
    switch (attendanceStatus) {
      case "present":
        return (
          <Tooltip>
            <TooltipTrigger>
               <div className="h-4 w-4 rounded-full bg-green-500 border-2 border-background ring-2 ring-green-500/20" />
            </TooltipTrigger>
            <TooltipContent>Present Today</TooltipContent>
          </Tooltip>
        );
      case "leave":
        return (
          <Tooltip>
            <TooltipTrigger>
              <div className="h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center border-2 border-background shadow-sm">
                <Plane className="h-3 w-3" />
              </div>
            </TooltipTrigger>
            <TooltipContent>On Leave</TooltipContent>
          </Tooltip>
        );
      default: // absent
        return (
          <Tooltip>
            <TooltipTrigger>
              <div className="h-4 w-4 rounded-full bg-yellow-400 border-2 border-background ring-2 ring-yellow-400/20" />
            </TooltipTrigger>
            <TooltipContent>Absent / Not Checked In</TooltipContent>
          </Tooltip>
        );
    }
  };

  return (
    <Card 
      className="group hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-border/60"
      onClick={() => setLocation(`/users/${id}`)}
    >
      <div className="h-24 bg-gradient-to-r from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-colors" />
      <CardContent className="pt-0 -mt-10 flex flex-col items-center pb-6">
        <div className="relative">
          <Avatar className="h-20 w-20 border-4 border-card shadow-md">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-lg bg-muted text-muted-foreground">
              {firstName[0]}{lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4">
            {getStatusIndicator()}
          </div>
        </div>
        
        <div className="mt-4 text-center space-y-1">
          <h3 className="font-display font-bold text-lg leading-tight group-hover:text-primary transition-colors">
            {firstName} {lastName}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">{jobPosition || "Team Member"}</p>
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/30 py-3 px-4 flex justify-between items-center text-xs text-muted-foreground border-t border-border/50">
        <span className="flex items-center gap-1.5">
          ID: <span className="font-mono text-foreground/80">EMP-{id.toString().padStart(3, '0')}</span>
        </span>
        <span className="font-medium text-primary/80 group-hover:text-primary hover:underline">View Profile →</span>
      </CardFooter>
    </Card>
  );
}
