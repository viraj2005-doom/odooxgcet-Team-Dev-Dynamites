import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { getImageUrl } from '../../services/api';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every minute
    const interval = setInterval(() => fetchNotifications(), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Employees', href: '/employees', icon: UsersIcon },
    { name: 'Attendance', href: '/attendance', icon: ClockIcon },
    { name: 'Time Off', href: '/time-off', icon: CalendarDaysIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo and Nav */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                type="button"
                className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>

              {/* Logo */}
              <div className="flex-shrink-0 flex items-center ml-2 lg:ml-0">
                {user?.company?.logo ? (
                  <img
                    src={user.company.logo.startsWith('http') ? user.company.logo : `${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000'}${user.company.logo}`}
                    alt={user.company.name}
                    className="h-8 w-auto"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className={`h-8 w-8 gradient-bg rounded-lg items-center justify-center ${user?.company?.logo ? 'hidden' : 'flex'}`}
                >
                  <span className="text-white font-bold text-sm">
                    {user?.company?.name?.[0] || 'D'}
                  </span>
                </div>
                <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">
                  Dayflow
                </span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex lg:ml-10 lg:space-x-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button
                onClick={() => navigate('/notifications')}
                className="relative p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                <BellIcon className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile Dropdown */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100">
                  {user?.profilePicture ? (
                    <img
                      src={getImageUrl(user.profilePicture)}
                      alt={user.fullName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <span className="hidden md:block text-sm font-medium text-gray-700">
                    {user?.firstName}
                  </span>
                </Menu.Button>

                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-primary-600 mt-1">
                        {user?.role === 'admin' ? 'HR Administrator' : 'Employee'}
                      </p>
                    </div>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => navigate('/profile')}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                        >
                          <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
                          My Profile
                        </button>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } flex items-center w-full px-4 py-2 text-sm text-red-600`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-red-400" />
                          Log Out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
