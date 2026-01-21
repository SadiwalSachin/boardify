import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { Paint } from "./components/Paint";
import ProtectedRoute from "./components/ProtectedRoute";
import { Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import io, { Socket } from "socket.io-client"
import { useEffect, useState } from "react";
import theme from "./theme";

function App() {

  const [socket, setSockt] = useState<Socket | null>(null)

  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
    const socketio = io(BACKEND_URL.replace(/\/api\/?$/, ""), {
      path: "/api/socket.io/",
    });
    setSockt(socketio)
    socketio.on("connect", () => {
      console.log("Connected to backend");
    })
  }, [])

  return (
    <>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ChakraProvider theme={theme}>
        <Routes>
          <Route path="/" element={<Home socket={socket} />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/:roomId" element={<ProtectedRoute><Paint /></ProtectedRoute>} />
        </Routes>
      </ChakraProvider>
    </>
  );
}

export default App;
