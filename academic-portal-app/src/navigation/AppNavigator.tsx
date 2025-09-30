import React, { useContext } from 'react';
import AuthNavigator from './AuthNavigator';
import { RoleContext } from '../context/RoleContext';
import StudentTabs from './StudentTabs';
import TeacherTabs from './TeacherTabs';

const AppNavigator = () => {
  const { isAuthenticated, role } = useContext(RoleContext);
  if (!isAuthenticated || !role) return <AuthNavigator />;
  return role === 'teacher' ? <TeacherTabs /> : <StudentTabs />;
};

export default AppNavigator;