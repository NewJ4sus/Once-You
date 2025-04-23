import React, { useEffect, useRef, useState } from 'react';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { BlockToolConstructable, InlineToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Table from '@editorjs/table';
// import Link from '@editorjs/link';
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (noteId) {
      fetchNoteContent();
    }
    return () => {
      // Очистка старого редактора при смене заметки
      if (editorRef.current) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, [noteId]);

  useEffect(() => {
    // Очищаем редактор, если он уже существует
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }
  
    // Проверяем, что все данные загрузились и редактор не был создан
    if (!isLoading && noteId && noteContent !== null && Array.isArray(noteContent.blocks)) {
      initializeEditor();
    }
  }, [isLoading, noteId, noteContent]);

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
  
            // Преобразуем блоки
            const processedBlocks = contentData.blocks.map((block: any) => {
              if (block.type === 'table' && block.data.content) {
                const { rows, cols, content, withHeadings } = block.data;
                const tableContent = Array(rows).fill(null).map(() => Array(cols).fill(''));
                Object.entries(content).forEach(([key, value]) => {
                  const [row, col] = key.split('-').map(Number);
                  tableContent[row][col] = value;
                });

                return {
                  ...block,
                  data: {
                    withHeadings,
                    content: tableContent
                  }
                };
              } else if (block.type === 'link') {
                // Упрощенная структура для link блока
                return {
                  id: block.id,
                  type: 'link',
                  data: {
                    link: block.data.link || ''
                  }
                };
              }
              return block;
            });

            const formattedContent = {
              blocks: processedBlocks,
              time: contentData.time || Date.now(),
              version: contentData.version || '2.26.5',
            };
  
            setNoteContent(formattedContent);
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
  
  const initializeEditor = () => {
    if (!editorContainerRef.current || !noteContent || !Array.isArray(noteContent.blocks)) return;
  
    const editor = new EditorJS({
      holder: editorContainerRef.current,
      data: noteContent,
      onReady: () => {
        editorRef.current = editor;
      },
      onChange: async () => {
        setSaveStatus('saving');
        try {
          const output = await editor.save();
          saveNoteContent(output);
        } catch (err) {
          console.error('Saving failed: ', err);
          setSaveStatus('error');
        }
      },
      tools: {
        header: Header as BlockToolConstructable,
        paragraph: Paragraph as BlockToolConstructable,
        list: List as BlockToolConstructable,
        quote: Quote as BlockToolConstructable,
        code: Code as BlockToolConstructable,
        inlineCode: InlineCode as InlineToolConstructable,
        table: {
          class: Table as BlockToolConstructable,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
        },
        // link: {
        //   class: Link as BlockToolConstructable,
        //   config: {
        //     endpoint: '',
        //   }
        // }
      }
    });
  };

  const saveNoteContent = async (content: OutputData) => {
    if (!noteId || !auth.currentUser || !editorRef.current) {
      return;
    }
  
    try {
      setSaveStatus('saving');
      const userId = auth.currentUser.uid;
  
      const cleanBlocks = content.blocks
        .map(block => {
          const blockData = { ...block.data };
          
          switch (block.type) {
            case 'list':
              if (Array.isArray(blockData.items)) {
                return {
                  ...block,
                  data: {
                    style: blockData.style || 'unordered',
                    items: blockData.items.filter((item: string) => item !== null && item !== undefined)
                  }
                };
              }
              break;

            case 'table':
              if (blockData.content) {
                const tableContent: Record<string, string> = {};
                blockData.content.forEach((row: string[], rowIndex: number) => {
                  row.forEach((cell: string, colIndex: number) => {
                    tableContent[`${rowIndex}-${colIndex}`] = cell || '';
                  });
                });

                return {
                  ...block,
                  data: {
                    withHeadings: !!blockData.withHeadings,
                    content: tableContent,
                    rows: blockData.content.length,
                    cols: blockData.content[0]?.length || 0
                  }
                };
              }
              break;

            case 'link':
              return {
                id: block.id,
                type: 'link',
                data: {
                  link: blockData.link || ''
                }
              };

            default:
              return {
                ...block,
                data: Object.fromEntries(
                  Object.entries(blockData)
                    .filter(([, value]) => value !== undefined && value !== null && value !== '')
                )
              };
          }
          return block;
        })
        .filter(block => {
          switch (block.type) {
            case 'list':
              return block.data.items && block.data.items.length > 0;
            case 'table':
              return block.data.content && Object.keys(block.data.content).length > 0;
            case 'link':
              return block.data.link && block.data.link.trim() !== '';
            default:
              return block.data.text || Object.keys(block.data).length > 0;
          }
        });

      const contentToSave = {
        blocks: cleanBlocks,
        time: content.time || Date.now(),
        version: content.version || '2.30.0',
      };

      const noteDocRef = doc(db, 'notes', userId, 'userNotes', noteId);
      const noteDoc = await getDoc(noteDocRef);
  
      if (!noteDoc.exists()) {
        setSaveStatus('error');
        return;
      }
  
      const { contentRef } = noteDoc.data();
      if (!contentRef) {
        setSaveStatus('error');
        return;
      }
  
      const contentDocRef = doc(db, 'noteContents', contentRef);
      await updateDoc(contentDocRef, {
        content: contentToSave,
        lastEditedAt: new Date(),
      });
  
      await updateDoc(noteDocRef, {
        lastEditedAt: new Date(),
      });
  
      setSaveStatus('saved');
    } catch (error) {
      console.error('❌ Ошибка в saveNoteContent:', error);
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
                    {saveStatus === 'saving' ? <kbd className="kdb-saving-status">Сохранение</kbd> :
                    saveStatus === 'saved' ? <kbd className="kdb-save-status">Сохранено</kbd> :
                    saveStatus === 'error' ? <kbd className="kdb-error-status">Ошибка</kbd> : 
                    <kbd className="kdb-default-status">Без изменений</kbd>}
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
