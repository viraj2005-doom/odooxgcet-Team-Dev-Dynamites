import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  BanknotesIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { payrollAPI, usersAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import LoadingSpinner, { PageLoader } from '../../components/common/LoadingSpinner';
import { format } from 'date-fns';

const Salary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  // Determine which employee to show
  const employeeId = id || user?._id || user?.id;
  const isOwnSalary = employeeId === user?._id || employeeId === user?.id;
  const canEdit = isAdmin && !isOwnSalary;

  const [salaryData, setSalaryData] = useState({
    monthlyWage: 0,
    workingDaysPerWeek: 5,
    breakTimeMinutes: 60,
    components: [],
    deductions: {
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      professionalTax: 200
    }
  });

  useEffect(() => {
    fetchEmployeeData();
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    try {
      setIsLoading(true);
      const [userRes, salaryRes] = await Promise.all([
        usersAPI.getById(employeeId),
        payrollAPI.getSalaryInfo(employeeId)
      ]);
      setEmployee(userRes.data.data);
      if (salaryRes.data.data) {
        setSalaryData(prev => ({ ...prev, ...salaryRes.data.data }));
      }
    } catch (error) {
      toast.error('Failed to fetch salary data');
      navigate('/employees');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSalaryData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleDeductionChange = (e) => {
    const { name, value } = e.target;
    setSalaryData(prev => ({
      ...prev,
      deductions: {
        ...prev.deductions,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  const addComponent = () => {
    setSalaryData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        { name: '', type: 'fixed', value: 0 }
      ]
    }));
  };

  const updateComponent = (index, field, value) => {
    setSalaryData(prev => {
      const newComponents = [...prev.components];
      newComponents[index] = {
        ...newComponents[index],
        [field]: field === 'value' ? (parseFloat(value) || 0) : value
      };
      return { ...prev, components: newComponents };
    });
  };

  const removeComponent = (index) => {
    setSalaryData(prev => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await payrollAPI.updateSalary(employeeId, salaryData);
      toast.success('Salary updated successfully!');
      fetchEmployeeData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update salary');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPayslip = async () => {
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const response = await payrollAPI.getPayslip(employeeId, currentMonth);
      
      // Create download
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payslip_${currentMonth}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Payslip downloaded!');
    } catch (error) {
      toast.error('Failed to download payslip');
    }
  };

  // Calculate totals
  const calculateGross = () => {
    let total = salaryData.monthlyWage;
    salaryData.components?.forEach(comp => {
      if (comp.type === 'fixed') {
        total += comp.value;
      } else if (comp.type === 'percentage') {
        total += (salaryData.monthlyWage * comp.value) / 100;
      }
    });
    return total;
  };

  const calculateDeductions = () => {
    const gross = calculateGross();
    const pfEmployee = (gross * (salaryData.deductions?.pfEmployeePercent || 12)) / 100;
    const pt = salaryData.deductions?.professionalTax || 200;
    return pfEmployee + pt;
  };

  const calculateNet = () => {
    return calculateGross() - calculateDeductions();
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-5 w-5" />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isOwnSalary ? 'My Salary' : `${employee?.firstName}'s Salary`}
          </h1>
          <p className="text-gray-600">
            {employee?.jobPosition} • {employee?.department}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPayslip}
            className="btn-secondary flex items-center gap-2"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download Payslip
          </button>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2"
            >
              {isSaving && <LoadingSpinner size="sm" />}
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Salary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Salary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Monthly Wage (₹)</label>
                <input
                  type="number"
                  name="monthlyWage"
                  value={salaryData.monthlyWage}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Working Days/Week</label>
                <select
                  name="workingDaysPerWeek"
                  value={salaryData.workingDaysPerWeek}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="input-field"
                >
                  {[5, 6, 7].map(d => (
                    <option key={d} value={d}>{d} days</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Break Time (minutes)</label>
                <input
                  type="number"
                  name="breakTimeMinutes"
                  value={salaryData.breakTimeMinutes}
                  onChange={handleChange}
                  disabled={!canEdit}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Salary Components */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Salary Components</h2>
              {canEdit && (
                <button
                  onClick={addComponent}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Component
                </button>
              )}
            </div>

            {salaryData.components?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No salary components added</p>
            ) : (
              <div className="space-y-3">
                {salaryData.components?.map((component, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="text"
                      placeholder="Component name"
                      value={component.name}
                      onChange={(e) => updateComponent(index, 'name', e.target.value)}
                      disabled={!canEdit}
                      className="input-field flex-1"
                    />
                    <select
                      value={component.type}
                      onChange={(e) => updateComponent(index, 'type', e.target.value)}
                      disabled={!canEdit}
                      className="input-field w-32"
                    >
                      <option value="fixed">Fixed (₹)</option>
                      <option value="percentage">Percentage (%)</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Value"
                      value={component.value}
                      onChange={(e) => updateComponent(index, 'value', e.target.value)}
                      disabled={!canEdit}
                      className="input-field w-24"
                    />
                    {canEdit && (
                      <button
                        onClick={() => removeComponent(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Statutory Deductions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Statutory Deductions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">PF Employee (%)</label>
                <input
                  type="number"
                  name="pfEmployeePercent"
                  value={salaryData.deductions?.pfEmployeePercent || 12}
                  onChange={handleDeductionChange}
                  disabled={!canEdit}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">PF Employer (%)</label>
                <input
                  type="number"
                  name="pfEmployerPercent"
                  value={salaryData.deductions?.pfEmployerPercent || 12}
                  onChange={handleDeductionChange}
                  disabled={!canEdit}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Professional Tax (₹)</label>
                <input
                  type="number"
                  name="professionalTax"
                  value={salaryData.deductions?.professionalTax || 200}
                  onChange={handleDeductionChange}
                  disabled={!canEdit}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Salary Summary */}
        <div className="space-y-6">
          {/* Monthly Summary */}
          <div className="bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl p-6 text-white">
            <BanknotesIcon className="h-8 w-8 mb-4" />
            <p className="text-primary-100 text-sm">Net Monthly Salary</p>
            <p className="text-3xl font-bold mt-1">₹{calculateNet().toLocaleString()}</p>
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-primary-100">Gross Salary</span>
                <span className="font-medium">₹{calculateGross().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-primary-100">Total Deductions</span>
                <span className="font-medium">-₹{calculateDeductions().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Yearly Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Yearly Projection</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Annual CTC</span>
                <span className="font-semibold text-gray-900">
                  ₹{(calculateGross() * 12).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Net</span>
                <span className="font-semibold text-green-600">
                  ₹{(calculateNet() * 12).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Deductions</span>
                <span className="font-semibold text-red-600">
                  ₹{(calculateDeductions() * 12).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Component Breakdown */}
          {salaryData.components?.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Component Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Wage</span>
                  <span className="font-medium text-gray-900">
                    ₹{salaryData.monthlyWage.toLocaleString()}
                  </span>
                </div>
                {salaryData.components.map((comp, index) => {
                  const amount = comp.type === 'fixed' 
                    ? comp.value 
                    : (salaryData.monthlyWage * comp.value) / 100;
                  return (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {comp.name || 'Unnamed'} 
                        {comp.type === 'percentage' && ` (${comp.value}%)`}
                      </span>
                      <span className="font-medium text-gray-900">
                        ₹{amount.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;
