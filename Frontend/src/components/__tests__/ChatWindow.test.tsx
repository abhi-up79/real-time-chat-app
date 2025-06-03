import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatWindow } from '../ChatWindow';
import { useAuth } from '../../auth/useAuth';

// Mock the useAuth hook
jest.mock('../../auth/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the WebSocket client
jest.mock('@stomp/stompjs', () => ({
  Client: jest.fn().mockImplementation(() => ({
    activate: jest.fn().mockResolvedValue(undefined),
    deactivate: jest.fn(),
    subscribe: jest.fn(),
    onConnect: jest.fn(),
    onStompError: jest.fn(),
    onWebSocketError: jest.fn(),
    onWebSocketClose: jest.fn()
  }))
}));

describe('ChatWindow', () => {
  const mockGetToken = jest.fn();
  const mockUserId = 'user123';
  const mockChatId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ getToken: mockGetToken });
    mockGetToken.mockResolvedValue('mock-token');
  });

  it('renders chat window with initial state', () => {
    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);
    const input = screen.getByRole('textbox');
    const button = screen.getByRole('button');

    fireEvent.change(input, { target: { value: 'Hello, World!' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('displays error message when connection fails', async () => {
    mockGetToken.mockRejectedValue(new Error('Auth failed'));
    render(<ChatWindow userId={mockUserId} chatId={mockChatId} />);

    await waitFor(() => {
      expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
    });
  });
}); 