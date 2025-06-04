import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../auth/useAuth";
import config from '../config/config';

interface Message {
    id: number;
    chat: {id: number};
    sender: {id: string};
    content: string;
    timestamp: string;
}

interface ChatWindowProps {
    userId: string | null;
    chatId: number;
}

interface ExtendedClient extends Client {
    subscription?: any;
    userSubscription?: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ userId, chatId }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clientRef = useRef<ExtendedClient | null>(null);
    const { getToken } = useAuth();
    const connectionAttemptRef = useRef<boolean>(false);
    const isComponentMountedRef = useRef<boolean>(true);

    const setupWebSocket = useCallback(async () => {
        if (connectionAttemptRef.current || !isComponentMountedRef.current) {
            console.log('Connection attempt already in progress or component unmounted');
            return;
        }
        connectionAttemptRef.current = true;

        try {
            const token = await getToken();
            if (!token) {
                console.error('No authentication token available');
                setError('Authentication failed. Please log in again.');
                connectionAttemptRef.current = false;
                return;
            }

            console.log('Setting up WebSocket connection with token:', token.substring(0, 10) + '...');
            
            // Clean up existing client if any
            if (clientRef.current) {
                try {
                    if (clientRef.current.subscription) {
                        clientRef.current.subscription.unsubscribe();
                    }
                    if (clientRef.current.userSubscription) {
                        clientRef.current.userSubscription.unsubscribe();
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
                debug: (str) => {
                    console.log('STOMP Debug:', str);
                },
                onStompError: (frame) => {
                    if (!isComponentMountedRef.current) return;
                    console.error('STOMP error:', frame.headers['message'], frame.body);
                    setIsConnected(false);
                    setError(`STOMP Error: ${frame.headers['message'] || 'Unknown error'}`);
                    connectionAttemptRef.current = false;
                },
                onWebSocketError: (event) => {
                    if (!isComponentMountedRef.current) return;
                    console.error('WebSocket error:', event);
                    setIsConnected(false);
                    setError('Connection error. Please check your internet connection.');
                    connectionAttemptRef.current = false;
                },
                onWebSocketClose: (event) => {
                    if (!isComponentMountedRef.current) return;
                    console.log('WebSocket closed:', event);
                    setIsConnected(false);
                    if (!event.wasClean) {
                        setError('Connection lost. Attempting to reconnect...');
                    } else {
                        console.log('WebSocket closed cleanly');
                    }
                    connectionAttemptRef.current = false;
                }
            }) as ExtendedClient;

            client.onConnect = (frame) => {
                if (!isComponentMountedRef.current) return;
                console.log('WebSocket connected successfully', frame);
                setIsConnected(true);
                setError(null);
                connectionAttemptRef.current = false;
                
                // Subscribe to the chat topic
                if (client) {
                    try {
                        // Subscribe to general chat topic
                        console.log('Subscribing to chat topic:', `/topic/chat/${chatId}`);
                        const subscription = client.subscribe(`/topic/chat/${chatId}`, (message) => {
                            if (!isComponentMountedRef.current) return;
                            try {
                                console.log('Received message from chat topic:', message.body);
                                const msg: Message = JSON.parse(message.body);
                                setMessages((prev) => {
                                    // Check if message already exists
                                    if (prev.some(m => m.id === msg.id)) {
                                        return prev;
                                    }
                                    return [...prev, msg];
                                });
                            } catch (error) {
                                console.error('Error processing message:', error);
                            }
                        });

                        // Subscribe to user-specific queue
                        console.log('Subscribing to user queue:', `/user/queue/chat/${chatId}`);
                        const userSubscription = client.subscribe(`/user/queue/chat/${chatId}`, (message) => {
                            if (!isComponentMountedRef.current) return;
                            try {
                                console.log('Received message from user queue:', message.body);
                                const msg: Message = JSON.parse(message.body);
                                setMessages((prev) => {
                                    // Check if message already exists
                                    if (prev.some(m => m.id === msg.id)) {
                                        return prev;
                                    }
                                    return [...prev, msg];
                                });
                            } catch (error) {
                                console.error('Error processing user message:', error);
                            }
                        });

                        // Store subscriptions for cleanup
                        client.subscription = subscription;
                        client.userSubscription = userSubscription;
                        clientRef.current = client;
                        console.log('Successfully subscribed to chat topic and user queue');
                    } catch (error) {
                        console.error('Error subscribing to chat:', error);
                        setError('Failed to subscribe to chat. Please refresh the page.');
                        connectionAttemptRef.current = false;
                    }
                }
            };

            try {
                console.log('Activating WebSocket connection...');
                await client.activate();
            } catch (error) {
                if (!isComponentMountedRef.current) return;
                console.error('Failed to activate WebSocket:', error);
                setIsConnected(false);
                setError('Failed to connect to chat server. Please refresh the page.');
                connectionAttemptRef.current = false;
            }
        } catch (error) {
            if (!isComponentMountedRef.current) return;
            console.error('Failed to setup WebSocket:', error);
            setIsConnected(false);
            setError('Failed to setup chat connection. Please refresh the page.');
            connectionAttemptRef.current = false;
        }
    }, [chatId, getToken]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const token = await getToken();
                const response = await axios.get(
                    `${config.apiUrl}/api/chats/${chatId}/messages`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                setMessages(response.data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        isComponentMountedRef.current = true;
        fetchMessages();
        setupWebSocket();

        return () => {
            isComponentMountedRef.current = false;
            if (clientRef.current) {
                try {
                    if (clientRef.current.subscription) {
                        clientRef.current.subscription.unsubscribe();
                    }
                    if (clientRef.current.userSubscription) {
                        clientRef.current.userSubscription.unsubscribe();
                    }
                    clientRef.current.deactivate();
                } catch (error) {
                    console.error('Error deactivating WebSocket:', error);
                }
                clientRef.current = null;
                setIsConnected(false);
                setError(null);
                connectionAttemptRef.current = false;
            }
        };
    }, [chatId, getToken, setupWebSocket]);

    const sendMessage = async () => {
        if (!userId || !newMessage.trim() || !clientRef.current?.active) {
            console.log('Cannot send message:', { 
                userId, 
                messageLength: newMessage?.length, 
                active: clientRef.current?.active 
            });
            return;
        }

        const payload = { 
            senderId: userId, 
            content: newMessage.trim() 
        };
        
        console.log('Publishing message:', payload);
        try {
            if (!clientRef.current.connected) {
                throw new Error('WebSocket not connected');
            }

            await clientRef.current.publish({
                destination: `/app/chat/${chatId}`,
                body: JSON.stringify(payload),
                headers: {
                    'content-type': 'application/json'
                }
            });
            
            setNewMessage('');
            console.log('Message published successfully');
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message. Please try again.');
            
            // Attempt to reconnect if connection is lost
            if (!clientRef.current.connected) {
                console.log('Connection lost, attempting to reconnect...');
                setupWebSocket();
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-50 relative">
            {!isConnected && (
                <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 m-4 rounded-lg shadow-sm" role="alert">
                    <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>Connecting to chat server...</p>
                    </div>
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20" style={{ scrollBehavior: 'smooth' }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${userId && msg.sender.id === userId ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] md:max-w-[60%] rounded-lg px-4 py-2 shadow-sm ${
                                userId && msg.sender.id === userId
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 rounded-bl-none'
                            }`}
                        >
                            <p className="break-words">{msg.content}</p>
                            <div className={`text-xs mt-1 ${
                                userId && msg.sender.id === userId ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Type your message..."
                        disabled={!isConnected}
                    />
                    <button 
                        onClick={sendMessage} 
                        className={`px-6 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                            isConnected 
                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!isConnected}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatWindow;