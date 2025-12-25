# TuitionDekho 🎓

A modern platform connecting students with teachers for seamless learning and real-time interaction.

## 🌐 Live Links

- **Frontend (Vercel):** https://tuition-dekho.vercel.app/
- **Backend (Render):** https://tuitiondekho.onrender.com

---

## 📌 What is TuitionDekho?

**TuitionDekho** is an online tuition marketplace that bridges the gap between students seeking quality education and qualified teachers offering their expertise. It's a full-stack web application designed to facilitate:

- Easy discovery and booking of teachers
- Real-time chat communication
- Video calling for live classes
- Meeting request management
- Secure authentication and user management

---

## 🎯 Why TuitionDekho?

### Problem Solved
- **For Students:** Finding the right tutor is difficult, time-consuming, and unreliable
- **For Teachers:** Limited platforms to reach students and manage their students effectively

### Solution
A centralized, user-friendly platform that:
- ✅ Provides verified teacher profiles with ratings and specializations
- ✅ Enables direct communication and scheduling
- ✅ Supports video calls for interactive learning
- ✅ Handles payments and notifications
- ✅ Maintains detailed meeting history and records

---

## 🚀 Key Features & Flow

### 1. **User Authentication**
   - Sign up as Student or Teacher
   - Email verification
   - Secure login with JWT tokens
   - Password reset functionality

### 2. **Teacher Discovery (Students)**
   - Search teachers by subject/expertise
   - View detailed teacher profiles
   - Check ratings and reviews
   - Send meeting requests

### 3. **Real-time Communication**
   - Instant messaging between students and teachers
   - Socket.IO for live notifications
   - Message history and conversation logs

### 4. **Video Calling**
   - Peer-to-peer video calls
   - Call request management
   - Call history tracking

### 5. **Meeting Management**
   - Request meetings with available slots
   - Accept/Reject meeting requests
   - Schedule and track sessions
   - Automatic notifications

### 6. **Notifications System**
   - Real-time push notifications
   - Email alerts for important events
   - Notification preferences

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** React (TypeScript)
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn/ui
- **State Management:** React Context
- **API Client:** Axios
- **Real-time:** Socket.IO Client

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Real-time:** Socket.IO
- **Email Service:** Nodemailer

---

## 📦 Project Structure

```
.
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # API calls and utilities
│   │   └── contexts/      # React Context providers
│   └── package.json
│
├── backend/               # Express.js API server
│   ├── controllers/       # Route handlers
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   ├── server.js          # Main server file
│   └── package.json
│
└── docker-compose.yml     # Docker orchestration
```

---

## 🔄 User Journey

### For a Student:
1. **Sign Up** → Create student account
2. **Search** → Find teachers by subject
3. **View Profile** → Check teacher details and reviews
4. **Request Meeting** → Send availability request
5. **Chat** → Communicate with teacher
6. **Video Call** → Take live class
7. **Provide Feedback** → Rate and review

### For a Teacher:
1. **Sign Up** → Create teacher profile
2. **Set Details** → Add qualifications and subjects
3. **Manage Requests** → Accept/Reject student requests
4. **Schedule Sessions** → Set available time slots
5. **Teach** → Conduct video calls
6. **Track Progress** → Monitor student interactions

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14+)
- MongoDB
- Git

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `.env` files in both frontend and backend directories with necessary credentials.

---

## 📱 Features Highlights

| Feature | Description |
|---------|------------|
| **Real-time Chat** | Instant messaging with Socket.IO |
| **Video Calls** | Peer-to-peer calling for classes |
| **Meeting Scheduler** | Easy scheduling with availability slots |
| **Notifications** | Real-time alerts and email notifications |
| **Secure Auth** | JWT-based authentication |
| **Teacher Ratings** | Review and rating system |
| **Call History** | Track all interactions |

---

## 🔐 Security Features

- JWT token-based authentication
- Password hashing (bcrypt)
- Email verification
- Protected API routes
- CORS configuration
- Input validation and sanitization

---

## 📊 Future Enhancements

- Payment integration (Stripe/Razorpay)
- Video recording and replay
- Batch classes support
- Advanced analytics dashboard
- Certification system
- Mobile app (React Native)

---

## 🤝 Contributing

This project welcomes contributions. Please follow the existing code structure and conventions.

---

## 📄 License

This project is private and proprietary.

---

## 📧 Contact & Support

For issues, feedback, or feature requests, please reach out through the platform.

---

**Last Updated:** December 2025

Made with ❤️ for students and teachers everywhere.
