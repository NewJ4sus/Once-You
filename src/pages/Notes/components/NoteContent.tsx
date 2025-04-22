import React, { useEffect, useRef, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { BlockToolConstructable, InlineToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
// import Table from '@editorjs/table';
// import LinkTool from '@editorjs/link';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { Dropdown, DropdownProvider } from '@/components/Dropdown/Dropdown';
import { useNoteTypes } from '@/context/NoteTypesContext';
import { useTranslation } from '@/i18n/TranslationContext';

interface NoteContentProps {
  noteId: string | null;
}

const NoteContent: React.FC<NoteContentProps> = ({ noteId }) => {
  const { noteTypes } = useNoteTypes();
  const editorRef = useRef<EditorJS | null>(null);
  const [noteContent, setNoteContent] = useState<OutputData | null>(null);
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('не выбрано');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const initEditor = async () => {
    if (!editorContainerRef.current) {
      console.error('Editor container not found');
      return;
    }

    if (editorRef.current) {
      try {
        await editorRef.current.isReady;
        await editorRef.current.destroy();
      } catch (error) {
        console.error('Error destroying editor:', error);
      }
      editorRef.current = null;
    }

    try {
      const editor = new EditorJS({
        holder: editorContainerRef.current,
        tools: {
          header: {
            class: Header as BlockToolConstructable,
            config: {
              placeholder: 'Enter a header',
              levels: [1, 2, 3, 4],
              defaultLevel: 2
            }
          },
          paragraph: {
            class: Paragraph as BlockToolConstructable,
            inlineToolbar: true
          },
          list: {
            class: List as BlockToolConstructable,
            inlineToolbar: true,
            config: {
              defaultStyle: 'unordered'
            }
          },
          code: {
            class: Code as BlockToolConstructable,
            config: {
              placeholder: t('notes.code'),
            }
          },
          inlineCode: {
            class: InlineCode as InlineToolConstructable
          },
          quote: {
            class: Quote,
            inlineToolbar: true,
            config: {
              quotePlaceholder: t('notes.quotePlaceholder'),
              captionPlaceholder: t('notes.captionPlaceholder'),
            },
          },
          // table: {
          //   class: Table as BlockToolConstructable,
          //   inlineToolbar: true,
          //   config: {
          //     rows: 2,
          //     cols: 3,
          //     withHeadings: true
          //   }
          // },
          // linkTool: {
          //   class: LinkTool as BlockToolConstructable,
          //   config: {
          //     endpoint: '/api/fetchUrl',
          //     placeholder: 'Paste a link',
          //   }
          // }
        },
        data: noteContent || { blocks: [] },
        onReady: () => setIsEditorReady(true),
        onChange: async () => {
          if (editorRef.current) {
            try {
              const savedData = await editorRef.current.save();
              await saveContent(savedData);
            } catch (error) {
              console.error('Error saving content:', error);
            }
          }
        }
      });

      editorRef.current = editor;
    } catch (error) {
      console.error('Editor initialization error:', error);
    }
  };

  const loadNoteContent = async () => {
    if (!noteId || !auth.currentUser) {
      setNoteContent(null);
      setTitle('');
      setFileType(t('notes.noSelected'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userId = auth.currentUser.uid;
      
      const noteDoc = await getDoc(doc(db, 'notes', userId, 'userNotes', noteId));
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        setTitle(noteData.title || '');
        setFileType(noteData.type || t('notes.noSelected'));
        
        if (noteData.contentRef) {
          const contentDoc = await getDoc(doc(db, 'noteContents', noteData.contentRef));
          if (contentDoc.exists()) {
            const contentData = contentDoc.data();
            const editorJsData = {
              ...contentData.content,
              blocks: contentData.content.blocks || [],
              time: contentData.content.time || Date.now(),
              version: contentData.content.version || "2.26.5"
            };
            setNoteContent(editorJsData);
          } else {
            setNoteContent({ blocks: [] });
          }
        } else {
          setNoteContent({ blocks: [] });
        }
      }
    } catch (error) {
      console.error('Error loading note content:', error);
      setNoteContent({ blocks: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const saveContent = async (content: OutputData) => {
    if (!noteId || !auth.currentUser || !isEditorReady) return;

    try {
      const userId = auth.currentUser.uid;

      // Очищаем данные от undefined значений перед сохранением
      const cleanBlocks = content.blocks.map(block => {
        const cleanBlock = Object.fromEntries(
          Object.entries(block).filter(([, value]) => value !== undefined)
        );
        
        // Если у блока есть data, тоже очищаем его от undefined
        if (cleanBlock.data) {
          cleanBlock.data = Object.fromEntries(
            Object.entries(cleanBlock.data).filter(([, value]) => value !== undefined)
          );
        }
        
        return cleanBlock;
      });

      const firebaseContent = {
        blocks: cleanBlocks,
        time: content.time || Date.now(),
        version: content.version || "2.26.5"
      };
      
      const noteDoc = await getDoc(doc(db, 'notes', userId, 'userNotes', noteId));
      if (noteDoc.exists()) {
        const noteData = noteDoc.data();
        if (noteData.contentRef) {
          // Обновляем содержимое заметки
          await updateDoc(doc(db, 'noteContents', noteData.contentRef), {
            content: firebaseContent,
            lastEditedAt: new Date()
          });
          
          // Обновляем время последнего редактирования в метаданных
          await updateDoc(doc(db, 'notes', userId, 'userNotes', noteId), {
            lastEditedAt: new Date()
          });
        }
      }
    } catch (error) {
      console.error('Error saving note content:', error);
    }
  };

  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);

    if (!noteId || !auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      await updateDoc(doc(db, 'notes', userId, 'userNotes', noteId), {
        title: newTitle,
        lastEditedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating note title:', error);
    }
  };

  const handleFileTypeChange = async (type: string) => {
    setFileType(type);

    if (!noteId || !auth.currentUser) return;

    try {
      const userId = auth.currentUser.uid;
      await updateDoc(doc(db, 'notes', userId, 'userNotes', noteId), {
        type: type,
        lastEditedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating note type:', error);
    }
  };

  useEffect(() => {
    loadNoteContent();
  }, [noteId]);

  useEffect(() => {
    if (!isLoading) {
      initEditor();
    }

    return () => {
      // Очистка при размонтировании компонента
      const cleanup = async () => {
        if (editorRef.current) {
          try {
            await editorRef.current.isReady;
            editorRef.current.destroy();
          } catch (error) {
            console.error('Error during editor cleanup:', error);
          }
          editorRef.current = null;
        }
      };
      cleanup();
    };
  }, [isLoading, noteContent]);

  if (!noteId) {
    return (
      <main className='ml-600'>
        <div className="no_note_content">
          <p>{t('notes.noSelected')}</p>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className='ml-600'>
        <div className="no_note_content">
          <p>{t('notes.loading')}</p>
        </div>
      </main>
    );
  }

  return (
    <DropdownProvider>
      <main className='ml-600'>
        <div className="main-content">
          <div className="main-header">
            <div className="main-header-top">
              <input
                type="text"
                className="note-title"
                value={title}
                onChange={handleTitleChange}
                placeholder={t('notes.noteTitle')}
              />
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