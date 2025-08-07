# NoBroker Backend

A Node.js backend API for the NoBroker property rental platform built with Express.js, TypeScript, and Prisma ORM.

## 🚀 Features

- RESTful API endpoints
- User authentication with JWT
- Property CRUD operations
- File upload handling
- Real-time chat functionality
- Database management with Prisma ORM
- PostgreSQL database support

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT
- **File Upload**: Multer

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your database connection in `.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/nobroker"
JWT_SECRET="your-jwt-secret"
PORT=5000
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

5. Start the development server:
```bash
npm run dev
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties
- `GET /api/properties/:id` - Get property by ID
- `POST /api/properties` - Create new property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property

### Chat
- `GET /api/chat` - Get chat messages
- `POST /api/chat` - Send message

## 📁 Database Schema

The application uses Prisma with the following main models:
- **User**: User accounts and authentication
- **Property**: Property listings with details
- **Chat**: Real-time messaging system
- **File**: File uploads for property images

## 🔧 Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

## 📝 Environment Variables

```env
DATABASE_URL="postgresql://username:password@localhost:5432/nobroker"
JWT_SECRET="your-secret-key"
PORT=5000
NODE_ENV=development
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
