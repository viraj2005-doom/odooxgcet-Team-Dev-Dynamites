import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import { usersAPI, getImageUrl } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const MyProfile = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('resume');
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const isAdmin = user?.role === 'admin';

  // Different tabs for admin vs employee per wireframe
  const tabs = isAdmin 
    ? [
        { id: 'resume', label: 'Resume' },
        { id: 'private', label: 'Private Info' },
        { id: 'salary', label: 'Salary Info' }
      ]
    : [
        { id: 'resume', label: 'Resume' },
        { id: 'private', label: 'Private Info' },
        { id: 'salary', label: 'Salary Info' },
        { id: 'security', label: 'Security' }
      ];

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await usersAPI.uploadProfilePicture(formData);
      updateUser(response.data.data);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to update profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'resume':
        return <ResumeTab user={user} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'private':
        return <PrivateInfoTab user={user} isEditing={isEditing} setIsEditing={setIsEditing} />;
      case 'salary':
        return <SalaryInfoTab user={user} />;
      case 'security':
        return <SecurityTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Profile Picture with Upload */}
          <div className="relative">
            {user?.profilePicture ? (
              <img
                src={getImageUrl(user.profilePicture)}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-28 w-28 rounded-full object-cover ring-4 ring-gray-100"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center ring-4 ring-gray-100">
                <span className="text-white font-bold text-3xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            )}
            
            {/* Upload Button */}
            <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
                disabled={isUploading}
              />
              {isUploading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <CameraIcon className="h-5 w-5 text-gray-600" />
              )}
            </label>
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-lg text-primary-600 font-medium">
              {user?.jobPosition}
            </p>
            <p className="text-gray-500">{user?.department}</p>

            {/* Quick Info */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <EnvelopeIcon className="h-4 w-4" />
                {user?.email}
              </div>
              <div className="flex items-center gap-1">
                <PhoneIcon className="h-4 w-4" />
                {user?.mobile}
              </div>
              {user?.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  {user?.location}
                </div>
              )}
            </div>

            {/* Login ID Display */}
            <div className="mt-3 inline-flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
              <span className="text-gray-500">Login ID:</span>
              <code className="font-mono font-medium text-gray-800">{user?.loginId}</code>
            </div>
          </div>
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
const ResumeTab = ({ user, isEditing, setIsEditing }) => {
  const [formData, setFormData] = useState({
    about: user?.about || '',
    whatILoveAboutJob: user?.whatILoveAboutJob || '',
    interestsAndHobbies: user?.interestsAndHobbies || '',
    skills: user?.skills || [],
    certifications: user?.certifications || []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newCert, setNewCert] = useState({ name: '', issuingOrganization: '', issueDate: '' });
  const { updateUser } = useAuthStore();

  // Sync formData when user prop changes
  useEffect(() => {
    setFormData({
      about: user?.about || '',
      whatILoveAboutJob: user?.whatILoveAboutJob || '',
      interestsAndHobbies: user?.interestsAndHobbies || '',
      skills: user?.skills || [],
      certifications: user?.certifications || []
    });
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, { name: newSkill.trim(), proficiency: 'intermediate' }]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (newCert.name.trim()) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...newCert }]
      }));
      setNewCert({ name: '', issuingOrganization: '', issueDate: '' });
    }
  };

  const removeCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await usersAPI.updateProfile(formData);
      updateUser(response.data.data);
      toast.success('Resume info updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* About Section */}
        <div>
          <label className="label">About</label>
          <textarea
            name="about"
            value={formData.about}
            onChange={handleChange}
            rows={4}
            className="input-field"
            placeholder="Tell us about yourself..."
          />
        </div>

        {/* What I Love About My Job */}
        <div>
          <label className="label">What I Love About My Job</label>
          <textarea
            name="whatILoveAboutJob"
            value={formData.whatILoveAboutJob}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="What do you love about your job..."
          />
        </div>

        {/* Interests and Hobbies */}
        <div>
          <label className="label">My Interests and Hobbies</label>
          <textarea
            name="interestsAndHobbies"
            value={formData.interestsAndHobbies}
            onChange={handleChange}
            rows={3}
            className="input-field"
            placeholder="Your interests and hobbies..."
          />
        </div>

        {/* Skills */}
        <div>
          <label className="label">Skills</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {formData.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium flex items-center gap-2"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-primary-400 hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              className="input-field flex-1"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button type="button" onClick={addSkill} className="btn-secondary">
              + Add
            </button>
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="label">Certifications</label>
          <div className="space-y-2 mb-3">
            {formData.certifications.map((cert, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{cert.name}</p>
                  <p className="text-sm text-gray-500">{cert.issuingOrganization}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeCertification(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              type="text"
              value={newCert.name}
              onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
              placeholder="Certification name"
              className="input-field"
            />
            <input
              type="text"
              value={newCert.issuingOrganization}
              onChange={(e) => setNewCert({ ...newCert, issuingOrganization: e.target.value })}
              placeholder="Issuing organization"
              className="input-field"
            />
            <button type="button" onClick={addCertification} className="btn-secondary">
              + Add Certification
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            Save Changes
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {/* Edit Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
          <PencilIcon className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Work Information (Read-only) */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoItem label="Job Position" value={user?.jobPosition} />
          <InfoItem label="Department" value={user?.department} />
          <InfoItem label="Employee Code" value={user?.employeeCode} />
          <InfoItem 
            label="Date of Joining" 
            value={user?.dateOfJoining ? format(new Date(user.dateOfJoining), 'MMM d, yyyy') : '-'} 
          />
          <InfoItem label="Location" value={user?.location || '-'} />
          <InfoItem 
            label="Manager" 
            value={user?.manager ? `${user.manager.firstName} ${user.manager.lastName}` : '-'} 
          />
        </div>
      </section>

      {/* About Section */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">About</h3>
          <PencilIcon className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-gray-700 leading-relaxed">
          {user?.about || 'No description added yet. Click Edit to add your bio.'}
        </p>
      </section>

      {/* What I Love About My Job */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">What I Love About My Job</h3>
          <PencilIcon className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-gray-700 leading-relaxed">
          {user?.whatILoveAboutJob || 'Share what you love about your job...'}
        </p>
      </section>

      {/* Interests and Hobbies */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">My Interests and Hobbies</h3>
          <PencilIcon className="h-4 w-4 text-gray-400" />
        </div>
        <p className="text-gray-700 leading-relaxed">
          {user?.interestsAndHobbies || 'Tell us about your interests and hobbies...'}
        </p>
      </section>

      {/* Skills */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
        {user?.skills && user.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">+ Add Skills</p>
        )}
      </section>

      {/* Certifications */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Certifications</h3>
        {user?.certifications && user.certifications.length > 0 ? (
          <div className="space-y-3">
            {user.certifications.map((cert, index) => (
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
        ) : (
          <p className="text-gray-500">+ Add Certifications</p>
        )}
      </section>
    </div>
  );
};

// Private Info Tab Component (Editable)
const PrivateInfoTab = ({ user, isEditing, setIsEditing }) => {
  const [formData, setFormData] = useState({
    dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
    gender: user?.gender || '',
    maritalStatus: user?.maritalStatus || '',
    nationality: user?.nationality || '',
    personalEmail: user?.personalEmail || '',
    address: user?.address || {},
    bankDetails: user?.bankDetails || {},
    panNumber: user?.panNumber || '',
    uanNumber: user?.uanNumber || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useAuthStore();

  // Sync formData when user prop changes
  useEffect(() => {
    setFormData({
      dateOfBirth: user?.dateOfBirth?.split('T')[0] || '',
      gender: user?.gender || '',
      maritalStatus: user?.maritalStatus || '',
      nationality: user?.nationality || '',
      personalEmail: user?.personalEmail || '',
      address: user?.address || {},
      bankDetails: user?.bankDetails || {},
      panNumber: user?.panNumber || '',
      uanNumber: user?.uanNumber || ''
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: { ...prev.address, [addressField]: value }
      }));
    } else if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: { ...prev.bankDetails, [bankField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await usersAPI.updateProfile(formData);
      updateUser(response.data.data);
      toast.success('Private info updated!');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Marital Status</label>
            <select
              name="maritalStatus"
              value={formData.maritalStatus}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
          <div>
            <label className="label">Nationality</label>
            <input
              type="text"
              name="nationality"
              value={formData.nationality}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Personal Email</label>
            <input
              type="email"
              name="personalEmail"
              value={formData.personalEmail}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Street</label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street || ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">City</label>
              <input
                type="text"
                name="address.city"
                value={formData.address.city || ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">State</label>
              <input
                type="text"
                name="address.state"
                value={formData.address.state || ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Country</label>
              <input
                type="text"
                name="address.country"
                value={formData.address.country || ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">ZIP Code</label>
              <input
                type="text"
                name="address.zipCode"
                value={formData.address.zipCode || ''}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Bank Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Account Number</label>
              <input
                type="text"
                name="bankDetails.accountNumber"
                value={formData.bankDetails.accountNumber || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter account number"
              />
            </div>
            <div>
              <label className="label">Bank Name</label>
              <input
                type="text"
                name="bankDetails.bankName"
                value={formData.bankDetails.bankName || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <label className="label">IFSC Code</label>
              <input
                type="text"
                name="bankDetails.ifscCode"
                value={formData.bankDetails.ifscCode || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter IFSC code"
              />
            </div>
          </div>
        </div>

        {/* Identification */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Identification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">PAN Number</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter PAN number"
              />
            </div>
            <div>
              <label className="label">UAN Number</label>
              <input
                type="text"
                name="uanNumber"
                value={formData.uanNumber || ''}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter UAN number"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading && <LoadingSpinner size="sm" />}
            Save Changes
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsEditing(true)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
          <PencilIcon className="h-4 w-4" />
          Edit
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Personal Details */}
        <div className="space-y-6">
          {/* Personal Details */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
            <div className="space-y-3">
              <InfoItem 
                label="Date of Birth" 
                value={user?.dateOfBirth ? format(new Date(user.dateOfBirth), 'MMM d, yyyy') : '-'} 
              />
              <InfoItem label="Residing Address" value={
                user?.address ? [
                  user.address.street,
                  user.address.city,
                  user.address.state,
                  user.address.zipCode
                ].filter(Boolean).join(', ') : '-'
              } />
              <InfoItem label="Nationality" value={user?.nationality || '-'} />
              <InfoItem label="Personal Email" value={user?.personalEmail || '-'} />
              <InfoItem label="Gender" value={user?.gender || '-'} />
              <InfoItem label="Marital Status" value={user?.maritalStatus || '-'} />
              <InfoItem 
                label="Date of Joining" 
                value={user?.dateOfJoining ? format(new Date(user.dateOfJoining), 'MMM d, yyyy') : '-'} 
              />
            </div>
          </section>
        </div>

        {/* Right Column - Bank Details & IDs */}
        <div className="space-y-6">
          {/* Bank Details */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
            <div className="space-y-3">
              <InfoItem label="Account Number" value={user?.bankDetails?.accountNumber || '-'} />
              <InfoItem label="Bank Name" value={user?.bankDetails?.bankName || '-'} />
              <InfoItem label="IFSC Code" value={user?.bankDetails?.ifscCode || '-'} />
            </div>
          </section>

          {/* ID Details */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Identification</h3>
            <div className="space-y-3">
              <InfoItem label="PAN No" value={user?.panNumber || '-'} />
              <InfoItem label="UAN No" value={user?.uanNumber || '-'} />
              <InfoItem label="Emp Code" value={user?.employeeCode || '-'} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// Salary Info Tab Component (Read-only for Employee, Editable for Admin viewing other profiles)
const SalaryInfoTab = ({ user }) => {
  const salary = user?.salary || {};
  const monthlyWage = salary.monthlyWage || 0;
  const yearlyWage = salary.yearlyWage || monthlyWage * 12;

  // Calculate salary components based on percentages
  const basicSalary = monthlyWage * 0.5; // 50% of wage
  const hra = basicSalary * 0.5; // 50% of basic
  const standardAllowance = 4167; // Fixed amount
  const performanceBonus = basicSalary * 0.0833; // 8.33%
  const lta = basicSalary * 0.0833; // 8.33%
  const fixedAllowance = monthlyWage - basicSalary - hra - standardAllowance - performanceBonus - lta;

  // PF Calculations
  const pfEmployeePercent = salary.deductions?.pfEmployeePercent || 12;
  const pfEmployerPercent = salary.deductions?.pfEmployerPercent || 12;
  const pfEmployee = basicSalary * (pfEmployeePercent / 100);
  const pfEmployer = basicSalary * (pfEmployerPercent / 100);
  const professionalTax = salary.deductions?.professionalTax || 200;

  return (
    <div className="space-y-6">
      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          💡 Salary information is managed by HR. Contact your administrator for any queries.
        </p>
      </div>

      {/* Wage Overview */}
      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Wage Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-primary-600">Month Wage</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-primary-700">
                ₹{monthlyWage.toLocaleString()}
              </p>
              <span className="text-sm text-primary-500">/ Month</span>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Yearly Wage</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-green-700">
                ₹{yearlyWage.toLocaleString()}
              </p>
              <span className="text-sm text-green-500">/ Yearly</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">No of Working Days</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-700">
                {salary.workingDaysPerWeek || 5}
              </p>
              <span className="text-sm text-gray-500">/ week</span>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">Break Time</p>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-bold text-gray-700">
                {salary.breakTimeMinutes || 60}
              </p>
              <span className="text-sm text-gray-500">/ hrs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Layout for Components and PF */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Salary Components */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Components</h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Component</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Amount</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Basic Salary</p>
                    <p className="text-xs text-gray-500">Define Basic salary from company cost compute it based on monthly wages</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{basicSalary.toLocaleString()}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">50.00 %</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">House Rent Allowance</p>
                    <p className="text-xs text-gray-500">HRA provided to employees 50% of the basic salary</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{hra.toLocaleString()}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">50.00 %</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Standard Allowance</p>
                    <p className="text-xs text-gray-500">A standard allowance is a predetermined, fixed amount provided to employee</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{standardAllowance.toLocaleString()}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">16.67 %</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Performance Bonus</p>
                    <p className="text-xs text-gray-500">Variable amount paid during payroll, calculated as % of basic</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{performanceBonus.toFixed(2)}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">8.33 %</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Leave Travel Allowance</p>
                    <p className="text-xs text-gray-500">LTA paid by the company to cover travel expenses</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{lta.toFixed(2)}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">8.33 %</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">Fixed Allowance</p>
                    <p className="text-xs text-gray-500">Fixed allowance portion of wages after all components</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-medium">₹{Math.max(0, fixedAllowance).toFixed(2)}</span>
                    <span className="text-xs text-gray-500"> ₹/month</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">11.67 %</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* PF Contribution and Deductions */}
        <section className="space-y-6">
          {/* PF Contribution */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Provident Fund (PF) Contribution</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Employee</p>
                  <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">₹{pfEmployee.toFixed(2)}</span>
                  <span className="text-xs text-gray-500"> ₹/month</span>
                  <span className="text-sm text-gray-600 ml-2">{pfEmployeePercent}.00 %</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Employer</p>
                  <p className="text-xs text-gray-500">PF is calculated based on the basic salary</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">₹{pfEmployer.toFixed(2)}</span>
                  <span className="text-xs text-gray-500"> ₹/month</span>
                  <span className="text-sm text-gray-600 ml-2">{pfEmployerPercent}.00 %</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax Deductions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tax Deductions</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">Professional Tax</p>
                  <p className="text-xs text-gray-500">Professional Tax deducted from the Gross salary</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium">₹{professionalTax.toFixed(2)}</span>
                  <span className="text-xs text-gray-500"> ₹/month</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
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

      <section>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sessions</h3>
        <p className="text-gray-600 mb-4">
          Manage your active sessions across devices.
        </p>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Current Session</p>
              <p className="text-sm text-gray-500">Active now</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

// Info Item Component
const InfoItem = ({ label, value }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-gray-900 font-medium">{value || '-'}</p>
  </div>
);

export default MyProfile;
