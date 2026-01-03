import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { usersAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resume');
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const isOwnProfile = user?._id === id || user?.id === id;

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setIsLoading(true);
      const response = await usersAPI.getById(id);
      setEmployee(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Employee not found</p>
      </div>
    );
  }

  // Define tabs based on access level
  const tabs = [
    { id: 'resume', label: 'Resume', show: true },
    { id: 'private', label: 'Private Info', show: isAdmin || isOwnProfile },
    { id: 'salary', label: 'Salary Info', show: isAdmin || isOwnProfile },
    { id: 'security', label: 'Security', show: isOwnProfile }
  ].filter(tab => tab.show);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resume':
        return <ResumeTab employee={employee} isAdmin={isAdmin} />;
      case 'private':
        return <PrivateInfoTab employee={employee} />;
      case 'salary':
        return <SalaryInfoTab employee={employee} isAdmin={isAdmin} />;
      case 'security':
        return <SecurityTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate('/employees')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back to Employees
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture */}
          {employee.profilePicture ? (
            <img
              src={employee.profilePicture}
              alt={employee.fullName}
              className="h-28 w-28 rounded-full object-cover ring-4 ring-gray-100"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center ring-4 ring-gray-100">
              <span className="text-white font-bold text-3xl">
                {employee.firstName?.[0]}{employee.lastName?.[0]}
              </span>
            </div>
          )}

          {/* Basic Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="text-lg text-primary-600 font-medium">
              {employee.jobPosition}
            </p>
            <p className="text-gray-500">{employee.department}</p>

            {/* Quick Info */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <EnvelopeIcon className="h-4 w-4" />
                {employee.email}
              </div>
              <div className="flex items-center gap-1">
                <PhoneIcon className="h-4 w-4" />
                {employee.mobile}
              </div>
              {employee.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {employee.location}
                </div>
              )}
            </div>

            {/* Login ID Display */}
            <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-gray-500">Login ID:</span>
              <code className="font-mono font-medium text-gray-800">{employee.loginId}</code>
            </div>
          </div>

          {/* Actions */}
          {isAdmin && !isOwnProfile && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/salary/${employee._id}`)}
                className="btn-secondary flex items-center gap-2"
              >
                <BanknotesIcon className="h-5 w-5" />
                Manage Salary
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

// Resume Tab Component
const ResumeTab = ({ employee, isAdmin }) => {
  return (
    <div className="space-y-6">
      {/* Work Information */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Job Position" value={employee.jobPosition} />
          <InfoItem label="Department" value={employee.department} />
          <InfoItem label="Employee Code" value={employee.employeeCode} />
          <InfoItem 
            label="Date of Joining" 
            value={employee.dateOfJoining ? format(new Date(employee.dateOfJoining), 'MMM d, yyyy') : '-'} 
          />
          <InfoItem label="Location" value={employee.location || '-'} />
          <InfoItem 
            label="Manager" 
            value={employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : '-'} 
          />
        </div>
      </section>

      {/* Contact Information */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Email" value={employee.email} />
          <InfoItem label="Mobile" value={employee.mobile} />
          <InfoItem label="Company" value={employee.company?.name || '-'} />
        </div>
      </section>

      {/* Skills (if admin profile) */}
      {employee.skills && employee.skills.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {employee.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {employee.certifications && employee.certifications.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
          <div className="space-y-3">
            {employee.certifications.map((cert, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900">{cert.name}</p>
                <p className="text-sm text-gray-500">{cert.issuingOrganization}</p>
                {cert.issueDate && (
                  <p className="text-xs text-gray-400 mt-1">
                    Issued: {format(new Date(cert.issueDate), 'MMM yyyy')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// Private Info Tab Component
const PrivateInfoTab = ({ employee }) => {
  return (
    <div className="space-y-6">
      {/* Personal Details */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem 
            label="Date of Birth" 
            value={employee.dateOfBirth ? format(new Date(employee.dateOfBirth), 'MMM d, yyyy') : '-'} 
          />
          <InfoItem label="Gender" value={employee.gender || '-'} />
          <InfoItem label="Marital Status" value={employee.maritalStatus || '-'} />
          <InfoItem label="Nationality" value={employee.nationality || '-'} />
          <InfoItem label="Personal Email" value={employee.personalEmail || '-'} />
        </div>
      </section>

      {/* Address */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
        {employee.address ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700">
              {[
                employee.address.street,
                employee.address.city,
                employee.address.state,
                employee.address.country,
                employee.address.zipCode
              ].filter(Boolean).join(', ') || '-'}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">No address provided</p>
        )}
      </section>

      {/* Banking & Compliance */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Banking & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem 
            label="Bank Account" 
            value={employee.bankDetails?.accountNumber 
              ? `****${employee.bankDetails.accountNumber.slice(-4)}` 
              : '-'
            } 
          />
          <InfoItem label="Bank Name" value={employee.bankDetails?.bankName || '-'} />
          <InfoItem label="IFSC Code" value={employee.bankDetails?.ifscCode || '-'} />
          <InfoItem label="PAN No" value={employee.panNumber || '-'} />
          <InfoItem label="UAN No" value={employee.uanNumber || '-'} />
        </div>
      </section>
    </div>
  );
};

// Salary Info Tab Component
const SalaryInfoTab = ({ employee, isAdmin }) => {
  const navigate = useNavigate();
  const salary = employee.salary || {};

  return (
    <div className="space-y-6">
      {/* Salary Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Salary Structure</h3>
          {isAdmin && (
            <button
              onClick={() => navigate(`/salary/${employee._id}`)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              Edit Salary
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-primary-600">Monthly Wage</p>
            <p className="text-2xl font-bold text-primary-700">
              ₹{salary.monthlyWage?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Yearly Wage</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{salary.yearlyWage?.toLocaleString() || '0'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Working Days/Week</p>
            <p className="text-2xl font-bold text-gray-700">
              {salary.workingDaysPerWeek || 5}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Break Time</p>
            <p className="text-2xl font-bold text-gray-700">
              {salary.breakTimeMinutes || 60} min
            </p>
          </div>
        </div>
      </section>

      {/* Salary Components */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
        <div className="bg-gray-50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Component</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Type</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Value</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(salary.components || []).map((component, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900">{component.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right capitalize">
                    {component.type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-right">
                    {component.type === 'percentage' ? `${component.value}%` : `₹${component.value}`}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                    ₹{component.calculatedAmount?.toLocaleString() || '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deductions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statutory Deductions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">PF (Employee)</p>
            <p className="text-xl font-bold text-red-700">
              {salary.deductions?.pfEmployeePercent || 12}%
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">PF (Employer)</p>
            <p className="text-xl font-bold text-red-700">
              {salary.deductions?.pfEmployerPercent || 12}%
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600">Professional Tax</p>
            <p className="text-xl font-bold text-red-700">
              ₹{salary.deductions?.professionalTax || 200}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

// Security Tab Component
const SecurityTab = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
        <p className="text-gray-600 mb-4">
          Ensure your account is using a strong password to stay secure.
        </p>
        <button
          onClick={() => navigate('/change-password')}
          className="btn-primary"
        >
          Change Password
        </button>
      </section>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-gray-900 font-medium">{value}</p>
  </div>
);

export default EmployeeProfile;
