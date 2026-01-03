import React, { useState, useEffect } from 'react';
import { 
  ClockIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { attendanceAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

const Attendance = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [todayRecord, setTodayRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  // Fetch today's attendance separately to persist check-in state
  const fetchTodayAttendance = async () => {
    try {
      const response = await attendanceAPI.getToday();
      setTodayRecord(response.data.data.attendance || null);
      setIsOnLeave(response.data.data.isOnLeave || false);
    } catch (error) {
      console.error('Failed to fetch today attendance');
    }
  };

  // Fetch today's record on initial mount
  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth]);

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const year = selectedMonth.getFullYear();
      const month = selectedMonth.getMonth() + 1;
      
      const response = await attendanceAPI.getMy({ year, month });
      setAttendanceRecords(response.data.data.records || []);
      setSummary(response.data.data.summary || null);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setIsChecking(true);
      const response = await attendanceAPI.checkIn();
      setTodayRecord(response.data.data);
      toast.success('Checked in successfully!');
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in');
    } finally {
      setIsChecking(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setIsChecking(true);
      const response = await attendanceAPI.checkOut();
      setTodayRecord(response.data.data);
      toast.success('Checked out successfully!');
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check out');
    } finally {
      setIsChecking(false);
    }
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1));
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      present: 'bg-green-100 text-green-800',
      absent: 'bg-red-100 text-red-800',
      half_day: 'bg-yellow-100 text-yellow-800',
      on_leave: 'bg-blue-100 text-blue-800',
      holiday: 'bg-purple-100 text-purple-800',
      weekend: 'bg-gray-100 text-gray-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600">Track your daily attendance and work hours</p>
        </div>

        {/* Admin Link */}
        {isAdmin && (
          <a
            href="/attendance/all"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Employees →
          </a>
        )}
      </div>

      {/* Today's Status Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Current Time & Date */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-500">Today</p>
            <p className="text-xl font-semibold text-gray-900">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-3xl font-bold text-primary-600 mt-1">
              <CurrentTime />
            </p>
          </div>

          {/* Check In/Out Status */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
            {todayRecord ? (
              <>
                {/* Check In Time */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">Checked In</p>
                  <p className="text-lg font-semibold text-green-600">
                    {format(new Date(todayRecord.checkIn), 'hh:mm a')}
                  </p>
                </div>

                {todayRecord.checkOut && (
                  <>
                    <div className="h-8 w-px bg-gray-200 hidden md:block" />
                    
                    {/* Check Out Time */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Checked Out</p>
                      <p className="text-lg font-semibold text-red-600">
                        {format(new Date(todayRecord.checkOut), 'hh:mm a')}
                      </p>
                    </div>

                    <div className="h-8 w-px bg-gray-200 hidden md:block" />

                    {/* Work Hours */}
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Work Hours</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {todayRecord.workHours?.toFixed(2) || '-'} hrs
                      </p>
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-gray-500">You haven't checked in today</p>
            )}
          </div>

          {/* Action Buttons */}
          <div>
            {!todayRecord ? (
              <button
                onClick={handleCheckIn}
                disabled={isChecking}
                className="btn-primary flex items-center gap-2 px-6"
              >
                {isChecking ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                )}
                Check In
              </button>
            ) : !todayRecord.checkOut ? (
              <button
                onClick={handleCheckOut}
                disabled={isChecking}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isChecking ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                )}
                Check Out
              </button>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-lg bg-green-100 text-green-800 font-medium">
                ✓ Completed for today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Present Days</p>
            <p className="text-2xl font-bold text-green-600">{summary.daysPresent || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Absent Days</p>
            <p className="text-2xl font-bold text-red-600">{summary.daysAbsent || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Leave Days</p>
            <p className="text-2xl font-bold text-blue-600">{summary.daysOnLeave || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Work Hours</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalWorkHours?.toFixed(1) || 0}</p>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Month Selector */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-gray-900 font-medium min-w-[150px] text-center">
              {format(selectedMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check Out</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Work Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No attendance records for this month
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {format(new Date(record.date), 'EEE, MMM d')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadge(record.status)}`}>
                        {record.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.checkIn ? format(new Date(record.checkIn), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.checkOut ? format(new Date(record.checkOut), 'hh:mm a') : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                      {record.workHours ? `${record.workHours.toFixed(2)} hrs` : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Current Time Component
const CurrentTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return format(time, 'hh:mm:ss a');
};

export default Attendance;
