import { KonvaEventObject } from "konva/lib/Node";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Line as KonvaLine,
  Transformer,
  Group,
  Text as KonvaText,
  Path as KonvaPath,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { Scribble, Size } from "../components/Paint.types";
import { DrawAction, PAINT_OPTIONS } from "./Paint.constants";
import { SketchPicker } from "react-color";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  useMediaQuery,
  useToast,
  AvatarGroup,
  Avatar,
  Tooltip,
  Text as ChakraText,
  useColorMode,
  useColorModeValue
} from "@chakra-ui/react";

import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import {
  LuLayout,
  LuUsers,
  LuClock,
  LuSettings,
  LuDownload,
  LuUndo2,
  LuRedo2,
  LuTrash2,
  LuChevronLeft,
  LuLayoutDashboard,
  LuShare2,
  LuMenu,
  LuX,
  LuSave,
  LuMoon,
  LuSun,
  LuPlus,
  LuMinus,
  LuMaximize
} from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
const SOCKET_ENDPOINT = BACKEND_URL.replace(/\/api\/?$/, "");
const socket = io(SOCKET_ENDPOINT, {
  path: "/api/socket.io/",
});

const downloadURI = (uri: string, name: string) => {
  const link = document.createElement("a");
  link.download = name;
  link.href = uri || "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const SIZE = 500;

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const activeTextColor = useColorModeValue('blue.600', 'blue.200');

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors`}
      style={{
        backgroundColor: active ? activeBg : undefined,
        color: active ? activeTextColor : textColor
      }}
    >
      <Icon size={20} />
      <span className="lg:inline">{label}</span>
    </button>
  );
};

export const Paint: React.FC = React.memo(function Paint() {
  const [size, setSize] = useState<Size>({ width: window.innerWidth, height: window.innerHeight });
  const [color, setColor] = useState("#000");
  const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Select);
  const [scribbles, setScribbles] = useState<Scribble[]>([]);
  const [boardName, setBoardName] = useState<string>("Untitled Board");
  const [image, setImage] = useState<HTMLImageElement>();
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<any>(null);
  const isPaintRef = useRef(false);
  const currentShapeRef = useRef<string>();
  const transformerRef = useRef<any>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const { user, getIdToken } = useAuth();

  const [isMobile] = useMediaQuery("(max-width: 1024px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [history, setHistory] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number, y: number, name: string, color: string }>>({});
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = colorMode; // Alias for compatibility with existing code
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const { roomId } = useParams();

  // Load drawing from MongoDB on mount
  useEffect(() => {
    const fetchDrawing = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/drawings/room/${roomId}`);
        if (response.data) {
          setScribbles(response.data.elements || []);
          setBoardName(response.data.name || "Untitled Board");
        }
      } catch (error: any) {
        console.error("No existing drawing found or error:", error);
      }
    };
    if (roomId) fetchDrawing();
  }, [roomId]);

  const saveDrawing = async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      // Generate thumbnail
      const thumbnail = stageRef?.current?.toDataURL();

      await axios.post(`${BACKEND_URL}/drawings/save`, {
        roomId,
        elements: scribbles,
        name: boardName,
        thumbnail
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: "Board Saved",
        description: "Your drawing has been stored in the cloud.",
        status: "success",
        duration: 2000,
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: "Could not save your drawing.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const addToHistory = useCallback((action: any) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, currentStep + 1);
      return [...newHistory, action];
    });
    setCurrentStep(prevStep => prevStep + 1);
  }, [currentStep]);

  const undo = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const prevState = history[prevStep];
      setCurrentStep(prevStep);
      applyState(prevState);
      emitWhiteboardAction('undo', { step: prevStep });
    }
  }, [currentStep, history]);

  const redo = useCallback(() => {
    if (currentStep < history.length - 1) {
      const nextStep = currentStep + 1;
      const nextState = history[nextStep];
      setCurrentStep(nextStep);
      applyState(nextState);
      emitWhiteboardAction('redo', { step: nextStep });
    }
  }, [currentStep, history]);

  const applyState = useCallback((state: any) => {
    setScribbles(state.scribbles || []);
    setImage(state.image);
  }, []);

  const onImportImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const imageUrl = URL.createObjectURL(e.target.files?.[0]);
      const image = new Image(SIZE / 2, SIZE / 2);
      image.src = imageUrl;
      setImage(image);
    }
    e.target.files = null;
  }, []);

  const emitWhiteboardAction = useCallback((type: string, action: any) => {
    socket.emit('whiteboardAction', { roomId, type, action });
  }, [roomId]);

  const handleWhiteboardAction = useCallback((action: any) => {
    switch (action.type) {
      case DrawAction.Scribble:
        setScribbles((prevScribbles) => {
          const existingScribbleIndex = prevScribbles.findIndex(s => s.id === action.action.id);
          if (existingScribbleIndex !== -1) {
            const updatedScribbles = [...prevScribbles];
            updatedScribbles[existingScribbleIndex] = {
              ...updatedScribbles[existingScribbleIndex],
              points: [...updatedScribbles[existingScribbleIndex].points, ...action.action.points]
            };
            return updatedScribbles;
          }
          return [...prevScribbles, action.action];
        });
        break;
      case 'clear':
        setScribbles([]);
        setImage(undefined);
        break;
      case 'undo':
        setCurrentStep(action.action.step);
        applyState(history[action.action.step]);
        break;
      case 'redo':
        setCurrentStep(action.action.step);
        applyState(history[action.action.step]);
        break;
    }
  }, [applyState, history]);

  useEffect(() => {
    if (!roomId) return;

    const onConnect = () => {
      socket.emit('joinRoom', { roomId, user });
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);

    socket.on('usersUpdated', (users) => {
      setActiveUsers(users.filter((u: any) => u.id !== socket.id));
    });

    socket.on('cursorMoved', ({ userId, x, y }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [userId]: { ...prev[userId], x, y }
      }));
    });

    socket.on('whiteboardAction', handleWhiteboardAction);

    return () => {
      socket.off('connect', onConnect);
      socket.off('usersUpdated');
      socket.off('cursorMoved');
      socket.off('whiteboardAction', handleWhiteboardAction);
    };
  }, [roomId, user, handleWhiteboardAction]);

  useEffect(() => {
    // Update remote cursors metadata when users list changes
    const newCursors: any = {};
    activeUsers.forEach(u => {
      newCursors[u.id] = {
        x: remoteCursors[u.id]?.x || 0,
        y: remoteCursors[u.id]?.y || 0,
        name: u.name,
        color: u.color
      };
    });
    setRemoteCursors(newCursors);
  }, [activeUsers]);

  const onStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (drawAction === DrawAction.Select) return;

    if (e.evt && 'preventDefault' in e.evt) {
      e.evt.preventDefault();
    }

    isPaintRef.current = true;
    const stage = stageRef?.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const oldScale = stage.scaleX();
    const x = (pos.x - stage.x()) / oldScale;
    const y = (pos.y - stage.y()) / oldScale;

    const id = uuidv4();
    currentShapeRef.current = id;
    let newAction: any = { id, x, y, color };
    if (drawAction === DrawAction.Scribble) {
      newAction.points = [x, y];
      setScribbles((prevScribbles) => [...prevScribbles, newAction as Scribble]);
    }
    emitWhiteboardAction(drawAction, newAction);
  }, [drawAction, color, emitWhiteboardAction]);

  const onStageMouseMove = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef?.current;
    if (!stage) return;

    const pos = stage.getPointerPosition();
    if (!pos) return;

    const oldScale = stage.scaleX();
    const x = (pos.x - stage.x()) / oldScale;
    const y = (pos.y - stage.y()) / oldScale;

    // Emit cursor position to others
    socket.emit('cursorMove', { roomId, x, y });

    if (drawAction === DrawAction.Select || !isPaintRef.current) return;

    if (e.evt && 'preventDefault' in e.evt) {
      e.evt.preventDefault();
    }

    const id = currentShapeRef.current;
    let updatedShape;
    if (drawAction === DrawAction.Scribble) {
      setScribbles((prevScribbles) =>
        prevScribbles.map((prevScribble) =>
          prevScribble.id === id
            ? { ...prevScribble, points: [...prevScribble.points, x, y] }
            : prevScribble
        )
      );
      updatedShape = { id, points: [x, y] };
    }
    if (updatedShape) emitWhiteboardAction(drawAction, updatedShape);
  }, [drawAction, emitWhiteboardAction, roomId]);

  const onClear = useCallback(() => {
    setScribbles([]);
    setImage(undefined);
    emitWhiteboardAction('clear', {});
    addToHistory({ scribbles: [], image: undefined });
  }, [emitWhiteboardAction, addToHistory]);


  const onExportClick = useCallback(() => {
    const dataUri = stageRef?.current?.toDataURL({ pixelRatio: 3 });
    downloadURI(dataUri, "boardify-export.png");
  }, []);

  const onStageMouseUp = useCallback(() => {
    if (isPaintRef.current) {
      addToHistory({ scribbles, image });
    }
    isPaintRef.current = false;
  }, [scribbles, image, addToHistory]);

  const onShapeClick = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (drawAction !== DrawAction.Select) return;
    const currentTarget = e.currentTarget;
    transformerRef?.current?.node(currentTarget);
  }, [drawAction]);

  const isDraggable = drawAction === DrawAction.Select;
  const onBgClick = useCallback((_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    transformerRef?.current?.nodes([]);
  }, []);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const speed = 0.05;
    const newScale = e.evt.deltaY < 0 ? oldScale * (1 + speed) : oldScale / (1 + speed);

    // Limit scale
    const finalScale = Math.min(Math.max(0.1, newScale), 10);

    setScale(finalScale);
    setPosition({
      x: pointer.x - mousePointTo.x * finalScale,
      y: pointer.y - mousePointTo.y * finalScale,
    });
  }, []);

  const [lastDist, setLastDist] = useState(0);

  const getDistance = (p1: any, p2: any) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };


  const handleTouchMove = useCallback((e: KonvaEventObject<TouchEvent>) => {
    // Pinch to zoom
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      if (stageRef.current.isDragging()) {
        stageRef.current.stopDrag();
      }

      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      if (!lastDist) {
        setLastDist(getDistance(p1, p2));
        return;
      }

      const dist = getDistance(p1, p2);
      const center = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
      };

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = center;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const newScale = oldScale * (dist / lastDist);
      const finalScale = Math.min(Math.max(0.1, newScale), 10);

      setScale(finalScale);
      setPosition({
        x: pointer.x - mousePointTo.x * finalScale,
        y: pointer.y - mousePointTo.y * finalScale,
      });

      setLastDist(dist);
    } else {
      onStageMouseMove(e);
    }
  }, [lastDist, onStageMouseMove]);

  const handleTouchEnd = useCallback(() => {
    setLastDist(0);
    onStageMouseUp();
  }, [onStageMouseUp]);

  useEffect(() => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width, height });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.unobserve(container);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={`flex h-[100dvh] w-full ${useColorModeValue('bg-white', '#0f172a')} font-sans overflow-hidden transition-colors duration-300`}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[40]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-[50] w-64' : 'w-64 z-20'} 
        border-r ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} flex flex-col p-4 ${useColorModeValue('bg-white', '#0f172a')} transform transition-transform duration-300 ease-in-out
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className="flex items-center justify-between gap-2 px-2 mb-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuLayoutDashboard size={20} />
            </div>
            <span className={`font-bold text-xl ${useColorModeValue('text-gray-900', 'white')}`}>Boardify</span>
          </div>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <LuX size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1">
          <SidebarItem icon={LuLayout} label="Dashboard" active onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={LuUsers} label="Collaborators" />
          <SidebarItem icon={LuClock} label="History" />
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col gap-1">
          <SidebarItem icon={LuSettings} label="Settings" />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 w-full relative h-full ${useColorModeValue('bg-white', '#0f172a')}`}>
        {/* Top Header */}
        <header className={`h-16 border-b ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} ${useColorModeValue('bg-white', '#0f172a')} flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 transition-colors`}>
          <div className="flex items-center gap-2 sm:gap-4">
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 -ml-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-100 rounded-lg`}
              >
                <LuMenu size={24} />
              </button>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className={`hidden sm:block p-2 hover:bg-gray-50 rounded-lg ${useColorModeValue('text-gray-500', 'gray.400')} transition-colors`}
            >
              <LuChevronLeft size={24} />
            </button>
            <div className={`hidden sm:block h-6 w-[1px] ${useColorModeValue('bg-gray-200', 'whiteAlpha.200')}`}></div>
            <h1 className={`font-semibold ${useColorModeValue('text-gray-900', 'white')} truncate max-w-[120px] sm:max-w-[160px] text-sm sm:text-base`}>
              {boardName}
            </h1>

            {/* Active Users Avatars */}
            <div className={`hidden md:flex items-center ml-2 border-l ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} pl-4`}>
              <AvatarGroup size="sm" max={3}>
                {activeUsers.map((u) => (
                  <Tooltip key={u.id} label={u.name} hasArrow>
                    <Avatar name={u.name} src={u.photo} border="2px solid" borderColor={useColorModeValue('white', '#0f172a')} />
                  </Tooltip>
                ))}
              </AvatarGroup>
              {activeUsers.length > 0 && (
                <ChakraText fontSize="xs" color={useColorModeValue('gray.400', 'gray.500')} ml={2} fontWeight="medium">
                  {activeUsers.length} online
                </ChakraText>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`hidden xs:flex items-center ${useColorModeValue('bg-gray-50', 'whiteAlpha.50')} rounded-lg p-0.5 sm:p-1`}>
              <button
                onClick={undo}
                disabled={currentStep <= 0}
                className={`p-1.5 sm:p-2 ${useColorModeValue('text-gray-600', 'gray.400')} hover:bg-white dark:hover:bg-whiteAlpha.200 hover:shadow-sm disabled:opacity-30 rounded-md transition-all`}
              >
                <LuUndo2 size={16} />
              </button>
              <button
                onClick={redo}
                disabled={currentStep >= history.length - 1}
                className={`p-1.5 sm:p-2 ${useColorModeValue('text-gray-600', 'gray.400')} hover:bg-white dark:hover:bg-whiteAlpha.200 hover:shadow-sm disabled:opacity-30 rounded-md transition-all`}
              >
                <LuRedo2 size={16} />
              </button>
            </div>

            <button
              onClick={toggleColorMode}
              className={`p-2 rounded-lg transition-all ${colorMode === 'light' ? 'text-gray-500 hover:bg-gray-100' : 'text-yellow-400 hover:bg-white/10'}`}
              title="Toggle Theme"
            >
              {colorMode === 'light' ? <LuMoon size={20} /> : <LuSun size={20} />}
            </button>

            <button
              onClick={saveDrawing}
              disabled={!user}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg border border-green-200 sm:px-4 sm:py-2 flex items-center gap-2"
            >
              <LuSave size={18} />
              <span className="hidden lg:inline text-sm font-medium">Save</span>
            </button>

            <button
              onClick={onExportClick}
              className="flex items-center gap-2 px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              <LuDownload size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => {
                const link = `${window.location.origin}/${roomId}`;
                navigator.clipboard.writeText(link);
                toast({
                  title: "Link Copied",
                  description: "Share this link with your teammates",
                  status: "success",
                  duration: 2000,
                });
              }}
              className="hidden sm:block p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            >
              <LuShare2 size={20} />
            </button>
          </div>
        </header>

        {/* Drawing Toolbar - Floating */}
        <div className={`
          absolute z-20 flex flex-col gap-1.5 p-1.5 ${useColorModeValue('bg-white', 'gray.800')} rounded-2xl shadow-xl border ${useColorModeValue('border-gray-100', 'whiteAlpha.100')}
          ${isMobile ? 'left-3 top-20' : 'left-6 top-24'}
        `}>
          {PAINT_OPTIONS.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setDrawAction(id)}
              className={`p-2.5 sm:p-3 rounded-xl transition-all ${drawAction === id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : `${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-50 dark:hover:bg-whiteAlpha.100`
                }`}
              title={label}
            >
              {React.cloneElement(icon as React.ReactElement, { size: isMobile ? 18 : 20 })}
            </button>
          ))}

          <div className={`h-[1px] ${useColorModeValue('bg-gray-100', 'whiteAlpha.100')} mx-2 my-1`}></div>

          <button
            onClick={onClear}
            className={`p-2.5 sm:p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all`}
            title="Clear Board"
          >
            <LuTrash2 size={isMobile ? 18 : 20} />
          </button>

          <Popover placement="right">
            <PopoverTrigger>
              <div className={`p-1 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-whiteAlpha.100 transition-all flex items-center justify-center`}>
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-inner border ${useColorModeValue('border-gray-200', 'whiteAlpha.200')}`}
                  style={{ backgroundColor: color }}
                />
              </div>
            </PopoverTrigger>
            <PopoverContent border="none" borderRadius="2xl" shadow="2xl" p={0} overflow="hidden">
              {/*@ts-ignore*/}
              <SketchPicker
                color={color}
                onChangeComplete={(selectedColor) => setColor(selectedColor.hex)}
                width={isMobile ? "180" : "220"}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Zoom Controls */}
        <div className={`
          absolute z-20 flex items-center ${useColorModeValue('bg-white', 'gray.800')} rounded-xl shadow-lg border ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} p-1 gap-1
          ${isMobile ? 'right-3 bottom-20' : 'right-6 bottom-24'}
        `}>
          <button
            onClick={() => setScale(prev => Math.min(prev * 1.2, 10))}
            className={`p-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-50 dark:hover:bg-whiteAlpha.100 rounded-lg transition-all`}
            title="Zoom In"
          >
            <LuPlus size={18} />
          </button>
          <div className={`px-2 text-xs font-bold ${useColorModeValue('text-gray-500', 'gray.300')} min-w-[45px] text-center`}>
            {Math.round(scale * 100)}%
          </div>
          <button
            onClick={() => setScale(prev => Math.max(prev / 1.2, 0.1))}
            className={`p-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-50 dark:hover:bg-whiteAlpha.100 rounded-lg transition-all`}
            title="Zoom Out"
          >
            <LuMinus size={18} />
          </button>
          <div className={`w-[1px] h-4 ${useColorModeValue('bg-gray-100', 'whiteAlpha.100')} mx-1`}></div>
          <button
            onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
            className={`p-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-50 dark:hover:bg-whiteAlpha.100 rounded-lg transition-all`}
            title="Reset Zoom"
          >
            <LuMaximize size={18} />
          </button>
        </div>

        {/* Canvas Area */}
        <div
          id="canvas-container"
          className={`flex-1 relative overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#121212]'}`}
          style={{ touchAction: 'none' }}
        >
          {/* Subtle Grid Pattern */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${theme === 'light' ? 'opacity-[0.03]' : 'opacity-[0.07]'}`}
            style={{
              backgroundImage: `radial-gradient(${theme === 'light' ? '#000' : '#fff'} 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          <Stage
            height={size.height}
            width={size.width}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            onMouseUp={onStageMouseUp}
            onMouseDown={onStageMouseDown}
            onMouseMove={onStageMouseMove}
            onTouchStart={onStageMouseDown}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            <Layer>
              <KonvaRect
                x={0}
                y={0}
                height={size.height}
                width={size.width}
                fill="transparent"
                id="bg"
                onClick={onBgClick}
                onTap={onBgClick}
              />

              {image && (
                <KonvaImage
                  image={image}
                  x={20}
                  y={20}
                  height={SIZE / 2}
                  width={SIZE / 2}
                  draggable={isDraggable}
                />
              )}

              {scribbles.map((scribble) => (
                <KonvaLine
                  key={scribble.id}
                  id={scribble.id}
                  lineCap="round"
                  lineJoin="round"
                  stroke={scribble?.color}
                  strokeWidth={4}
                  points={scribble.points}
                  onClick={onShapeClick}
                  onTap={onShapeClick}
                  draggable={isDraggable}
                />
              ))}

              {/* Remote Cursors */}
              {Object.entries(remoteCursors).map(([id, cursor]) => (
                <Group key={id} x={cursor.x} y={cursor.y}>
                  <KonvaPath
                    data="M0 0 L5 15 L8 12 L12 18 L15 15 L11 9 L15 6 Z"
                    fill={cursor.color}
                    stroke="white"
                    strokeWidth={1}
                    scaleX={0.8}
                    scaleY={0.8}
                  />
                  <Group x={12} y={15}>
                    <KonvaRect
                      fill={cursor.color}
                      cornerRadius={4}
                      height={18}
                      width={cursor.name.length * 8 + 12}
                    />
                    <KonvaText
                      text={cursor.name}
                      fill="white"
                      fontSize={11}
                      padding={4}
                      fontStyle="bold"
                    />
                  </Group>
                </Group>
              ))}

              <Transformer
                ref={transformerRef}
                anchorStroke="#3b82f6"
                anchorFill="#fff"
                anchorSize={isMobile ? 6 : 8}
                borderStroke="#3b82f6"
              />
            </Layer>
          </Stage>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileRef}
          onChange={onImportImageSelect}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
});
