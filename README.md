# 🎓 Academic Portal

A comprehensive academic management system with mobile app, web admin portal, and backend API.

> **📚 For detailed documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)**

## 📱 Project Structure

```
Final Year Project/
├── 📱 academic-portal-app/     # React Native Mobile App
├── 🌐 academic-portal-admin/   # Next.js Admin Web Portal
├── 🚀 backend/                 # FastAPI Backend API
├── 📖 DOCUMENTATION.md         # Complete technical documentation
└── � README.md               # This file - Quick start guide
```

## 🌐 Live Deployment

- **Backend API**: https://academic-portal-api.onrender.com
- **API Docs**: https://academic-portal-api.onrender.com/docs
- **Database**: PostgreSQL on Render (28 tables)
- **Status**: ✅ Production Ready (Backend 95% complete)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/academic-portal.git
cd academic-portal
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app/main.py
```

### 3. Admin Portal Setup

```bash
cd academic-portal-admin
npm install
npm run dev
```

### 4. Mobile App Setup

```bash
cd academic-portal-app
npm install
npx expo start
```

## 🌐 Live Demo

- **Backend API:** [https://your-api.onrender.com](https://your-api.onrender.com)
- **Admin Portal:** [https://your-admin.vercel.app](https://your-admin.vercel.app)
- **API Documentation:** [https://your-api.onrender.com/docs](https://your-api.onrender.com/docs)

## 🔐 Demo Credentials

**Admin Login:**

- User ID: `A001`
- Password: `admin123`

**Teacher Login:**

- User ID: `T001`
- Password: `teacher123`

**Student Login:**

- User ID: `S001`
- Password: `student123`

## 🛠️ Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (PostgreSQL for production)
- **JWT** - Authentication
- **Uvicorn** - ASGI server

### Admin Portal

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Hook Form** - Form management

### Mobile App

- **React Native** - Cross-platform mobile
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation

## 📚 Features

### 👨‍💼 Admin Features

- Dashboard with analytics
- User management (students, teachers)
- Course and semester management
- Schedule management
- Grade oversight
- System settings

### 👨‍🏫 Teacher Features

- Course management
- Student enrollment
- Assignment creation
- Grade management
- Schedule viewing
- Chat with students

### 👨‍🎓 Student Features

- Course enrollment
- Schedule viewing
- Assignment submission
- Grade checking
- Chat with teachers
- Academic calendar

### 📱 Mobile Features

- Cross-platform (iOS/Android)
- Offline capability
- Push notifications
- Biometric login
- Dark/Light theme

## 🚀 Deployment

### ✅ **Web Services (Can be deployed online):**

#### Backend API (Render)

1. Push to GitHub
2. Connect to Render
3. Deploy as web service
4. Set environment variables

#### Admin Portal (Vercel)

1. Connect GitHub repo
2. Deploy Next.js app
3. Configure environment variables

### 📱 **Mobile App (Cannot be deployed to web hosting):**

**Distribution Options:**

- **Development:** Expo Development Build (`npx expo start`)
- **Testing:** Build APK with EAS (`eas build --platform android --profile preview`)
- **Production:** App Store distribution (iOS/Android)

**Note:** React Native apps require app store distribution or direct APK installation. They cannot be hosted on web platforms like Render/Vercel.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔧 Environment Variables

### Backend (.env)

```env
ENVIRONMENT=development
SECRET_KEY=your-secret-key
DEBUG=true
DATABASE_URL=sqlite:///./academic_portal.db
```

### Admin Portal (.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```

### Mobile App (.env)

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EXPO_PUBLIC_ENVIRONMENT=development
```

## 📖 API Documentation

The API documentation is automatically generated and available at:

- Development: http://localhost:8000/docs
- Production: https://your-api.onrender.com/docs

## 🧪 Testing

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd academic-portal-admin
npm test
```

### Mobile

```bash
cd academic-portal-app
npm test
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

If you have any questions or issues:

- Create an issue on GitHub
- Contact: your-email@example.com

## 🎯 Roadmap

- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Advanced analytics
- [ ] Multi-campus support
- [ ] API rate limiting
- [ ] Advanced security features

---

**Made with ❤️ for education**
