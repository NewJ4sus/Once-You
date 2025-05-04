import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

interface UserSettings {
    firstName: string;
    lastName: string;
    themeColor: 'light' | 'dark';
    background: 'solid' | 'noise' | 'gradient';
    language: string;
    hideNoteText: boolean;
    group: 'admin' | 'moderator' | 'user';
}

const defaultSettings: UserSettings = {
    firstName: '',
    lastName: '',
    themeColor: 'dark',
    background: 'solid',
    language: 'ru',
    hideNoteText: false,
    group: 'user'
};

export const getUserSettings = async (): Promise<UserSettings> => {
    if (!auth.currentUser) {
        return defaultSettings;
    }

    try {
        const userId = auth.currentUser.uid;
        const settingsRef = doc(db, 'userSettings', userId);
        const settingsDoc = await getDoc(settingsRef);

        if (settingsDoc.exists()) {
            return settingsDoc.data() as UserSettings;
        } else {
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