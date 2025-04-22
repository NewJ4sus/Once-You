import React from 'react';
import { useUserSettings } from '@/context/UserSettingsContext';
import { auth } from '@/config/firebase';

const UserDisplayName: React.FC = () => {
  const { userSettings } = useUserSettings();
  const user = auth.currentUser;

  const displayName = userSettings 
    ? (userSettings.firstName || userSettings.lastName
        ? `${userSettings.firstName} ${userSettings.lastName}`
        : user?.email)
    : "Loading...";

  return <span>{displayName}</span>;
};

export default UserDisplayName; 