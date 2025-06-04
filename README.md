# Real-Time Chat Application

<div align="center">


[![Tech Stack](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Kafka](https://img.shields.io/badge/Apache_Kafka-231F20?style=for-the-badge&logo=apache-kafka&logoColor=white)](https://kafka.apache.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

A modern, scalable real-time chat application built with React, Spring Boot, and Kafka. This project demonstrates advanced concepts in real-time communication, microservices architecture, and cloud-native development.

[Demo](https://chatapp.futurewithai.space/) · [Report Bug](https://github.com/yourusername/real-time-chat-app/issues) · [Request Feature](https://github.com/yourusername/real-time-chat-app/issues)

</div>

## 📋 Table of Contents
- [Features](#-features)
- [Architecture](#️-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#️-getting-started)
- [Security Features](#-security-features)
- [Performance Optimizations](#-performance-optimizations)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🌟 Features

- **Real-time Messaging**
  - Instant message delivery using WebSocket technology
  - Message read receipts and typing indicators
  - Real-time presence indicators

- **Chat Capabilities**
  - One-on-one private messaging
  - Group chat support with member management
  - File sharing and emoji support
  - Message history with infinite scroll

- **Robust Backend**
  - Message persistence using Kafka and MySQL
  - Scalable microservices architecture
  - Load balancing and high availability

- **Security & Authentication**
  - Secure user authentication via Auth0
  - End-to-end message encryption
  - Rate limiting and DDOS protection

- **Modern UI/UX**
  - Responsive design for all devices
  - Dark/Light theme support
  - Intuitive and clean interface
  - Accessibility compliant

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

Before you begin, ensure you have the following installed:
- Docker Desktop (latest version)
- Node.js (v18.0.0 or higher)
- Java Development Kit (JDK 17 or higher)
- Maven (latest version)
- Git
- An Auth0 account for authentication

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Auth0 Configuration
AUTH0_ISSUER_URI=your_auth0_issuer_uri
AUTH0_AUDIENCE=your_auth0_audience
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Database Configuration
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_DATABASE=chat_db
MYSQL_USER=chat_user
MYSQL_PASSWORD=your_db_password

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=kafka:9092
KAFKA_GROUP_ID=chat_group
```

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/abhi-up79/real-time-chat-app.git
   cd real-time-chat-app
   ```

2. **Frontend Setup**
   ```bash
   cd Frontend
   npm install
   cp .env.example .env.local    # Configure your environment variables
   npm run dev
   ```

3. **Backend Setup**
   ```bash
   cd Backend
   ./mvnw clean install
   ./mvnw spring-boot:run
   ```

4. **Docker Deployment**
   ```bash
   docker-compose up --build -d
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

## 📚 API Documentation

API documentation is available at:
- Swagger UI: http://localhost:8080/swagger-ui.html
- API Docs: http://localhost:8080/v3/api-docs

For detailed API documentation, please visit our [API Guide](docs/API.md).

## 🧪 Testing

Run the test suites:

```bash
# Frontend Tests
cd Frontend
npm run test

# Backend Tests
cd Backend
./mvnw test
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project does not have any licese.
## 👨‍💻 Author

**Your Name**
- Website: [abhi.futurewithai.space](https://abhi.futurewithai.space/)
- GitHub: [abhi-up79](https://github.com/abhi-up79)
- LinkedIn: [LinkedIn](https://www.linkedin.com/in/abhiup79)

## 💝 Support

If you find this project helpful, please consider:
- ⭐️ Starring the repository
- 🐛 Reporting bugs
- 📝 Submitting PRs
- 🌟 Sharing the project

## 🙏 Acknowledgments

- Spring Boot team for the amazing framework
- React team for the frontend library
- Apache Kafka team for the message broker
- Auth0 for authentication services

---

<div align="center">
Made with ❤️ by [Abhishek Sharma](https://www.linkedin.com/in/abhiup79)
</div>