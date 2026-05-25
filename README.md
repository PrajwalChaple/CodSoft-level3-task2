# ApexFlow — Modern Project Management Tool

ApexFlow is a premium, real-time project management tool that allows teams to seamlessly create projects, assign tasks, set deadlines, and track overall progress in real-time. Built with a stunning dark mode interface, glassmorphism aesthetics, and smooth drag-and-drop interactions.

## Features
- 📊 **Dynamic Dashboard** — View real-time statistics of projects, upcoming deadlines, and task breakdown.
- 📋 **Visual Kanban Board** — Drag-and-drop tasks between columns (To Do, In Progress, Review, Done).
- 🏷️ **Task Customization** — Assign tags, priority levels (Low, Medium, High, Critical), assignees, and deadlines.
- 💬 **Real-time Comments** — Instantly communicate with team members inside individual tasks.
- 📡 **Socket.io Sync** — Live updates synchronized across all active users.
- 🔒 **Secure Authentication** — JWT-based register/login persistence.
- ⚙️ **User Settings** — Easily update profiles and passwords.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, CSS (custom custom variables/glassmorphism theme), React Router, Axios, Socket.io-client.
- **Backend:** Node.js, Express, Socket.io, Mongoose.
- **Database:** MongoDB (configured for Atlas Cloud).

## Installation

### Prerequisites
- Node.js installed on your machine.
- MongoDB Atlas account/cluster or local MongoDB server.

### 1. Clone the repository
```bash
git clone https://github.com/PrajwalChaple/CodSoft-level3-task2.git
cd CodSoft-level3-task2
```

### 2. Configure Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```

### 3. Install & Start Backend Server
```bash
cd server
npm install
npm run dev
```

### 4. Install & Start Frontend Client
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.
