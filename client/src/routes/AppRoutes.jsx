import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import AppLayout from '../components/layout/AppLayout';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

// Employee Pages
import EmployeeDashboard from '../pages/employee/EmployeeDashboard';
import EmployeeAttendance from '../pages/employee/EmployeeAttendance';
import EmployeeLeaves from '../pages/employee/EmployeeLeaves';
import EmployeeTrainings from '../pages/employee/EmployeeTrainings';
import EmployeeAnnouncements from '../pages/employee/EmployeeAnnouncements';
import EmployeeProfile from '../pages/employee/EmployeeProfile';

// Manager Pages
import ManagerDashboard from '../pages/manager/ManagerDashboard';
import TeamManagement from '../pages/manager/TeamManagement';
import TeamAttendance from '../pages/manager/TeamAttendance';
import LeaveApprovals from '../pages/manager/LeaveApprovals';
import ManagerTrainingManagement from '../pages/manager/TrainingManagement';

// HR Pages
import HRDashboard from '../pages/hr/HRDashboard';
import EmployeeManagement from '../pages/hr/EmployeeManagement';
import DepartmentManagement from '../pages/hr/DepartmentManagement';
import AttendanceManagement from '../pages/hr/AttendanceManagement';
import HRLeaveManagement from '../pages/hr/LeaveManagement';
import AnnouncementManagement from '../pages/hr/AnnouncementManagement';
import HRTrainingManagement from '../pages/hr/TrainingManagement';
import ReportsAnalytics from '../pages/hr/ReportsAnalytics';

// Shared Pages
import NotificationsPage from '../pages/shared/NotificationsPage';
import SettingsPage from '../pages/shared/SettingsPage';
import NotFoundPage from '../pages/shared/NotFoundPage';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Authenticated Application */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Shared Common Routes */}
          <Route path="/announcements" element={<EmployeeAnnouncements />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Employee Routes */}
          <Route element={<ProtectedRoute allowedRoles={['EMPLOYEE', 'MANAGER', 'HR']} />}>
            <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
            <Route path="/employee/attendance" element={<EmployeeAttendance />} />
            <Route path="/employee/leaves" element={<EmployeeLeaves />} />
            <Route path="/employee/trainings" element={<EmployeeTrainings />} />
            <Route path="/employee/profile" element={<EmployeeProfile />} />
          </Route>

          {/* Manager Routes */}
          <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'HR']} />}>
            <Route path="/manager/dashboard" element={<ManagerDashboard />} />
            <Route path="/manager/team" element={<TeamManagement />} />
            <Route path="/manager/attendance" element={<TeamAttendance />} />
            <Route path="/manager/leaves" element={<LeaveApprovals />} />
            <Route path="/manager/trainings" element={<ManagerTrainingManagement />} />
          </Route>

          {/* HR Administrator Routes */}
          <Route element={<ProtectedRoute allowedRoles={['HR']} />}>
            <Route path="/hr/dashboard" element={<HRDashboard />} />
            <Route path="/hr/employees" element={<EmployeeManagement />} />
            <Route path="/hr/departments" element={<DepartmentManagement />} />
            <Route path="/hr/attendance" element={<AttendanceManagement />} />
            <Route path="/hr/leaves" element={<HRLeaveManagement />} />
            <Route path="/hr/trainings" element={<HRTrainingManagement />} />
            <Route path="/hr/announcements" element={<AnnouncementManagement />} />
            <Route path="/hr/reports" element={<ReportsAnalytics />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
