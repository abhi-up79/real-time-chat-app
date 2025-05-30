import axios from "axios";
import { useEffect, useState } from "react";


interface Chat {
    id: number;
    type: string;
    name?: string;
}

interface ChatListProps {
    userId: number;
    onSelectChat: (chatId: number) => void
}

const ChatList: React.FC<ChatListProps> = ({userId, onSelectChat}) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [newChatUsers, setNewChatUsers] = useState<string>('');

    useEffect(() => {
        const fetchChats = async () => {
            const response = await axios.get(`http://localhost:8080/api/${userId}/chats`);
            setChats(response.data);
        };
        fetchChats();
    }, [userId]);

    const createChat = async () => {
        const userIds = newChatUsers.split(',').map(Number);
        const response = await axios.post('http://localhost:8080/api/chats', {
            type: userIds.length > 1 ? 'group' : 'private',
            name: userIds.length > 1 ? 'Group Chat' : undefined,
            userIds: [userId, ...userIds],
        });
        setChats([...chats, response.data]);
        setNewChatUsers('');
    };

    return (
        <div className="w-1/4 bg-white border-r p-4">
            <h2 className="text-lg font-bold">Chats</h2>
            <input
                type="text"
                placeholder="User Id's (comma seperated)"
                value={newChatUsers}
                onChange={(e) => setNewChatUsers(e.target.value)}
                className="w-full p-2 border rounded mb-2"
            />
            <button onClick={createChat} className="w-full bg-blue-500 text-white p-2 rounded">
                Create Chat
            </button>
            <ul>
                {chats.map((chat) => (
                    <li
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                    >
                        {chat.name || `Chat ${chat.id}`}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatList;