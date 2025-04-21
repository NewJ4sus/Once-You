import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query,
  onSnapshot, 
  deleteDoc, 
  doc,
  serverTimestamp,
  getDoc,
  DocumentData,
  DocumentReference
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase';
import { useAppContext } from '@/context/AppContext';
import SVG from '@/components/SVG/SVG';
import './FolderNotes.css';

interface Note {
  id: string;
  title: string;
  type: string;
  content: {
    blocks: Array<{
      type: string;
      data: {
        text?: string;
      };
    }>;
  } | null;
  contentRef: string;
  createdAt: Date;
  lastEditedAt: Date;
}

interface FolderNotesProps {
  onNoteSelect: (noteId: string) => void;
  selectedNoteId: string | null;
}

const FolderNotes: React.FC<FolderNotesProps> = ({ onNoteSelect, selectedNoteId }) => {
  const { isFolderOpen, folderRef } = useAppContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [hideNoteText, setHideNoteText] = useState(false);
  
  const folderClassName = `folder-notes ${isFolderOpen ? 'active' : ''}`;

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const notesRef = collection(db, 'notes', userId, 'userNotes');
    const q = query(notesRef);

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      // Создаем массив промисов для загрузки содержимого
      const contentPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const contentRef = data.contentRef;
        
        // Загружаем содержимое заметки
        let content = null;
        if (contentRef) {
          try {
            const contentDocRef: DocumentReference<DocumentData> = doc(db, 'noteContents', contentRef);
            const contentDoc = await getDoc(contentDocRef);
            if (contentDoc.exists()) {
              const contentData = contentDoc.data();
              if (contentData && typeof contentData.content === 'object') {
                content = contentData.content;
              }
            }
          } catch (error) {
            console.error('Error loading note content:', error);
          }
        }
        
        return {
          id: docSnapshot.id,
          title: data.title || '',
          type: data.type || 'не выбрано',
          content: content,
          contentRef: contentRef || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          lastEditedAt: data.lastEditedAt?.toDate() || new Date()
        } as Note;
      });
      
      // Ждем загрузки всех заметок
      const notes = await Promise.all(contentPromises);
      
      // Сортируем заметки по дате последнего редактирования
      notes.sort((a, b) => b.lastEditedAt.getTime() - a.lastEditedAt.getTime());
      setNotes(notes);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userId = auth.currentUser.uid;
    const userSettingsRef = doc(db, 'userSettings', userId);

    const unsubscribe = onSnapshot(userSettingsRef, (doc) => {
      if (doc.exists()) {
        const settings = doc.data();
        setHideNoteText(settings.hideNoteText || false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAddNote = async () => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const now = serverTimestamp(); // Use serverTimestamp for consistency
      
      // Create content document first
      const contentDoc = await addDoc(collection(db, 'noteContents'), {
        content: {
          blocks: [
            {
              type: "paragraph",
              data: {
                text: "Start writing your note here..."
              }
            }
          ]
        },
        createdAt: now,
        lastEditedAt: now
      });

      // Create note document
      const noteDoc = await addDoc(collection(db, 'notes', userId, 'userNotes'), {
        title: 'Новая заметка',
        type: 'не выбрано',
        createdAt: now,
        lastEditedAt: now,
        contentRef: contentDoc.id
      });

      // Select the new note
      onNoteSelect(noteDoc.id);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      const note = notes.find(n => n.id === noteId);
      
      if (note) {
        // Delete content document
        await deleteDoc(doc(db, 'noteContents', note.contentRef));
        
        // Delete note document
        await deleteDoc(doc(db, 'notes', userId, 'userNotes', noteId));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <aside className={folderClassName} ref={folderRef}>
      <button className="folder-notes__add-button" onClick={handleAddNote}>
        Создать файл
      </button>
      <div className="card-block">
        {notes.map(note => {
          return (
            <div 
              key={note.id}
              className={`card ${selectedNoteId === note.id ? 'active' : ''}`}
              onClick={() => onNoteSelect(note.id)}
            >
              <div className="card-header">
                <small>{note.type}</small>
                <small>{note.lastEditedAt.toLocaleDateString('ru-RU')}</small>
              </div>
              <div className="card-body">
                <span>{note.title}</span>
                <small className={hideNoteText ? 'placeholders-note-text' : ''}>
                  {(() => {
                    if (hideNoteText) {
                      return '';
                    }

                    if (!note.content?.blocks) {
                      return 'Empty note...';
                    }
                    
                    // Ищем первый блок с текстовым содержимым
                    const textBlock = note.content.blocks.find((block: { type: string; data: { text?: string } }) => {
                      if (block.type === 'paragraph' && block.data?.text) {
                        return true;
                      }
                      if (block.type === 'header' && block.data?.text) {
                        return true;
                      }
                      return false;
                    });

                    if (!textBlock) {
                      return 'Empty note...';
                    }

                    return textBlock.data.text;
                  })()}
                </small>
              </div>
              <button 
                className="close-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteNote(note.id);
                }}
              >
                <SVG name="close"/>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default FolderNotes;