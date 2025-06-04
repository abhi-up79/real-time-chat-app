import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "../auth/useAuth";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import config from '../config/config';

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
                webSocketFactory: () => new SockJS(config.wsUrl),
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
                    `${config.apiUrl}/api/users`,
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
                    url: `${config.apiUrl}/api/users`,
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
                    `${config.apiUrl}/api/users/${userId}/chats`,
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
                `${config.apiUrl}/api/chats`,
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
        <div className="w-full md:w-80 lg:w-96 bg-white border-r p-4 h-full overflow-y-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Messages</h2>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Enter email addresses..."
                    value={newChatEmails}
                    onChange={(e) => setNewChatEmails(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                    onClick={createChat} 
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:bg-gray-400"
                    disabled={!isUserCreated}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    New Chat
                </button>
            </div>
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm border border-red-200">
                    {error}
                </div>
            )}
            <div className="space-y-2">
                {chats.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className="p-3 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors duration-200 border border-gray-100 flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {chat.type === 'group' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-gray-800">{chat.name || `Chat ${chat.id}`}</h3>
                            <p className="text-sm text-gray-500">{chat.type === 'group' ? 'Group Chat' : 'Private Chat'}</p>
                        </div>
                    </div>
                ))}
                {chats.length === 0 && !error && (
                    <div className="text-center py-8 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <p>No chats yet. Start a new conversation!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatList;