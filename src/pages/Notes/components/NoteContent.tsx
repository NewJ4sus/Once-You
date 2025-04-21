import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp, Unsubscribe } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { EditorComponent } from '@/pages/Notes/components/EditorComponent';
import { EditorContent } from '@/types/editor';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';

interface Note {
  id: string;
  title: string;
  type: string;
  content: EditorContent | null;
  contentRef: string;
  createdAt: Timestamp | Date;
  lastEditedAt: Timestamp | Date;
}

interface NoteContentProps {
  selectedNoteId: string | null;
}

const NoteContent: React.FC<NoteContentProps> = ({ selectedNoteId }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localType, setLocalType] = useState<Note['type']>('не выбрано');
  const editorRef = useRef<{ getContent: () => Promise<EditorContent | null> } | null>(null);

  useEffect(() => {
    if (!selectedNoteId || !auth.currentUser) {
      setNote(null);
      setLocalTitle('');
      setLocalType('не выбрано');
      return;
    }

    const userId = auth.currentUser.uid;
    let unsubscribeNote: Unsubscribe | null = null;
    let unsubscribeContent: Unsubscribe | null = null;

    unsubscribeNote = onSnapshot(
      doc(db, 'notes', userId, 'userNotes', selectedNoteId),
      (noteDoc) => {
        if (!noteDoc.exists()) {
          setNote(null);
          setLocalTitle('');
          setLocalType('не выбрано');
          return;
        }
        const noteData = noteDoc.data() as {
          title: string;
          type: string;
          contentRef: string;
          createdAt: Timestamp;
          lastEditedAt: Timestamp;
        };

        if (unsubscribeContent) {
          unsubscribeContent();
        }

        unsubscribeContent = onSnapshot(
          doc(db, 'noteContents', noteData.contentRef),
          (contentDoc) => {
            if (!contentDoc.exists()) {
              setNote(null);
              setLocalTitle('');
              setLocalType('не выбрано');
              return;
            }

            const content = contentDoc.data().content;
            setNote({
              id: noteDoc.id,
              ...noteData,
              content: content
            });
            setLocalTitle(noteData.title || '');
            setLocalType(noteData.type || 'не выбрано');
          }
        );
      }
    );

    return () => {
      if (unsubscribeNote) unsubscribeNote();
      if (unsubscribeContent) unsubscribeContent();
    };
  }, [selectedNoteId]);

  const handleSave = async () => {
    if (!note || !auth.currentUser || !editorRef.current) return;

    try {
      const userId = auth.currentUser.uid;
      const content = await editorRef.current.getContent();
      
      if (!content) return;

      await updateDoc(doc(db, 'notes', userId, 'userNotes', note.id), {
        title: localTitle,
        type: localType,
        lastEditedAt: new Date()
      });

      await updateDoc(doc(db, 'noteContents', note.contentRef), {
        content
      });
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const formatDate = (timestamp: Timestamp | Date | null) => {
    if (!timestamp) return '';
    
    try {
      if (timestamp && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('ru-RU');
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('ru-RU');
      }
      return new Date().toLocaleDateString('ru-RU');
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toLocaleDateString('ru-RU');
    }
  };

  if (!note) {
    return (
      <main className="ml-600">
        <div className='no_note_content'>Select a note to view its content</div>
      </main>
    );
  }

  return (
    <main className="ml-600">
      <div className="main-content">
        <div className="main-header">
          <div className="main-header-top sticky-header">
            <small className="main-header-top-date">
              {formatDate(note.createdAt)}
            </small>
            <div className="main-header-controls">
              <DropdownProvider>
                  <Dropdown
                    id="theme-color"
                    buttonContent={<span>{localType}</span>}
                    buttonClassName="min-w-150"
                  >
                    <ul className="dropdown-menu-list">
                      <li className="dropdown-menu-item">
                        <a onClick={() => setLocalType('не выбрано')}>не выбрано</a>
                      </li>
                      <li className="dropdown-menu-item">
                        <a onClick={() => setLocalType('Работа')}>Работа</a>
                      </li>
                      <li className="dropdown-menu-item">
                          <a onClick={() => setLocalType('Личное')}>Личное</a>
                      </li>
                      <li className="dropdown-menu-item">
                          <a onClick={() => setLocalType('Учеба')}>Учеба</a>
                      </li>
                      <li className="dropdown-menu-item">
                          <a onClick={() => setLocalType('Программирование')}>Программирование</a>
                      </li>
                    </ul>
                  </Dropdown>
              </DropdownProvider>
              <button className="btn btn-primary" onClick={handleSave}>
                Сохранить
              </button>
            </div>
          </div>
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            className="note-title"
            placeholder="Note title"
          />
        </div>
        <div className="note-content">
          <EditorComponent
            key={note.id}
            ref={editorRef}
            initialContent={note.content}
          />
        </div>
      </div>
    </main>
  );
};

export default NoteContent;