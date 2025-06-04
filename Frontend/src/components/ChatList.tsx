import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/useAuth";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface Chat {
    id: number;
    type: string;
    name?: string;
}

interface ChatListProps {
    userId: string | null;
    onSelectChat: (chatId: number) => void;
}

interface ExtendedClient extends Client {
    subscription?: any;
}

const ChatList: React.FC<ChatListProps> = ({userId, onSelectChat}) => {
    const [chats, setChats] = useState<Chat[]>([]);
    const [newChatEmails, setNewChatEmails] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { getToken, user } = useAuth();
    const [isUserCreated, setIsUserCreated] = useState(false);
    const clientRef = useRef<ExtendedClient | null>(null);
    const isComponentMountedRef = useRef<boolean>(true);

    const setupWebSocket = async () => {
        if (!userId || !isUserCreated) return;

        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                return;
            }

            // Clean up existing client if any
            if (clientRef.current) {
                try {
                    if (clientRef.current.subscription) {
                        clientRef.current.subscription.unsubscribe();
                    }
                    clientRef.current.deactivate();
                } catch (error) {
                    console.error('Error cleaning up existing client:', error);
                }
                clientRef.current = null;
            }

            const client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
                connectHeaders: {
                    Authorization: `Bearer ${token}`
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            }) as ExtendedClient;

            client.onConnect = () => {
                if (!isComponentMountedRef.current) return;
                console.log('WebSocket connected for chat list updates');
                
                // Subscribe to user's chat updates
                const subscription = client.subscribe(`/topic/user/${userId}/chats`, (message) => {
                    if (!isComponentMountedRef.current) return;
                    try {
                        const newChat: Chat = JSON.parse(message.body);
                        setChats(prevChats => {
                            // Check if chat already exists
                            if (prevChats.some(chat => chat.id === newChat.id)) {
                                return prevChats;
                            }
                            return [...prevChats, newChat];
                        });
                    } catch (error) {
                        console.error('Error processing chat update:', error);
                    }
                });

                client.subscription = subscription;
                clientRef.current = client;
            };

            await client.activate();
        } catch (error) {
            console.error('Failed to setup WebSocket for chat list:', error);
        }
    };

    useEffect(() => {
        isComponentMountedRef.current = true;
        setupWebSocket();

        return () => {
            isComponentMountedRef.current = false;
            if (clientRef.current) {
                try {
                    if (clientRef.current.subscription) {
                        clientRef.current.subscription.unsubscribe();
                    }
                    clientRef.current.deactivate();
                } catch (error) {
                    console.error('Error deactivating WebSocket:', error);
                }
                clientRef.current = null;
            }
        };
    }, [userId, isUserCreated]);

    useEffect(() => {
        const createOrUpdateUser = async () => {
            if (!userId || !user || isUserCreated) return;
            try {
                console.log('Creating/updating user with:', {
                    userId,
                    email: user.email,
                    name: user.name
                });

                const token = await getToken();
                console.log('Token received:', token ? 'Token exists' : 'No token');
                
                const response = await axios.post(
                    'http://localhost:8080/api/users',
                    {
                        email: user.email,
                        name: user.name
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                console.log('User creation/update response:', response.data);
                setIsUserCreated(true);
                setError('');
            } catch (err: any) {
                console.error('Error creating/updating user:', err);
                console.error('Request details:', {
                    url: 'http://localhost:8080/api/users',
                    headers: err.config?.headers,
                    status: err.response?.status,
                    data: err.response?.data
                });
                const errorMessage = err.response?.data || err.message || 'Failed to create/update user';
                setError(errorMessage);
            }
        };

        createOrUpdateUser();
    }, [userId, user, getToken, isUserCreated]);

    useEffect(() => {
        const fetchChats = async () => {
            if (!userId || !isUserCreated) return;
            try {
                const token = await getToken();
                const response = await axios.get(
                    `http://localhost:8080/api/users/${userId}/chats`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                setChats(response.data);
                setError('');
            } catch (err: any) {
                console.error('Error fetching chats:', err);
                setError(err.response?.data || 'Failed to load chats');
            }
        };
        fetchChats();
    }, [userId, getToken, isUserCreated]);

    const createChat = async () => {
        if (!userId || !isUserCreated) {
            setError('Please wait for user setup to complete');
            return;
        }
        try {
            const token = await getToken();
            const emails = newChatEmails.split(',').map(email => email.trim());
            
            if (emails.some(email => !email.includes('@'))) {
                setError('Please enter valid email addresses');
                return;
            }

            // Generate chat name based on type
            const chatName = emails.length > 1 
                ? 'Group Chat' 
                : `Chat with ${emails[0]}`;

            const requestPayload = {
                type: emails.length > 1 ? 'group' : 'private',
                name: chatName,
                userEmails: emails,
            };

            console.log('Creating chat with payload:', requestPayload);

            const response = await axios.post(
                'http://localhost:8080/api/chats',
                requestPayload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Chat creation response:', response.data);
            setChats([...chats, response.data]);
            setNewChatEmails('');
            setError('');
        } catch (err: any) {
            console.error('Error creating chat:', err);
            console.error('Error details:', {
                message: err.message,
                response: err.response?.data,
                status: err.response?.status
            });
            setError(err.response?.data || 'Failed to create chat');
        }
    };

    return (
        <div className="w-1/4 bg-white border-r p-4">
            <h2 className="text-lg font-bold mb-4">Chats</h2>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="User emails (comma separated)"
                    value={newChatEmails}
                    onChange={(e) => setNewChatEmails(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                />
                <button 
                    onClick={createChat} 
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                    disabled={!isUserCreated}
                >
                    Create Chat
                </button>
            </div>
            {error && (
                <div className="text-red-500 mb-4 text-sm">
                    {error}
                </div>
            )}
            <ul className="space-y-2">
                {chats.map((chat) => (
                    <li
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className="p-2 hover:bg-gray-200 cursor-pointer rounded"
                    >
                        {chat.name || `Chat ${chat.id}`}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ChatList;