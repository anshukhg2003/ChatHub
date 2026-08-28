# 💬 ChatHub

### 🚀 Modern Real-Time Chat Application

<p align="center">
  <img src="public/logo.svg" alt="ChatHub" width="100"/>
</p>

<p align="center">
  A modern, responsive and real-time chat application built with 
  <strong>React.js + Supabase</strong>.
</p>

<p align="center">
  <a href="https://anshukhg2003.github.io/ChatHub/">
    <img src="https://img.shields.io/badge/🚀_Live_Demo-ChatHub-00bfff?style=for-the-badge" alt="Live Demo"/>
  </a>
  <a href="https://github.com/anshukhg2003/ChatHub">
    <img src="https://img.shields.io/badge/🐙_GitHub-Repository-181717?style=for-the-badge&logo=github" alt="GitHub"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat-square&logo=supabase&logoColor=white"/>
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black"/>
  <img src="https://img.shields.io/badge/CSS3-Responsive-1572B6?style=flat-square&logo=css3&logoColor=white"/>
</p>

---

## 🌐 Live Demo

### 👉 [Open ChatHub](https://anshukhg2003.github.io/ChatHub/)

Experience the application directly in your browser.

---

# 📌 About The Project

**ChatHub** is a real-time messaging web application designed to provide a simple, fast and modern communication experience.

The application allows users to authenticate, manage their profile and communicate through a responsive chat interface.

The project was developed to practice and demonstrate real-world **React frontend development, Supabase backend integration, real-time communication, responsive UI design and deployment**.

---

# ✨ Features

### 🔐 Authentication

* User registration
* User login
* Secure authentication using Supabase
* Session management
* Logout functionality

### 👤 User Profile

* Create and update user profile
* Profile image support
* User information management

### 💬 Real-Time Messaging

* Send messages instantly
* Receive messages in real time
* Sender and receiver message alignment
* Automatic message updates
* Conversation-based chat interface

### 😊 Chat Experience

* Emoji picker
* Modern chat interface
* Message input area
* User information header
* Smooth scrolling
* Responsive message bubbles

### 📱 Responsive Design

ChatHub is designed for:

* 📱 Mobile
* 📱 Android
* 🍎 iPhone
* 📟 Tablet
* 💻 Laptop
* 🖥️ Desktop

---

# 🖥️ Screenshots

## 🔐 Login Page

<p align="center">
  <img src="<img width="1366" height="768" alt="Screenshot (214)" src="https://github.com/user-attachments/assets/0bab9736-76e6-45ab-a527-75274575308b" />
" alt="ChatHub Login" width="800"/>
</p>

---

## 💬 Chat Interface

<p align="center">
  <img src="<img width="1366" height="768" alt="Screenshot (215)" src="https://github.com/user-attachments/assets/46d63957-3fc0-4872-aa22-44af810be6ec" />
" alt="ChatHub Chat" width="800"/>
</p>

---

## 📱 Mobile View

<p align="center">
  <img src="<img width="1366" height="768" alt="Screenshot (216)" src="https://github.com/user-attachments/assets/2ff9c87c-f6c1-4729-ab00-862b6368633b" />
" alt="ChatHub Mobile" width="350"/>
</p>

> 📌 Replace the screenshot paths above with your actual screenshots.

---

# 🛠️ Tech Stack

| Technology            | Usage                  |
| --------------------- | ---------------------- |
| ⚛️ React.js           | Frontend               |
| ⚡ Vite                | Build Tool             |
| 🟢 Supabase           | Backend                |
| 🔐 Supabase Auth      | Authentication         |
| ⚡ Supabase Realtime   | Real-Time Messaging    |
| 🎨 CSS3               | UI & Responsive Design |
| 😊 Emoji Picker React | Emoji Support          |
| 🧭 React Router       | Routing                |
| 🐙 Git & GitHub       | Version Control        |
| 🚀 GitHub Pages       | Deployment             |

---

# 🏗️ Application Architecture

```text
                    ┌─────────────────────┐
                    │      ChatHub        │
                    │    React Frontend   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
          Authentication    Database       Realtime
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                        ┌──────────────┐
                        │   Supabase   │
                        └──────────────┘
```

---

# 📂 Project Structure

```text
ChatHub/
│
├── public/
│   ├── images/
│   └── logo.svg
│
├── src/
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── common/
│   │   └── layout/
│   │
│   ├── Pages/
│   │   ├── Login/
│   │   ├── ProfileUpdate/
│   │   └── Chat/
│   │
│   ├── config/
│   │
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Getting Started

Follow these steps to run ChatHub locally.

## 1. Clone Repository

```bash
git clone https://github.com/anshukhg2003/ChatHub.git
```

## 2. Enter Project

```bash
cd ChatHub
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Start Development Server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### ⚠️ Security

**Never commit your `.env` file to GitHub.**

Add the following to `.gitignore`:

```gitignore
.env
.env.local
.env.production
```

### 🚨 Important

Do **not** put private Supabase credentials such as the `service_role` key inside frontend code or `VITE_` environment variables.

Frontend environment variables are bundled into the browser and can be inspected by users.

Use only the appropriate public client key on the frontend and protect sensitive operations with backend/server-side logic and Supabase security policies.

---

# 🗄️ Supabase Configuration

ChatHub uses Supabase for backend functionality.

### Supabase provides:

```text
Authentication
      ↓
User Accounts
      ↓
User Profiles
      ↓
Messages
      ↓
Realtime Updates
```

### Main Backend Features

* Authentication
* PostgreSQL Database
* Row Level Security
* Realtime subscriptions
* User profile storage
* Message storage

---

# 💬 Chat Flow

```text
User A
   │
   │ Send Message
   ▼
ChatHub React App
   │
   ▼
Supabase Database
   │
   │ Realtime Event
   ▼
ChatHub React App
   │
   ▼
User B
```

Messages are stored in Supabase and realtime updates allow the receiver to see new messages without manually refreshing the page.

---

# 📱 Responsive Design

ChatHub uses responsive CSS to provide a consistent experience across different screen sizes.

### Desktop

```text
┌─────────────────────────────────────────────┐
│ Sidebar              │      Chat            │
│                      │                      │
│ Users                │      Messages        │
│                      │                      │
│                      │      Message Input   │
└─────────────────────────────────────────────┘
```

### Mobile

```text
┌─────────────────────┐
│     Chat Header     │
├─────────────────────┤
│                     │
│     Messages        │
│                     │
│                     │
├─────────────────────┤
│ 😊  Message    ➤   │
└─────────────────────┘
```

---

# 🚀 Deployment

ChatHub is deployed using **GitHub Pages**.

### Build Project

```bash
npm run build
```

The production files are generated inside:

```text
dist/
```

### Vite Configuration

```js
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/ChatHub/',
})
```

The `base` path is important because the project is hosted under:

```text
https://anshukhg2003.github.io/ChatHub/
```

---

# 🧭 Routing

ChatHub uses React Router.

For GitHub Pages deployment, the project uses:

```jsx
<HashRouter>
  <App />
</HashRouter>
```

This allows routes such as:

```text
/#/login
/#/profile-update
/#/chat
```

to work correctly on GitHub Pages.

---

# 📚 What I Learned

Through this project, I gained practical experience with:

* React.js
* Functional Components
* React Hooks
* State Management
* React Router
* Supabase
* Authentication
* PostgreSQL
* Row Level Security
* Realtime subscriptions
* CRUD operations
* Responsive CSS
* Mobile-first UI
* Git & GitHub
* GitHub Pages
* Environment Variables
* Production Deployment

---

# 🔮 Future Improvements

The following features are planned for future versions:

* 📎 File Sharing
* 🟢 Online / Offline Status
* ✍️ Typing Indicator
* ✔️ Message Read Receipts
* 🗑️ Delete Messages
* ✏️ Edit Messages
* 🔔 Notifications
* 🔍 Message Search
* 🌙 Theme Customization

---

# 🐛 Known Issues

Some features may still be under development as the project continues to evolve.

If you find a bug, feel free to open an issue in the repository.

---

# 🤝 Contributing

Contributions, suggestions and improvements are welcome.

### Steps

```bash
# Fork the repository

# Clone your fork
git clone YOUR_REPOSITORY_URL

# Create a new branch
git checkout -b feature/new-feature

# Make your changes

# Commit
git add .
git commit -m "Add new feature"

# Push
git push origin feature/new-feature
```

Then open a Pull Request.

---

# ⭐ Support

If you found **ChatHub** useful or interesting:

### ⭐ Give the repository a star

### 🍴 Fork the project

### 🐛 Report issues

### 💡 Suggest new features

Every contribution and suggestion is appreciated ❤️

---

# 👨‍💻 Developer

## Anshu Kumar Raj

**Frontend Developer | React Developer**

Passionate about creating modern, responsive and user-friendly web applications.

<p align="center">

<a href="https://github.com/anshukhg2003">
  <img src="https://img.shields.io/badge/GitHub-anshukhg2003-181717?style=for-the-badge&logo=github"/>
</a>

</p>

---

# 📄 License

This project is created for **learning, development and portfolio purposes**.

---

<p align="center">

### 💙 Built with React + Supabase

**ChatHub © 2026**

</p>
