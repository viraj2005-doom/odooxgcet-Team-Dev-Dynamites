import React, { useState, useEffect } from 'react';
import { 
  PlusIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { timeOffAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { format, differenceInDays } from 'date-fns';

const TimeOff = () => {
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // getMyRequests returns both requests and balances
      const response = await timeOffAPI.getMyRequests({ status: filter !== 'all' ? filter : undefined });
      const data = response.data.data;
      
      // Handle both array and object response
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests(data?.requests || []);
        if (data?.balances) {
          setBalances({
            paid: data.balances.paidTimeOff?.available || 0,
            sick: data.balances.sickLeave?.available || 0,
            annual: data.balances.paidTimeOff?.available || 0,
            personal: 5
          });
        }
      }
    } catch (error) {
      console.error('Time-off fetch error:', error);
      toast.error('Failed to fetch time-off data');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    setShowRequestModal(false);
    fetchData();
    toast.success('Time-off request submitted!');
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    const icons = {
      pending: <ClockIcon className="h-4 w-4" />,
      approved: <CheckCircleIcon className="h-4 w-4" />,
      rejected: <XCircleIcon className="h-4 w-4" />,
      cancelled: <XCircleIcon className="h-4 w-4" />
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  const getLeaveTypeBadge = (type) => {
    const styles = {
      paid: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      unpaid: 'bg-gray-100 text-gray-800'
    };
    const labels = {
      paid: 'Paid Leave',
      sick: 'Sick Leave',
      unpaid: 'Unpaid Leave'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  // For admin, show a different view focused on approvals
  if (isAdmin) {
    return (
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Time Off Management</h1>
            <p className="text-gray-600">Manage employee leave requests</p>
          </div>

          <a
            href="/time-off/approvals"
            className="btn-primary flex items-center gap-2"
          >
            View Pending Approvals →
          </a>
        </div>

        {/* Admin Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <CalendarDaysIcon className="mx-auto h-12 w-12 text-blue-400 mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Admin/HR Time Off Portal</h3>
          <p className="text-blue-700 max-w-md mx-auto">
            As an Admin or HR Officer, you can review and approve employee time-off requests. 
            Click "View Pending Approvals" to manage requests.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Off</h1>
          <p className="text-gray-600">Manage your leave requests and balances</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Admin Link */}
          {isAdmin && (
            <a
              href="/time-off/approvals"
              className="btn-secondary"
            >
              View Pending Approvals →
            </a>
          )}

          {/* Request button - NOT for admins */}
          {!isAdmin && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Request Time Off
            </button>
          )}
        </div>
      </div>

      {/* Leave Balances */}
      {balances && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-medium">Paid Leave</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-blue-700">{balances.paid || 0}</span>
              <span className="text-sm text-blue-500">days left</span>
            </div>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-sm text-red-600 font-medium">Sick Leave</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-red-700">{balances.sick || 0}</span>
              <span className="text-sm text-red-500">days left</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 font-medium">Unpaid Leave</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-gray-700">∞</span>
              <span className="text-sm text-gray-500">available</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No time-off requests</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't submitted any time-off requests yet." 
                : `No ${filter} requests found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request._id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getLeaveTypeBadge(request.type)}
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-gray-900 font-medium">
                      {format(new Date(request.startDate), 'MMM d, yyyy')} 
                      {request.startDate !== request.endDate && (
                        <> — {format(new Date(request.endDate), 'MMM d, yyyy')}</>
                      )}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {request.totalDays || differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1} day(s)
                      {request.isHalfDay && ' (Half day)'}
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-600 mt-2">{request.reason}</p>
                    )}
                  </div>

                  {/* Right: Status Info */}
                  {request.status !== 'pending' && request.reviewedBy && (
                    <div className="text-right text-sm text-gray-500">
                      <p>{request.status === 'approved' ? 'Approved by' : 'Reviewed by'}</p>
                      <p className="font-medium text-gray-900">
                        {request.reviewedBy.firstName} {request.reviewedBy.lastName}
                      </p>
                      {request.reviewNotes && (
                        <p className="mt-1 text-gray-600 italic">"{request.reviewNotes}"</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Time Off"
      >
        <TimeOffRequestForm 
          onSuccess={handleRequestSuccess}
          onCancel={() => setShowRequestModal(false)}
          balances={balances}
        />
      </Modal>
    </div>
  );
};

// Time Off Request Form Component
const TimeOffRequestForm = ({ onSuccess, onCancel, balances }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    leaveType: 'paid',
    startDate: '',
    endDate: '',
    isHalfDay: false,
    halfDayType: 'first_half',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate) {
      toast.error('Please select start and end dates');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      setIsLoading(true);
      // Map leaveType to backend expected 'type' field
      const submitData = {
        type: formData.leaveType, // Backend expects 'type' not 'leaveType'
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        isHalfDay: formData.isHalfDay,
        halfDayType: formData.halfDayType
      };
      await timeOffAPI.create(submitData);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  const getDaysCount = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const days = differenceInDays(new Date(formData.endDate), new Date(formData.startDate)) + 1;
    return formData.isHalfDay ? 0.5 : days;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Leave Type */}
      <div>
        <label className="label">Leave Type</label>
        <select
          name="leaveType"
          value={formData.leaveType}
          onChange={handleChange}
          className="input-field"
        >
          <option value="paid">Paid Leave ({balances?.paid || 0} days left)</option>
          <option value="sick">Sick Leave ({balances?.sick || 0} days left)</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="label">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
            className="input-field"
            required
          />
        </div>
      </div>

      {/* Half Day Option */}
      {formData.startDate === formData.endDate && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isHalfDay"
              checked={formData.isHalfDay}
              onChange={handleChange}
              className="h-4 w-4 text-primary-600 rounded"
            />
            <span className="text-sm text-gray-700">Half Day</span>
          </label>

          {formData.isHalfDay && (
            <select
              name="halfDayType"
              value={formData.halfDayType}
              onChange={handleChange}
              className="input-field w-auto"
            >
              <option value="first_half">First Half</option>
              <option value="second_half">Second Half</option>
            </select>
          )}
        </div>
      )}

      {/* Duration Display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Duration: <span className="font-medium text-gray-900">{getDaysCount()} day(s)</span>
        </p>
      </div>

      {/* Reason */}
      <div>
        <label className="label">Reason (Optional)</label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
          className="input-field"
          placeholder="Enter reason for leave..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner size="sm" />}
          Submit Request
        </button>
      </div>
    </form>
  );
};

export default TimeOff;
