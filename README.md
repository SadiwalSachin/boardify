# 🎨 Boardify - Futuristic Real-Time Whiteboard

Boardify is a high-performance, collaborative digital workspace designed for modern teams. Brainstorm, design, and visualize ideas together in real-time with a sleek, futuristic interface and advanced drawing tools.

![Boardify Hero](Frontend/src/assets/hero.png)

## ✨ Features

- **🚀 Real-Time Collaboration**: Work simultaneously with your team on a shared canvas with zero latency.
- **🌓 Global Theming**: Seamlessly switch between a clean Light Mode and a premium, ultra-dark Futuristic Mode.
- **🎨 Infinite Canvas**: Unlimited drawing space with smooth panning - draw as large as you need!
- **🔍 Advanced Navigation**: 
  - **Pan & Scroll**: Hold Spacebar + drag or use middle mouse button to navigate horizontally and vertically
  - **Focal Point Zoom**: Focus on details with mouse-wheel zooming (10% - 1000%)
  - **Pinch-to-Zoom**: Fluid mobile gestures for navigation
  - **Quick Controls**: Instant reset and percentage tracking
- **✏️ Professional Drawing Tools**:
  - Free drawing with smooth lines
  - Shapes (Rectangle, Circle, Arrow)
  - Text with single-click editing
  - Select, move, resize, and rotate any element
- **💎 Futuristic UI**: Glassmorphism, mesh gradients, and smooth Framer Motion animations for a premium feel.
- **🔐 Secure Sync**: Google & Email authentication powered by Firebase and custom JWT.
- **📁 Board Management**: Save, rename, and organize multiple boards in your personal dashboard.

## 🛠️ Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Chakra UI** (Style System & Theming)
- **Konva / React-Konva** (Canvas Engine)
- **Framer Motion** (Pro Animations)
- **Socket.io-client** (Real-time syncing)

### Backend
- **Node.js & Express**
- **MongoDB** with Mongoose
- **Socket.io** (Websocket Server)
- **Firebase Admin SDK** (Auth verification)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB instance
- Firebase Project (for Auth)

### 1. Clone the Repository
```bash
git clone https://github.com/SadiwalSachin/collabboardProject.git
cd collabboardProject
```

### 2. Backend Setup
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
VITE_BACKEND_URL=http://localhost:5000
```
Run the server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../Frontend
npm install
```
Create a `.env` file in the `Frontend` folder:
```env
VITE_BACKEND_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```
Run the development server:
```bash
npm run dev
```

## 📸 Screenshots

| Dashboard | Paint Engine | Dark Mode |
|-----------|--------------|-----------|
| ![Dashboard](https://via.placeholder.com/300x200.png?text=Premium+Dashboard) | ![Paint](https://via.placeholder.com/300x200.png?text=Advanced+Canvas) | ![Dark Mode](https://via.placeholder.com/300x200.png?text=Futuristic+Dark+UI) |

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with 💙 by [SadiwalSachin](https://github.com/SadiwalSachin)
