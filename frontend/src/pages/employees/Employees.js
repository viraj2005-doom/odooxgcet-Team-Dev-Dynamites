import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  PlusIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { usersAPI, getImageUrl } from '../../services/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import CreateEmployeeForm from './CreateEmployeeForm';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getAll();
      setEmployees(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    try {
      const response = await usersAPI.getAll({ search: query });
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handleEmployeeClick = (employeeId) => {
    navigate(`/employees/${employeeId}`);
  };

  const handleCreateSuccess = (newEmployee) => {
    setShowCreateModal(false);
    fetchEmployees();
    toast.success(`Employee ${newEmployee.firstName} created successfully!`);
  };

  const getStatusIndicator = (status) => {
    switch (status) {
      case 'present':
        // Green dot: Employee is present in the office (checked in)
        return (
          <div className="absolute top-3 right-3">
            <div className="h-3 w-3 bg-green-500 rounded-full ring-2 ring-white" 
                 title="Present in office" />
          </div>
        );
      case 'on_leave':
        // Airplane icon: Employee is on approved leave
        return (
          <div className="absolute top-3 right-3">
            <PaperAirplaneIcon className="h-5 w-5 text-blue-500" title="On approved leave" />
          </div>
        );
      case 'absent':
        // Yellow dot: Employee has not applied time off and is absent
        return (
          <div className="absolute top-3 right-3">
            <div className="h-3 w-3 bg-yellow-500 rounded-full ring-2 ring-white" 
                 title="Absent (no time off applied)" />
          </div>
        );
      case 'not_checked_in':
      default:
        // Red dot: Default - Employee has not checked in yet today
        return (
          <div className="absolute top-3 right-3">
            <div className="h-3 w-3 bg-red-500 rounded-full ring-2 ring-white" 
                 title="Not checked in" />
          </div>
        );
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600">{employees.length} team members</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Add Employee Button (Admin Only) */}
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Employees Grid */}
      {employees.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600">
            {searchQuery ? 'Try a different search term.' : 'Get started by adding your first employee.'}
          </p>
          {isAdmin && !searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn-primary"
            >
              Add First Employee
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {employees.map((employee) => (
            <div
              key={employee._id}
              onClick={() => handleEmployeeClick(employee._id)}
              className="relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group"
            >
              {/* Status Indicator */}
              {getStatusIndicator(employee.statusIndicator)}

              {/* Profile Picture */}
              <div className="flex justify-center mb-4">
                {employee.profilePicture ? (
                  <img
                    src={getImageUrl(employee.profilePicture)}
                    alt={`${employee.firstName} ${employee.lastName}`}
                    className="h-20 w-20 rounded-full object-cover ring-4 ring-gray-100 group-hover:ring-primary-100"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center ring-4 ring-gray-100 group-hover:ring-primary-100">
                    <span className="text-white font-semibold text-xl">
                      {employee.firstName?.[0]}{employee.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Employee Info */}
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {employee.firstName} {employee.lastName}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {employee.jobPosition}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {employee.department}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Employee"
        size="lg"
      >
        <CreateEmployeeForm
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
};

// Add missing import
const { UsersIcon } = require('@heroicons/react/24/outline');

export default Employees;
