import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import { useEffect, useRef, useState } from "react";


interface Message {
    id: number;
    chat: {id: number};
    sender: {id: number};
    content: string;
    timestamp: string;
}

interface ChatWindowProps {
    userId: number;
    chatId: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({userId, chatId}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            const response = await axios.get(`http://localhost:8080/api/chats/${chatId}/messages`);
            setMessages(response.data);
        }
        fetchMessages();

        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/chat'),
            reconnectDelay: 5000,
        });

        client.onConnect = () => {
            client.subscribe(`/topic/chat/${chatId}`, (message) => {
                const msg: Message = JSON.parse(message.body);
                setMessages((prev) => [...prev, msg]);
            });
        };

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
        };
    }, [chatId]);

    const sendMessage = () => {
        if (newMessage && clientRef.current?.active) {
            clientRef.current.publish({
                destination: `/app/chat/${chatId}`,
                body: JSON.stringify({ senderId: userId, content: newMessage}),
            });
            setNewMessage('');
        }
    };

    return (
        <div className="flex-1 flex flex-col p-4">
            <div className="flex-1 overflow-y-auto">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-2 p-2 rounded ${
                            msg.sender.id === userId ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                        }`}
                    >
                        <p>{msg.content}</p>
                        <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                    </div>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 p-2 border rounded"
                    placeholder="Type a message"
                />
                <button onClick={sendMessage} className="ml-2 bg-blue-500 text-white p-2 rounded">
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWindow;