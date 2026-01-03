import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { timeOffAPI, getImageUrl } from '../../services/api';
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { format, differenceInDays } from 'date-fns';

const TimeOffApprovals = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await timeOffAPI.getAllRequests({ status: filter !== 'all' ? filter : undefined });
      // Handle both array response and nested object response
      const data = response.data.data;
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data?.requests) {
        // Backend returns grouped requests - get the 'all' array or filter by status
        const allRequests = data.requests.all || [];
        setRequests(allRequests);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error('TimeOff fetch error:', error);
      toast.error('Failed to fetch requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setShowActionModal(true);
  };

  const handleActionConfirm = async (comment) => {
    try {
      if (actionType === 'approve') {
        await timeOffAPI.approve(selectedRequest._id, { comment });
        toast.success('Request approved!');
      } else {
        await timeOffAPI.reject(selectedRequest._id, { comment });
        toast.success('Request rejected');
      }
      setShowActionModal(false);
      setSelectedRequest(null);
      fetchRequests();
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  const getLeaveTypeBadge = (type) => {
    const styles = {
      annual: 'bg-blue-100 text-blue-800',
      sick: 'bg-red-100 text-red-800',
      personal: 'bg-purple-100 text-purple-800',
      unpaid: 'bg-gray-100 text-gray-800',
      maternity: 'bg-pink-100 text-pink-800',
      paternity: 'bg-cyan-100 text-cyan-800',
      bereavement: 'bg-gray-100 text-gray-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[type]}`}>
        {type}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/time-off')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Time Off
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Approvals</h1>
        <p className="text-gray-600">Review and manage employee leave requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
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
            {status === 'pending' && requests.length > 0 && filter !== 'pending' && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {requests.filter(r => r.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
            <p className="text-gray-600">
              {filter === 'pending' 
                ? 'No pending requests to review.' 
                : `No ${filter} requests found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request._id} className="p-4 hover:bg-gray-50">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Employee Info */}
                  <div className="flex items-center gap-3">
                    {request.user?.profilePicture ? (
                      <img 
                        src={getImageUrl(request.user.profilePicture)} 
                        alt="" 
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {request.user?.firstName?.[0]}{request.user?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {request.user?.firstName} {request.user?.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{request.user?.jobPosition}</p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 lg:px-6">
                    <div className="flex items-center gap-3 mb-1">
                      {getLeaveTypeBadge(request.leaveType)}
                      {getStatusBadge(request.status)}
                    </div>
                    <p className="text-gray-900">
                      {format(new Date(request.startDate), 'MMM d, yyyy')} 
                      {request.startDate !== request.endDate && (
                        <> — {format(new Date(request.endDate), 'MMM d, yyyy')}</>
                      )}
                      <span className="text-gray-500 ml-2">
                        ({differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1} day{request.isHalfDay ? ' - Half day' : 's'})
                      </span>
                    </p>
                    {request.reason && (
                      <p className="text-sm text-gray-500 mt-1">"{request.reason}"</p>
                    )}
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(request, 'approve')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium text-sm"
                      >
                        <CheckIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(request, 'reject')}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium text-sm"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Approved/Rejected Info */}
                  {request.status !== 'pending' && request.approvedBy && (
                    <div className="text-right text-sm text-gray-500">
                      <p>{request.status === 'approved' ? 'Approved' : 'Rejected'} by</p>
                      <p className="font-medium text-gray-900">
                        {request.approvedBy.firstName} {request.approvedBy.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedRequest(null);
        }}
        title={actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
      >
        <ActionForm
          request={selectedRequest}
          actionType={actionType}
          onConfirm={handleActionConfirm}
          onCancel={() => {
            setShowActionModal(false);
            setSelectedRequest(null);
          }}
        />
      </Modal>
    </div>
  );
};

// Action Form Component
const ActionForm = ({ request, actionType, onConfirm, onCancel }) => {
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onConfirm(comment);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Request Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="font-medium text-gray-900">
          {request?.user?.firstName} {request?.user?.lastName}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {request?.leaveType} leave: {format(new Date(request?.startDate), 'MMM d')} — {format(new Date(request?.endDate), 'MMM d, yyyy')}
        </p>
        {request?.reason && (
          <p className="text-sm text-gray-500 mt-2">Reason: "{request.reason}"</p>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="label">Comment (Optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input-field"
          placeholder={actionType === 'reject' ? 'Reason for rejection...' : 'Add a comment...'}
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
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
            actionType === 'approve'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          }`}
          disabled={isLoading}
        >
          {isLoading && <LoadingSpinner size="sm" />}
          {actionType === 'approve' ? 'Approve' : 'Reject'}
        </button>
      </div>
    </form>
  );
};

export default TimeOffApprovals;
