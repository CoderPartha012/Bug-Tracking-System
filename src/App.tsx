import React, { useState } from 'react';
import { Bug } from './types/bug';
import { BugProvider } from './context/BugContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BugList } from './components/BugList';
import { BugForm } from './components/BugForm';
import { Filters } from './components/Filters';
import { Dashboard } from './components/Dashboard';
import { Auth } from './components/Auth';
import { Moon, Sun, Plus, LogOut } from 'lucide-react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function BugTracker() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBug, setSelectedBug] = useState<Bug | undefined>();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut, loading } = useAuth();

  const handleEdit = (bug: Bug) => {
    setSelectedBug(bug);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedBug(undefined);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bug Tracker</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              {theme === 'dark' ? (
                <Sun className="h-6 w-6 text-yellow-500" />
              ) : (
                <Moon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Bug</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <Dashboard />
        <Filters />
        <BugList onEdit={handleEdit} />

        {isFormOpen && (
          <BugForm bug={selectedBug} onClose={handleCloseForm} />
        )}
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BugProvider>
          <BugTracker />
        </BugProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;