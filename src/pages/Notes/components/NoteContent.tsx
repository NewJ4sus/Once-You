import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { EditorComponent } from '@/pages/Notes/components/EditorComponent';
import type { Note } from '@/types/note';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';

interface NoteContentProps {
  selectedNoteId: string | null;
}

const NoteContent: React.FC<NoteContentProps> = ({ selectedNoteId }) => {
  const [note, setNote] = useState<Note | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localType, setLocalType] = useState<Note['type']>('не выбрано');
  const editorRef = useRef<{ getContent: () => Promise<any> } | null>(null);

  useEffect(() => {
    if (!selectedNoteId || !auth.currentUser) {
      setNote(null);
      setLocalTitle('');
      setLocalType('не выбрано');
      return;
    }

    const userId = auth.currentUser.uid;
    let unsubscribeNote = null;
    let unsubscribeContent = null;

    unsubscribeNote = onSnapshot(
      doc(db, 'notes', userId, 'userNotes', selectedNoteId),
      (noteDoc) => {
        if (!noteDoc.exists()) {
          setNote(null);
          setLocalTitle('');
          setLocalType('не выбрано');
          return;
        }
        const noteData = noteDoc.data();

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

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      // Проверяем, является ли timestamp объектом Timestamp из Firebase
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('ru-RU');
      }
      // Если это уже объект Date
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString('ru-RU');
      }
      // В случае ошибки возвращаем текущую дату
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