import http from "http"
import { app } from "../../app.js"
import { Server } from "socket.io"

const server = http.createServer(app)

const io = new Server(server, {
    path: "/api/socket.io/",
    cors: {
        origin: "*", // More flexible for the current network setup
        methods: ["GET", "POST"]
    }
})

const DrawAction = {
    Scribble: "freedraw",
};

// Room tracking: { roomId: { users: { socketId: userInfo }, elements: [] } }
const rooms = {};

io.on("connection", (socket) => {
    console.log("Connection established with socket id:-", socket.id)

    socket.on('joinRoom', ({ roomId, user }) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                users: {},
                elements: []
            };
        }

        // Save user info for this socket
        rooms[roomId].users[socket.id] = {
            id: socket.id,
            name: user?.displayName || 'Guest',
            photo: user?.photoURL || '',
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            x: 0,
            y: 0
        };

        console.log(`User ${rooms[roomId].users[socket.id].name} joined room: ${roomId}`);

        // Send current state and users to the new user
        socket.emit('roomState', {
            users: Object.values(rooms[roomId].users),
            elements: rooms[roomId].elements
        });

        // Notify others
        socket.to(roomId).emit('usersUpdated', Object.values(rooms[roomId].users));
    });

    socket.on('cursorMove', ({ roomId, x, y }) => {
        if (rooms[roomId] && rooms[roomId].users[socket.id]) {
            rooms[roomId].users[socket.id].x = x;
            rooms[roomId].users[socket.id].y = y;
            // Broadcast movement to others in the room
            socket.to(roomId).emit('cursorMoved', {
                userId: socket.id,
                x,
                y
            });
        }
    });

    socket.on('whiteboardAction', (data) => {
        const { roomId, type, action } = data;
        if (!rooms[roomId]) return;

        if (type === 'clear') {
            rooms[roomId].elements = [];
        } else {
            const existingIndex = rooms[roomId].elements.findIndex(s => s.id === action.id);
            if (existingIndex !== -1) {
                const existing = rooms[roomId].elements[existingIndex];
                if (action.remove) {
                    rooms[roomId].elements.splice(existingIndex, 1);
                } else if ((type === 'freedraw' || type === 'scribble' || existing.type === 'freedraw' || existing.type === 'scribble') && action.points) {
                    if (!existing.points) existing.points = [];
                    existing.points.push(...action.points);
                } else {
                    // Standard merge for other shapes
                    rooms[roomId].elements[existingIndex] = { ...existing, ...action };
                }
            } else {
                // New element creation
                const newElement = { ...action };
                if (!newElement.type) newElement.type = type;
                rooms[roomId].elements.push(newElement);
            }
        }

        // Broadcast to others in the room
        socket.to(roomId).emit('whiteboardAction', data);
    });

    socket.on('disconnecting', () => {
        // Clean up user from any rooms they were in
        for (const roomId of socket.rooms) {
            if (rooms[roomId] && rooms[roomId].users[socket.id]) {
                delete rooms[roomId].users[socket.id];
                if (Object.keys(rooms[roomId].users).length === 0) {
                    // We can keep the room or delete it. Let's keep elements for a bit?
                    // For now, delete if truly empty.
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit('usersUpdated', Object.values(rooms[roomId].users));
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log("User disconnected:", socket.id);
    });
})

export { io, server }