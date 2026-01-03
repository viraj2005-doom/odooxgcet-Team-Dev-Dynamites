import { useAuth } from "@/hooks/use-auth";
import { useAttendance, useCheckIn, useCheckOut } from "@/hooks/use-attendance";
import LayoutShell from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function AttendancePage() {
  const { user } = useAuth();
  const { data: attendanceList, isLoading } = useAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  // Find today's record for current user
  const today = new Date().toISOString().split('T')[0];
  const todayRecord = attendanceList?.find(
    (record: any) => record.date === today && record.userId === user?.id
  );
  
  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCheckedOut = !!todayRecord?.checkOut;

  const handleAction = () => {
    if (isCheckedIn) {
      checkOut.mutate();
    } else if (!isCheckedOut) {
      checkIn.mutate();
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Action Card */}
          <Card className="flex-1 bg-gradient-to-br from-primary/5 to-transparent border-primary/20 shadow-lg">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold font-display">
                  {format(new Date(), "EEEE, MMMM do")}
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start">
                  <Clock className="h-4 w-4" /> 
                  Time now: {format(new Date(), "h:mm a")}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button 
                  size="lg" 
                  className={`
                    w-48 h-16 text-lg font-semibold shadow-xl transition-all
                    ${isCheckedIn 
                      ? "bg-destructive hover:bg-destructive/90 shadow-destructive/20" 
                      : isCheckedOut
                        ? "bg-secondary text-secondary-foreground cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 shadow-green-600/20"
                    }
                  `}
                  onClick={handleAction}
                  disabled={isCheckedOut || checkIn.isPending || checkOut.isPending}
                >
                  {isCheckedOut 
                    ? "Done for Today" 
                    : isCheckedIn 
                      ? "Check Out" 
                      : "Check In"
                  }
                </Button>
                {isCheckedIn && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Currently working...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Summary Card */}
          <Card className="md:w-80">
            <CardHeader>
              <CardTitle className="text-lg">My Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-sm text-muted-foreground">Check In</span>
                <span className="font-mono font-medium">
                  {todayRecord?.checkIn ? format(new Date(todayRecord.checkIn), "h:mm a") : "--:--"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Check Out</span>
                <span className="font-mono font-medium">
                  {todayRecord?.checkOut ? format(new Date(todayRecord.checkOut), "h:mm a") : "--:--"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card>
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Attendance History
             </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead className="text-right">Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Loading history...
                    </TableCell>
                  </TableRow>
                ) : attendanceList?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  attendanceList?.map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === "present" ? "default" : record.status === "absent" ? "destructive" : "secondary"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.checkIn ? format(new Date(record.checkIn), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.checkOut ? format(new Date(record.checkOut), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {record.workHours ? `${Number(record.workHours).toFixed(1)}h` : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
