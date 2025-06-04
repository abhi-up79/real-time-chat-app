import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import axios from "axios";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../auth/useAuth";

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
                webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
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
                    `http://localhost:8080/api/chats/${chatId}/messages`,
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
        <div className="flex-1 flex flex-col p-4">
            {!isConnected && (
                <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4" role="alert">
                    <p>Connecting to chat server...</p>
                </div>
            )}
            <div className="flex-1 overflow-y-auto">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`mb-2 p-2 rounded ${
                            userId && msg.sender.id === userId ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
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
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    disabled={!isConnected}
                />
                <button 
                    onClick={sendMessage} 
                    className={`ml-2 p-2 rounded ${
                        isConnected ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}
                    disabled={!isConnected}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default ChatWindow;