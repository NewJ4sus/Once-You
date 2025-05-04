import { db, auth } from "./firebase"; // путь скорректируйте под ваш проект
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// Удалить все заметки (и их контент)
export async function deleteAllNotes() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const notesSnapshot = await getDocs(collection(db, "notes", userId, "userNotes"));
  for (const noteDoc of notesSnapshot.docs) {
    const noteData = noteDoc.data();
    if (noteData.contentRef) {
      await deleteDoc(doc(db, "noteContents", noteData.contentRef));
    }
    await deleteDoc(doc(db, "notes", userId, "userNotes", noteDoc.id));
  }
}

// Удалить все задачи
export async function deleteAllTasks() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const tasksSnapshot = await getDocs(collection(db, "tasks", userId, "userTasks"));
  for (const taskDoc of tasksSnapshot.docs) {
    await deleteDoc(doc(db, "tasks", userId, "userTasks", taskDoc.id));
  }
}

// Удалить все напоминания
export async function deleteAllReminders() {
  if (!auth.currentUser) return;
  const userId = auth.currentUser.uid;
  const remindersSnapshot = await getDocs(collection(db, "reminders", userId, "userReminders"));
  for (const reminderDoc of remindersSnapshot.docs) {
    await deleteDoc(doc(db, "reminders", userId, "userReminders", reminderDoc.id));
  }
}

// Удалить всё сразу
export async function deleteAllUserData() {
  await Promise.all([
    deleteAllNotes(),
    deleteAllTasks(),
    deleteAllReminders(),
  ]);
}
