import React, { useEffect, useRef, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { BlockToolConstructable, InlineToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { DropdownProvider, Dropdown } from '@/components/Dropdown/Dropdown';
import { useNoteTypes } from '@/context/NoteTypesContext';
import { useTranslation } from '@/i18n/TranslationContext';

interface NoteContentProps {
  noteId: string | null;
}

const NoteContent: React.FC<NoteContentProps> = ({ noteId }) => {
  const { noteTypes } = useNoteTypes();
  const { t } = useTranslation();

  const editorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [noteContent, setNoteContent] = useState<OutputData | null>(null);
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('не выбрано');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    if (noteId) {
      fetchNoteContent();
    }
  }, [noteId]);

  useEffect(() => {
    if (!isLoading && noteId && noteContent !== null) {
      initializeEditor();
    }
    return () => destroyEditor();
  }, [isLoading, noteContent]);

  useEffect(() => {
    console.log('Editor ready state changed:', isEditorReady);
  }, [isEditorReady]);

  const fetchNoteContent = async () => {
    setIsLoading(true);
    if (!noteId || !auth.currentUser) {
      resetState();
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const noteDocRef = doc(db, 'notes', userId, 'userNotes', noteId);
      const noteDoc = await getDoc(noteDocRef);

      if (noteDoc.exists()) {
        const { title = '', type = t('notes.noSelected'), contentRef } = noteDoc.data();
        setTitle(title);
        setFileType(type);

        if (contentRef) {
          const contentDoc = await getDoc(doc(db, 'noteContents', contentRef));
          if (contentDoc.exists()) {
            const contentData = contentDoc.data().content;
            setNoteContent({
              blocks: contentData.blocks || [],
              time: contentData.time || Date.now(),
              version: contentData.version || '2.26.5',
            });
          } else {
            setNoteContent({ blocks: [] });
          }
        } else {
          setNoteContent({ blocks: [] });
        }
      }
    } catch (error) {
      console.error('Failed to load note content:', error);
      setNoteContent({ blocks: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setNoteContent(null);
    setTitle('');
    setFileType(t('notes.noSelected'));
    setIsLoading(false);
  };

  const initializeEditor = async () => {
    if (!editorContainerRef.current) return;

    if (editorRef.current) {
      await editorRef.current.isReady;
      await editorRef.current.destroy();
      editorRef.current = null;
    }

    const editor = new EditorJS({
      holder: editorContainerRef.current,
      tools: {
        header: { class: Header as BlockToolConstructable, config: { placeholder: 'Заголовок', levels: [1, 2, 3], defaultLevel: 2 } },
        paragraph: { class: Paragraph as BlockToolConstructable, inlineToolbar: true },
        list: { class: List as BlockToolConstructable, inlineToolbar: true, config: { defaultStyle: 'unordered' } },
        code: { class: Code as BlockToolConstructable, config: { placeholder: t('notes.code') } },
        inlineCode: { class: InlineCode as InlineToolConstructable },
        quote: { class: Quote, inlineToolbar: true, config: { quotePlaceholder: t('notes.quotePlaceholder'), captionPlaceholder: t('notes.captionPlaceholder') } },
      },
      data: noteContent || { blocks: [] },
      onReady: () => setIsEditorReady(true),
      onChange: async () => {
        if (editorRef.current) {
          try {
            const savedData = await editorRef.current.save();
            saveNoteContent(savedData);
          } catch (error) {
            console.error('Save error:', error);
          }
        }
      },
    });

    editorRef.current = editor;
  };

  const destroyEditor = async () => {
    if (editorRef.current) {
      await editorRef.current.isReady;
      await editorRef.current.destroy();
      editorRef.current = null;
    }
  };

  const saveNoteContent = async (content: OutputData) => {
    if (!noteId || !auth.currentUser || !isEditorReady) return;

    try {
      setSaveStatus('saving');
      const userId = auth.currentUser.uid;
      const cleanBlocks = content.blocks.map(block => ({
        ...block,
        data: Object.fromEntries(Object.entries(block.data || {}).filter(([, v]) => v !== undefined))
      }));

      const contentToSave = { blocks: cleanBlocks, time: content.time || Date.now(), version: content.version || '2.26.5' };
      const noteDoc = await getDoc(doc(db, 'notes', userId, 'userNotes', noteId));

      if (noteDoc.exists()) {
        const { contentRef } = noteDoc.data();

        if (contentRef) {
          await updateDoc(doc(db, 'noteContents', contentRef), { content: contentToSave, lastEditedAt: new Date() });
          await updateDoc(doc(db, 'notes', userId, 'userNotes', noteId), { lastEditedAt: new Date() });
        }
      }
      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving content:', error);
      setSaveStatus('error');
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!noteId || !auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'notes', auth.currentUser.uid, 'userNotes', noteId), {
        title: newTitle,
        lastEditedAt: new Date()
      });
    } catch (error) {
      console.error('Title update error:', error);
    }
  };

  const handleFileTypeChange = async (type: string) => {
    setFileType(type);
    if (!noteId || !auth.currentUser) return;

    try {
      await updateDoc(doc(db, 'notes', auth.currentUser.uid, 'userNotes', noteId), {
        type,
        lastEditedAt: new Date()
      });
    } catch (error) {
      console.error('Type update error:', error);
    }
  };

  if (!noteId) {
    return <main className="ml-600"><div className="no_note_content"><p>{t('notes.noSelected')}</p></div></main>;
  }

  if (isLoading) {
    return <main className="ml-600"><div className="no_note_content"><p>{t('notes.loading')}</p></div></main>;
  }

  return (
    <DropdownProvider>
      <main className='ml-600'>
        <div className="main-content">
          <div className="main-header">
          <div className="main-header-top">
              <div className="main-header-top-left">
                <div className="save-status">
                    {saveStatus === 'saved' && <kbd className="kdb-save-status">сохранено</kbd>}
                    {saveStatus === 'saving' && <kbd className="kdb-saving-status">сохранение</kbd>}
                    {saveStatus === 'error' && <kbd className="kdb-error-status">ошибка</kbd>}
                </div> 
                <input
                  type="text"
                  className="note-title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder={t('notes.noteTitle')}
                />
              </div>
              <div className="main-header-controls"> 
                <Dropdown
                  id="file-type"
                  buttonContent={<span>{fileType}</span>}
                  buttonClassName="min-w-150"
                >
                  <ul className="dropdown-menu-list">
                    {noteTypes.map((type) => (
                      <li key={type} className="dropdown-menu-item">
                        <a href="#" onClick={() => handleFileTypeChange(type)}>
                          {type}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Dropdown>
              </div>
            </div>
          </div>
          
          <div ref={editorContainerRef} className="editor-container"></div>
        </div>
      </main>
    </DropdownProvider>
  );
};

export default NoteContent;
