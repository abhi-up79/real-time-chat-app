import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '../ChatWindow';
import { useAuth } from '../../auth/useAuth';
import '@testing-library/jest-dom';

// Mock the useAuth hook
jest.mock('../../auth/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the STOMP client
jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation(() => ({
    activate: jest.fn(),
    deactivate: jest.fn(),
    subscribe: jest.fn(),
    publish: jest.fn()
  }))
}));

describe('ChatWindow', () => {
  const mockUserId = 'test-user-id';
  const mockChatId = 1;
  const mockGetToken = jest.fn();

  beforeEach(() => {
    // Setup useAuth mock
    (useAuth as jest.Mock).mockReturnValue({
      getToken: mockGetToken,
      user: { sub: mockUserId }
    });

    // Reset mocks
    mockGetToken.mockReset();
    mockGetToken.mockResolvedValue('mock-token');
  });

  it('renders chat window with messages', async () => {
    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);
    
    // Check if the chat window is rendered
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('sends message when send button is clicked', async () => {
    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);
    
    const messageInput = screen.getByRole('textbox');
    const sendButton = screen.getByRole('button', { name: /send/i });

    // Type a message
    fireEvent.change(messageInput, { target: { value: 'Hello, World!' } });
    
    // Click send button
    fireEvent.click(sendButton);

    // Wait for the message to be sent
    await waitFor(() => {
      expect(messageInput).toHaveValue('');
    });
  });

  it('displays connection error when WebSocket fails', async () => {
    // Mock WebSocket error
    const mockError = new Error('Connection failed');
    mockGetToken.mockRejectedValue(mockError);

    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);

    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(/connection error/i)).toBeInTheDocument();
    });
  });
}); 