import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usersAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CreateEmployeeForm = ({ onSuccess, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    jobPosition: '',
    department: '',
    dateOfJoining: new Date().toISOString().split('T')[0],
    location: '',
    gender: '',
    dateOfBirth: '',
    nationality: ''
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await usersAPI.getDepartments();
      setDepartments(response.data.data);
    } catch (error) {
      console.error('Failed to fetch departments');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.mobile || !formData.jobPosition || !formData.department || 
        !formData.dateOfJoining) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await usersAPI.create(formData);
      
      // Show the generated credentials
      const { loginId, tempPassword } = response.data.data;
      toast.success(
        <div>
          <p className="font-medium">✅ Employee created successfully!</p>
          <p className="text-sm mt-1">Login ID: <code className="bg-gray-100 px-1 rounded">{loginId}</code></p>
          <p className="text-sm">Temp Password: <code className="bg-gray-100 px-1 rounded">{tempPassword}</code></p>
          <p className="text-xs text-gray-500 mt-2">📧 Verification email sent to employee</p>
        </div>,
        { duration: 10000 }
      );
      
      onSuccess(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="label">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            className="input-field"
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="label">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            className="input-field"
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="label">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input-field"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        {/* Mobile */}
        <div>
          <label htmlFor="mobile" className="label">
            Mobile <span className="text-red-500">*</span>
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            required
            className="input-field"
            value={formData.mobile}
            onChange={handleChange}
          />
        </div>

        {/* Job Position */}
        <div>
          <label htmlFor="jobPosition" className="label">
            Job Position <span className="text-red-500">*</span>
          </label>
          <input
            id="jobPosition"
            name="jobPosition"
            type="text"
            required
            className="input-field"
            placeholder="e.g., Software Engineer"
            value={formData.jobPosition}
            onChange={handleChange}
          />
        </div>

        {/* Department */}
        <div>
          <label htmlFor="department" className="label">
            Department <span className="text-red-500">*</span>
          </label>
          <input
            id="department"
            name="department"
            type="text"
            list="departments"
            required
            className="input-field"
            placeholder="e.g., Engineering"
            value={formData.department}
            onChange={handleChange}
          />
          <datalist id="departments">
            {departments.map((dept) => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
        </div>

        {/* Date of Joining */}
        <div>
          <label htmlFor="dateOfJoining" className="label">
            Date of Joining <span className="text-red-500">*</span>
          </label>
          <input
            id="dateOfJoining"
            name="dateOfJoining"
            type="date"
            required
            className="input-field"
            value={formData.dateOfJoining}
            onChange={handleChange}
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="label">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            className="input-field"
            placeholder="e.g., Mumbai, India"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        {/* Gender */}
        <div>
          <label htmlFor="gender" className="label">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            className="input-field"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
        </div>

        {/* Date of Birth */}
        <div>
          <label htmlFor="dateOfBirth" className="label">
            Date of Birth
          </label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className="input-field"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">📌 Important</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Login ID will be auto-generated based on company code, initials, and joining year</li>
          <li>A temporary password will be generated and shown after creation</li>
          <li>The employee will be required to change their password on first login</li>
        </ul>
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
          Create Employee
        </button>
      </div>
    </form>
  );
};

export default CreateEmployeeForm;
