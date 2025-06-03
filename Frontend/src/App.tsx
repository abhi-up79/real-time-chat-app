import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { Login } from './components/Login';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import { LoadingSpinner } from './components/LoadingSpinner';
import './App.css';

const ChatLayout = () => {
  const { user, logout } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const userId = user?.sub || null;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">Chat App</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{user?.email}</span>
          <button
            onClick={() => logout()}
            className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <ChatList userId={userId} onSelectChat={setSelectedChatId} />
        {selectedChatId && <ChatWindow userId={userId} chatId={selectedChatId} />}
      </div>
    </div>
  );
};

const App = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/chat" replace />} />
    </Routes>
  );
};

export default App;
