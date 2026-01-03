import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { attendanceAPI, usersAPI } from '../../services/api';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

const AttendanceAdmin = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      fetchAttendance();
    } else {
      fetchAllAttendance();
    }
  }, [selectedMonth, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await usersAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Failed to fetch employees');
    }
  };

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      const response = await attendanceAPI.getAllAttendance({
        userId: selectedEmployee,
        startDate: start,
        endDate: end
      });
      
      setAttendanceRecords(response.data.data.records || []);
      setSummary(response.data.data.summary || null);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAttendance = async () => {
    try {
      setIsLoading(true);
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      const response = await attendanceAPI.getAllAttendance({
        startDate: start,
        endDate: end
      });
      
      setAttendanceRecords(response.data.data.records || []);
      setSummary(response.data.data.summary || null);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setSelectedMonth(subMonths(selectedMonth, 1));
    } else {
      setSelectedMonth(addMonths(selectedMonth, 1));
    }
  };

  const handleExport = async () => {
    try {
      const start = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');
      
      const response = await attendanceAPI.exportAttendance({
        startDate: start,
        endDate: end,
        userId: selectedEmployee || undefined
      });
      
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${format(selectedMonth, 'yyyy-MM')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Attendance exported successfully!');
    } catch (error) {
      toast.error('Failed to export attendance');
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

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.loginId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && !employees.length) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/attendance')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to My Attendance
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Attendance</h1>
          <p className="text-gray-600">View and manage employee attendance records</p>
        </div>

        <button
          onClick={handleExport}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Employee Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input-field"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName} ({emp.loginId})
                </option>
              ))}
            </select>
          </div>

          {/* Month Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
              </button>
              <span className="flex-1 text-center font-medium text-gray-900">
                {format(selectedMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-lg border border-gray-300"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalEmployees || employees.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Present Today</p>
            <p className="text-2xl font-bold text-green-600">{summary.presentToday || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Absent Today</p>
            <p className="text-2xl font-bold text-red-600">{summary.absentToday || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">On Leave</p>
            <p className="text-2xl font-bold text-blue-600">{summary.onLeave || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-sm text-gray-500">Avg Work Hours</p>
            <p className="text-2xl font-bold text-purple-600">{summary.avgWorkHours?.toFixed(1) || 0}</p>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check In</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Check Out</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Work Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                    </div>
                  </td>
                </tr>
              ) : attendanceRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No attendance records found for this period
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {record.user?.profilePicture ? (
                          <img 
                            src={record.user.profilePicture} 
                            alt="" 
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">
                              {record.user?.firstName?.[0]}{record.user?.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {record.user?.firstName} {record.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{record.user?.loginId}</p>
                        </div>
                      </div>
                    </td>
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

export default AttendanceAdmin;
