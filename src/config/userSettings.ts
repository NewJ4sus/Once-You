import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

interface UserSettings {
    firstName: string;
    lastName: string;
    themeColor: 'light' | 'dark';
    themeType: 'standard' | 'glass';
    background: 'solid' | 'noise' | 'gradient';
    language: string;
    hideNoteText: boolean;
    notifications: boolean;
    group: 'admin' | 'moderator' | 'user';
}

const defaultSettings: UserSettings = {
    firstName: '',
    lastName: '',
    themeColor: 'dark',
    themeType: 'standard',
    background: 'solid',
    language: 'ru',
    hideNoteText: false,
    notifications: true,
    group: 'user'
};

export const getUserSettings = async (): Promise<UserSettings> => {
    if (!auth.currentUser) {
        console.log('getUserSettings: No current user');
        return defaultSettings;
    }

    try {
        const userId = auth.currentUser.uid;
        console.log('getUserSettings: Getting settings for user', userId);
        const settingsRef = doc(db, 'userSettings', userId);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            console.log('getUserSettings: Settings exist for user', userId);
            return settingsDoc.data() as UserSettings;
        } else {
            console.log('getUserSettings: Creating default settings for user', userId);
            // If settings don't exist, create them with default values
            await setDoc(settingsRef, defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error('Error getting user settings:', error);
        return defaultSettings;
    }
};

export const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    if (!auth.currentUser) return;

    try {
        const userId = auth.currentUser.uid;
        const settingsRef = doc(db, 'userSettings', userId);
        await updateDoc(settingsRef, newSettings);
    } catch (error) {
        console.error('Error updating user settings:', error);
    }
}; 