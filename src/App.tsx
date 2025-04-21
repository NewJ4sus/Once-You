import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { UserSettingsProvider } from './context/UserSettingsContext';
import { auth } from '@/config/firebase'
import { useEffect, useState } from 'react'
import { useTheme } from '@/hooks/useTheme';
import '@/assets/css/themes.css';

import Home from './pages/Home/HomePage';
import Tasks from './pages/Tasks/TasksPage';
import Notes from './pages/Notes/NotesPage';
import Reminders from './pages/Reminders/RemindersPage';
import Calendar from './pages/Calendar/CalendarPage';
import Settings from './pages/Settings/SettingsPage';
import Information from './pages/Information/InformationPage';
import Login from './pages/Auth/Login/LoginPage';
import Register from './pages/Auth/Register/RegisterPage';
import AdminPanel from './pages/AdminPanel/AdminPanel';

// Create a new component to use the theme
const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Set the theme as soon as possible
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  return <>{children}</>;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <AppProvider>
      <UserSettingsProvider>
        <ThemeWrapper>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/login" />} />

              {/* Private routes */}
              <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
              <Route path="/tasks" element={isAuthenticated ? <Tasks /> : <Navigate to="/login" />} />
              <Route path="/notes" element={isAuthenticated ? <Notes /> : <Navigate to="/login" />} />
              <Route path="/reminders" element={isAuthenticated ? <Reminders /> : <Navigate to="/login" />} />
              <Route path="/calendar" element={isAuthenticated ? <Calendar /> : <Navigate to="/login" />} />
              <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
              <Route path="/information" element={isAuthenticated ? <Information /> : <Navigate to="/login" />} />

              <Route path="/admin" element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" />} />
            </Routes>
          </Router>
        </ThemeWrapper>
      </UserSettingsProvider>
    </AppProvider>
  );
}

export default App;
