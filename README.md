# Real-Time Chat Application

A modern, full-stack real-time chat application built with Spring Boot, React, and WebSocket technology. This application demonstrates advanced features like real-time messaging, user authentication, and scalable message handling using Kafka.

## 🌟 Key Features

- **Real-Time Messaging**: Instant message delivery using WebSocket (STOMP) protocol
- **Secure Authentication**: OAuth2-based authentication using Auth0
- **Scalable Architecture**: Message persistence using Apache Kafka
- **Modern UI**: Clean and responsive interface built with React and Tailwind CSS
- **Group Chats**: Support for both one-on-one and group conversations
- **Message History**: Persistent message storage with MySQL database
- **Real-Time Notifications**: Instant updates for new messages and chat invitations

## 🏗️ Architecture

### Backend (Spring Boot)
- **WebSocket**: Real-time bidirectional communication
- **Kafka**: Message persistence and scalability
- **Spring Security**: OAuth2 resource server with Auth0 integration
- **JPA/Hibernate**: Database operations and entity management
- **MySQL**: Persistent data storage

### Frontend (React + TypeScript)
- **React**: Modern UI components and state management
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Auth0 React SDK**: Secure authentication
- **STOMP.js**: WebSocket client implementation

## 🚀 Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- MySQL 8.0
- Apache Kafka
- Auth0 account

### Backend Setup
1. Configure MySQL database:
   ```sql
   CREATE DATABASE chatapp;
   ```

2. Configure Kafka:
   - Start Zookeeper
   - Start Kafka server
   - Create necessary topics

3. Update `application.properties` with your configurations:
   - Database credentials
   - Kafka settings
   - Auth0 credentials

4. Run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd Frontend/chat-app
   npm install
   ```

2. Configure Auth0:
   - Create an Auth0 application
   - Update `auth0-config.ts` with your credentials

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security Features

- OAuth2-based authentication with Auth0
- JWT token validation
- Secure WebSocket connections
- Protected API endpoints
- CORS configuration
- Input validation and sanitization

## 📦 Technologies Used

### Backend
- Spring Boot 3.x
- Spring WebSocket
- Spring Security
- Spring Data JPA
- Apache Kafka
- MySQL
- Lombok

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Auth0 React SDK
- STOMP.js
- Axios
- React Router

## 🛠️ Development

### Code Quality
- ESLint for code linting
- TypeScript for type safety
- Prettier for code formatting

### Testing
- JUnit for backend testing
- React Testing Library for frontend testing

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request