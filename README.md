# Real-Time Chat Application

A modern, scalable real-time chat application built with React, Spring Boot, and Kafka. This project demonstrates advanced concepts in real-time communication, microservices architecture, and cloud-native development.

![Tech Stack](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🌟 Features

- **Real-time Messaging**: Instant message delivery using WebSocket technology
- **Group & Private Chats**: Support for both one-on-one and group conversations
- **Message Persistence**: Reliable message storage using Kafka and MySQL
- **Authentication**: Secure user authentication using Auth0
- **Responsive Design**: Modern UI that works seamlessly across all devices
- **Scalable Architecture**: Microservices-based design for easy scaling
- **Containerized Deployment**: Docker-based deployment for consistent environments

## 🏗️ Architecture

The application follows a modern microservices architecture:

```
real-time-chat-app/
├── Frontend/           # React + TypeScript SPA
│   ├── src/           # Source code
│   │   ├── components/    # React components
│   │   ├── services/      # API and WebSocket services
│   │   └── auth/          # Authentication logic
│   ├── Dockerfile     # Production container config
│   └── nginx.conf     # Nginx reverse proxy config
├── Backend/           # Spring Boot microservice
│   ├── src/           # Source code
│   │   ├── controller/    # REST endpoints
│   │   ├── service/       # Business logic
│   │   ├── repository/    # Data access
│   │   └── config/        # Application config
│   └── Dockerfile     # Production container config
└── docker-compose.yml # Service orchestration
```

## 🚀 Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **TypeScript**: Type-safe JavaScript
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **SockJS/STOMP**: WebSocket client libraries

### Backend
- **Spring Boot 3**: Enterprise Java framework
- **Spring Security**: Authentication and authorization
- **Spring WebSocket**: Real-time communication
- **Spring Data JPA**: Data persistence
- **Kafka**: Message streaming and persistence
- **MySQL**: Relational database

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Service orchestration
- **Nginx**: Reverse proxy and static file serving
- **Auth0**: Identity and access management

## 🛠️ Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local frontend development)
- Java 17+ (for local backend development)
- Maven (for local backend development)
- Auth0 account (for authentication)

### Environment Setup

1. Create a `.env` file in the root directory:
```env
AUTH0_ISSUER_URI=your_auth0_issuer_uri
AUTH0_AUDIENCE=your_auth0_audience
```

### Running with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd real-time-chat-app
```

2. Start all services:
```bash
docker-compose up --build
```

3. Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:8080

### Local Development

#### Frontend Development
```bash
cd Frontend
npm install
npm run dev
```

#### Backend Development
```bash
cd Backend
./mvnw clean package
./mvnw spring-boot:run
```

## 🔒 Security Features

- JWT-based authentication with Auth0
- Secure WebSocket connections
- CORS configuration
- Input validation and sanitization
- Rate limiting
- Secure password handling

## 📈 Performance Optimizations

- WebSocket connection pooling
- Message batching
- Efficient database queries
- Caching strategies
- Optimized Docker images
- Nginx load balancing

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Your Name
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Spring Boot team for the amazing framework
- React team for the frontend library
- Apache Kafka team for the message broker
- Auth0 for authentication services