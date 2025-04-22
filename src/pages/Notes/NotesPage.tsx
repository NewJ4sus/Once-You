import React, { useState } from 'react';
import Headers from '@/components/Headers/Headers';
import Menu from '@/components/Asides/Menu/Menu';
import FolderNotes from '@/components/Asides/FolderNotes/FolderNotes';
import NoteContent from './components/NoteContent';
import './NotesPage.css';

const Notes: React.FC = () => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  return (
    <>
      <Headers namePage="Notes"/>
      <Menu namePage="Notes"/>
      <FolderNotes 
        onNoteSelect={setSelectedNoteId}
        selectedNoteId={selectedNoteId}
      />
      <NoteContent noteId={selectedNoteId}/>
    </>
  );
};

export default Notes;