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

        return = () => {
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
        
    );
}

export default ChatWindow;