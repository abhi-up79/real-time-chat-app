# real-time-chat-app

## High-Level Architecture
The system will follow a microservices-like architecture with components communicating over APIs and WebSockets. Here's the high-level overview:

- Client Layer: Web/mobile app for user interaction (React, Flutter, etc.).
- Authentication Service: Handles OIDC-based login.
- API Gateway: Routes requests to backend services.
- Chat Service: Manages WebSocket connections for real-time messaging.
- Database (MySQL): Stores user data, chat metadata, and message history.
- Message Queue (e.g., Kafka, RabbitMQ): Handles asynchronous message processing.
- Load Balancer: Distributes traffic across services.
- File Storage (Optional): For media attachments (e.g., S3).
Diagram (text-based representation):



[Client] <-> [Load Balancer] <-> [API Gateway]

                                    |
        -------------------------------------
        |                |                  |
[Auth Service]___________[Chat Service]_______[Database (MySQL)]

                      |
                 [Message Queue]


## Detailed Component Design
Let’s break down each component and its responsibilities.

1. Client Layer
Tech Stack: React (web) or Flutter (mobile) for the front-end.
Functionality:
Authenticate users via OIDC (redirect to identity provider).
Establish WebSocket connection for real-time messaging.
Display private and group chats, send/receive messages, show history.
Interaction: Communicates with API Gateway (REST for metadata, WebSocket for messages).
2. Authentication Service
Purpose: Manages user authentication via OIDC.
Tech Stack: Node.js/Express or Spring Boot, integrated with an OIDC provider (e.g., Auth0, Keycloak).
Flow:
Client redirects to OIDC provider for login.
OIDC provider returns an access token/ID token.
Auth Service validates the token and issues a JWT for internal use.
JWT is used for subsequent API/WebSocket requests.
Storage: Store user profiles (ID, username, email) in MySQL.
Security: Use HTTPS, validate tokens with the OIDC provider’s public key.
3. API Gateway
Purpose: Central entry point for all client requests.
Tech Stack: AWS API Gateway, Kong, or Nginx.
Responsibilities:
Route REST requests (e.g., fetch chat history, create group) to appropriate services.
Handle WebSocket connections (pass to Chat Service).
Authenticate requests using JWT (validate with Auth Service).
Rate limiting and request validation.
4. Chat Service
Purpose: Manages real-time messaging via WebSockets.
Tech Stack: Node.js with Socket.IO or Go with WebSocket libraries.
Functionality:
Maintain WebSocket connections for each user.
Handle private and group chat logic.
Broadcast messages to recipients in real-time.
Publish messages to a message queue for persistence.
Key Logic:
Private Chat: Route messages to a single recipient’s WebSocket.
Group Chat: Maintain a mapping of group IDs to connected users; broadcast messages to all group members.
Connection Management: Handle reconnects, timeouts, and dropped connections.
Scalability: Run multiple Chat Service instances; use Redis to track user-to-server mappings.
5. Message Queue
Purpose: Decouple message processing for persistence and reliability.
Tech Stack: Kafka or RabbitMQ.
Flow:
Chat Service publishes messages to a queue.
A consumer service reads from the queue and stores messages in MySQL.
Ensures no message loss even if the database is temporarily unavailable.
Topics:
message_persist: For storing messages.
group_updates: For group creation/join events.
6. Database (MySQL)
Purpose: Store user data, chat metadata, and message history.
Schema:
sql

Copy
Users:
- user_id (PK)
- username
- email
- created_at

Chats:
- chat_id (PK)
- type (private/group)
- created_at

Chat_Members:
- chat_id (FK)
- user_id (FK)
- joined_at

Messages:
- message_id (PK)
- chat_id (FK)
- sender_id (FK)
- content (TEXT)
- timestamp
Indexes:
chat_id and timestamp on Messages for fast history retrieval.
Composite index on chat_id, user_id in Chat_Members.
Scalability: Use read replicas for message history queries; partition Messages table by chat_id for large datasets.
7. Load Balancer
Purpose: Distribute traffic across API Gateway and Chat Service instances.
Tech Stack: AWS ELB, HAProxy, or Nginx.
Features: Sticky sessions for WebSocket connections to ensure users stay connected to the same Chat Service instance.
8. File Storage (Optional)
Purpose: Store media attachments (if supported).
Tech Stack: AWS S3 or equivalent.
Flow: Upload media via API Gateway, store URL in Messages table.