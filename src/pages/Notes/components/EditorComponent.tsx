import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Paragraph from '@editorjs/paragraph';
import Link from '@editorjs/link';
import Table from '@editorjs/table';
import Quote from '@editorjs/quote';
import Code from '@editorjs/code';
import Marker from '@editorjs/marker';
import Delimiter from '@editorjs/delimiter';
import Checklist from '@editorjs/checklist';
import Embed from '@editorjs/embed';
import type { EditorContent, EditorBlock } from '@/types/editor';
// import './EditorComponent.css';

interface EditorComponentProps {
  initialContent: EditorContent | null;
}

interface EditorRef {
  getContent: () => Promise<EditorContent | null>;
}

const EditorComponent = forwardRef<EditorRef, EditorComponentProps>(
  ({ initialContent }, ref) => {
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = React.useState(false);

    const sanitizeContent = (content: EditorContent): EditorContent => {
      if (!content || !content.blocks) return content;
      
      return {
        ...content,
        blocks: content.blocks.map((block: EditorBlock) => {
          // Обработка параграфов
          if (block.type === 'paragraph') {
            return {
              ...block,
              id: block.id || Math.random().toString(36).substr(2, 9),
              data: {
                text: block.data?.text || ''
              }
            };
          }

          // Обработка ссылок
          if (block.type === 'link') {
            const linkData = block.data || {};
            return {
              ...block,
              id: block.id || Math.random().toString(36).substr(2, 9),
              data: {
                link: linkData.link || linkData.url || '',
                meta: {
                  title: linkData.meta?.title || linkData.text || '',
                  description: linkData.meta?.description || '',
                  image: linkData.meta?.image || {}
                }
              }
            };
          }

          // Обработка таблиц
          if (block.type === 'table') {
            const tableContent = block.data?.content || [];
            // Преобразуем таблицу в строку для сохранения
            const tableString = tableContent.map(row => 
              row.map(cell => {
                if (typeof cell === 'object' && cell !== null) {
                  return (cell as any).text || '';
                }
                return typeof cell === 'string' ? cell : '';
              }).join('|')
            ).join('\n');

            return {
              ...block,
              id: block.id || Math.random().toString(36).substr(2, 9),
              data: {
                content: tableString,
                withHeadings: block.data?.withHeadings || false
              }
            };
          }

          // Обработка списков
          if (block.type === 'list') {
            const items = block.data?.items || [];
            return {
              ...block,
              id: block.id || Math.random().toString(36).substr(2, 9),
              data: {
                style: block.data?.style || 'unordered',
                items: items.map(item => {
                  if (typeof item === 'string') {
                    return item;
                  }
                  if (typeof item === 'object' && item !== null) {
                    return item.content || item.text || '';
                  }
                  return '';
                })
              }
            };
          }

          // Для всех остальных блоков
          return {
            ...block,
            id: block.id || Math.random().toString(36).substr(2, 9),
            data: block.data || {}
          };
        })
      };
    };

    const cleanupEditor = async () => {
      if (editorRef.current) {
        try {
          await editorRef.current.destroy();
          editorRef.current = null;
        } catch (error) {
          console.error('Error destroying editor:', error);
        }
      }
    };

    useEffect(() => {
      let mounted = true;
      
      const initEditor = async () => {
        await cleanupEditor();
        
        if (!mounted || !holderRef.current) return;
        
        try {
          // Подготовка данных для инициализации
          const preparedData = initialContent ? {
            ...initialContent,
            blocks: initialContent.blocks.map(block => {
              if (block.type === 'table' && typeof block.data.content === 'string') {
                // Восстанавливаем структуру таблицы из строки
                const rows = block.data.content.split('\n');
                return {
                  ...block,
                  data: {
                    ...block.data,
                    content: rows.map(row => row.split('|'))
                  }
                };
              }
              return block;
            })
          } : {
            time: Date.now(),
            blocks: [
              {
                id: 'initial',
                type: "paragraph",
                data: {
                  text: "Start writing your note here..."
                }
              }
            ],
            version: "2.28.2"
          };

          const editor = new EditorJS({
            holder: holderRef.current,
            tools: {
              paragraph: {
                class: Paragraph,
                inlineToolbar: true
              },
              header: {
                class: Header,
                config: {
                  levels: [2, 3, 4],
                  defaultLevel: 2
                }
              },
              list: {
                class: List,
                inlineToolbar: true,
                config: {
                  defaultStyle: 'unordered'
                }
              },
              link: {
                class: Link,
                config: {
                  endpoint: '/api/link',
                  placeholder: 'Paste a link',
                }
              },
              table: {
                class: Table,
                inlineToolbar: true,
                config: {
                  rows: 2,
                  cols: 3,
                },
              },
              quote: {
                class: Quote,
                inlineToolbar: true,
                config: {
                  quotePlaceholder: 'Enter a quote',
                  captionPlaceholder: 'Quote\'s author',
                },
              },
              code: {
                class: Code,
                config: {
                  placeholder: 'Enter code',
                }
              },
              marker: {
                class: Marker,
                shortcut: 'CMD+SHIFT+M'
              },
              delimiter: {
                class: Delimiter
              },
              checklist: {
                class: Checklist,
                inlineToolbar: true,
              },
              embed: {
                class: Embed,
                config: {
                  services: {
                    youtube: true,
                    coub: true,
                    codepen: true,
                    twitter: true,
                    instagram: true,
                    facebook: true,
                    vimeo: true,
                  }
                }
              }
            },
            data: preparedData,
            placeholder: 'Type here to write your note...',
            onReady: () => {
              if (mounted) {
                setIsReady(true);
              }
            }
          });
          
          if (mounted) {
            editorRef.current = editor;
          } else {
            await editor.destroy();
          }
        } catch (error) {
          console.error('Error initializing editor:', error);
        }
      };

      initEditor();
      
      return () => {
        mounted = false;
        cleanupEditor();
      };
    }, [initialContent]);

    useImperativeHandle(ref, () => ({
      getContent: async () => {
        if (!editorRef.current || !isReady) return null;
        try {
          const savedData = await editorRef.current.save();
          if (!savedData) return null;
          
          const content: EditorContent = {
            time: savedData.time || Date.now(),
            blocks: (savedData.blocks || []).map(block => ({
              id: block.id || Math.random().toString(36).substr(2, 9),
              type: block.type,
              data: block.data || {}
            })),
            version: savedData.version || "2.28.2"
          };
          
          return sanitizeContent(content);
        } catch (error) {
          console.error('Error getting editor content:', error);
          return null;
        }
      }
    }));

    return (
      <div className="editor-wrapper" key={initialContent ? JSON.stringify(initialContent) : 'empty'}>
        <div ref={holderRef} className="editor-container" style={{ minHeight: '200px' }} />
      </div>
    );
  }
);

EditorComponent.displayName = 'EditorComponent';

export { EditorComponent };