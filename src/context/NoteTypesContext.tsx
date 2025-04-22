import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

interface NoteTypesContextType {
  noteTypes: string[];
  addNoteType: (type: string) => Promise<void>;
  removeNoteType: (type: string) => Promise<void>;
}

const NoteTypesContext = createContext<NoteTypesContextType | undefined>(undefined);

export const NoteTypesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [noteTypes, setNoteTypes] = useState<string[]>(['не выбрано', 'заметка', 'задача', 'код', 'документ']);

  useEffect(() => {
    loadNoteTypes();
  }, []);

  const loadNoteTypes = async () => {
    if (!auth.currentUser) return;

    try {
      const userSettingsDoc = await getDoc(doc(db, 'userSettings', auth.currentUser.uid));
      if (userSettingsDoc.exists()) {
        const data = userSettingsDoc.data();
        if (data.noteTypes) {
          setNoteTypes(data.noteTypes);
        } else {
          // Если типов нет, создаем дефолтные
          await setDoc(doc(db, 'userSettings', auth.currentUser.uid), {
            noteTypes: noteTypes
          }, { merge: true });
        }
      }
    } catch (error) {
      console.error('Error loading note types:', error);
    }
  };

  const addNoteType = async (type: string) => {
    if (!auth.currentUser) return;
    
    try {
      const newTypes = [...noteTypes, type];
      setNoteTypes(newTypes);
      await updateDoc(doc(db, 'userSettings', auth.currentUser.uid), {
        noteTypes: newTypes
      });
    } catch (error) {
      console.error('Error adding note type:', error);
    }
  };

  const removeNoteType = async (type: string) => {
    if (!auth.currentUser || type === 'не выбрано') return;

    try {
      const newTypes = noteTypes.filter(t => t !== type);
      setNoteTypes(newTypes);
      await updateDoc(doc(db, 'userSettings', auth.currentUser.uid), {
        noteTypes: newTypes
      });
    } catch (error) {
      console.error('Error removing note type:', error);
    }
  };

  return (
    <NoteTypesContext.Provider value={{ noteTypes, addNoteType, removeNoteType }}>
      {children}
    </NoteTypesContext.Provider>
  );
};

export const useNoteTypes = () => {
  const context = useContext(NoteTypesContext);
  if (context === undefined) {
    throw new Error('useNoteTypes must be used within a NoteTypesProvider');
  }
  return context;
}; 