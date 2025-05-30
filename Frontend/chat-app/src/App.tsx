import { useState } from 'react'
import './App.css'

const App: React.FC = () => {
  const [userId, setUserId] = useState<number | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)

  const handleLogin = async (username: string) => {
    const response = await fetch('https://localhost:8080/api/users', {
      method: 'Post',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email: `${username}@example.com` }),
    });
    const user = await response.json();
    setUserId(user.id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {
        !userId ? (
          <div className="flex m-auto">
            <div className='font-bold p-2'>Username: </div>
            <input type="text"
              placeholder="Enter Username"
              className="p-2 border rounded"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin(e.currentTarget.value);
              }}
            />
          </div>
        ) : (
          <>
            <ChatList userId={userId} onSelectChat={setSelectedChatId} />
            {selectedChatId && <ChatWindow userId={userId} chatId={selectedChatId} />}
          </>
        )}
    </div>
  );
};

export default App
