import { KonvaEventObject } from "konva/lib/Node";
import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect as KonvaRect,
  Image as KonvaImage,
  Line as KonvaLine,
  Circle as KonvaCircle,
  Transformer,
  Group,
  Text as KonvaText,
  Path as KonvaPath,
  Arrow as KonvaArrow,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { Scribble, Size, BoardElement, Circle, Rectangle, TextShape, Arrow } from "../components/Paint.types";
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

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  isCollapsed = false
}: {
  icon: any,
  label: string,
  active?: boolean,
  onClick?: () => void,
  isCollapsed?: boolean
}) => {
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const textColor = useColorModeValue('gray.500', 'gray.400');
  const activeTextColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Tooltip label={isCollapsed ? label : ""} placement="right" hasArrow>
      <button
        onClick={onClick}
        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-50 dark:hover:bg-whiteAlpha.50`}
        style={{
          backgroundColor: active ? activeBg : undefined,
          color: active ? activeTextColor : textColor,
          gap: isCollapsed ? '0' : '12px'
        }}
      >
        <div className={`p-1 ${active ? 'scale-110' : 'scale-100'} transition-transform`}>
          <Icon size={isCollapsed ? 22 : 20} />
        </div>
        {!isCollapsed && <span className="whitespace-nowrap overflow-hidden transition-all">{label}</span>}
      </button>
    </Tooltip>
  );
};

export const Paint: React.FC = React.memo(function Paint() {
  // State
  const [size, setSize] = useState<Size>({ width: window.innerWidth, height: window.innerHeight });
  const [color, setColor] = useState("#000");
  const [drawAction, setDrawAction] = useState<DrawAction>(DrawAction.Select);
  const [scribbles, setScribbles] = useState<BoardElement[]>([]);
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
  const { roomId } = useParams();

  const [isMobile] = useMediaQuery("(max-width: 1024px)");
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Auto-close sidebar on mobile
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const [history, setHistory] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, { x: number, y: number, name: string, color: string }>>({});
  const { colorMode, toggleColorMode } = useColorMode();
  const theme = colorMode;
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [textEditingId, setTextEditingId] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const startShapePosRef = useRef<{ x: number, y: number } | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPointRef = useRef<{ x: number, y: number } | null>(null);
  const lastCursorEmitRef = useRef<number>(0);

  // Callbacks
  const emitWhiteboardAction = useCallback((type: string, action: any) => {
    socket.emit('whiteboardAction', { roomId, type, action });
  }, [roomId]);

  const addToHistory = useCallback((action: any) => {
    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, currentStep + 1);
      return [...newHistory, action];
    });
    setCurrentStep(prevStep => prevStep + 1);
  }, [currentStep]);

  const onClear = useCallback(() => {
    const selectedNodes = transformerRef.current?.nodes();
    if (selectedNodes && selectedNodes.length > 0) {
      const idsToRemove = selectedNodes.map((node: any) => node.id());
      setScribbles(prev => {
        const newState = prev.filter(s => !idsToRemove.includes(s.id));
        addToHistory({ scribbles: newState, image });
        return newState;
      });
      idsToRemove.forEach((id: string) => {
        emitWhiteboardAction('update', { id, remove: true });
      });
      transformerRef.current.nodes([]);
      toast({ title: "Selected shapes deleted", status: "info", duration: 2000 });
    } else {
      setScribbles([]);
      setImage(undefined);
      emitWhiteboardAction('clear', {});
      addToHistory({ scribbles: [], image: undefined });
      toast({ title: "Board cleared", status: "info", duration: 2000 });
    }
  }, [emitWhiteboardAction, addToHistory, image, toast]);

  const applyState = useCallback((state: any) => {
    setScribbles(state.scribbles || []);
    setImage(state.image);
  }, []);

  const undo = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      const prevState = history[prevStep];
      setCurrentStep(prevStep);
      applyState(prevState);
      emitWhiteboardAction('undo', { step: prevStep });
    }
  }, [currentStep, history, applyState, emitWhiteboardAction]);

  const redo = useCallback(() => {
    if (currentStep < history.length - 1) {
      const nextStep = currentStep + 1;
      const nextState = history[nextStep];
      setCurrentStep(nextStep);
      applyState(nextState);
      emitWhiteboardAction('redo', { step: nextStep });
    }
  }, [currentStep, history, applyState, emitWhiteboardAction]);

  const handleTextEdit = (e: KonvaEventObject<any> | null, id: string, text: string, textColor: string, x: number, y: number, fontSize: number = 20) => {
    const stage = stageRef.current;
    if (!stage) return;
    setTextEditingId(id);
    let areaPosition = { x: 0, y: 0 };
    if (e && e.target) {
      const textNode = e.target as any;
      const pos = textNode.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      areaPosition = { x: stageBox.left + pos.x * scale + position.x, y: stageBox.top + pos.y * scale + position.y };
    } else {
      const stageBox = stage.container().getBoundingClientRect();
      areaPosition = { x: stageBox.left + x * scale + position.x, y: stageBox.top + y * scale + position.y };
    }
    if (textAreaRef.current) {
      const area = textAreaRef.current;
      area.value = text;
      area.style.top = `${areaPosition.y}px`;
      area.style.left = `${areaPosition.x}px`;
      area.style.width = "200px";
      area.style.fontSize = `${fontSize * scale}px`;
      area.style.color = textColor;
      area.style.background = theme === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,30,30,0.95)';
      area.style.border = '2px solid #3b82f6';
      area.style.borderRadius = '6px';
      area.style.padding = '8px';
      setTimeout(() => { area.focus(); area.select(); }, 10);
    }
  };

  const handleTextBlur = () => {
    if (textEditingId && textAreaRef.current) {
      const text = textAreaRef.current.value.trim();
      if (text === '' || text === 'Click to edit') {
        setScribbles(prev => prev.filter(item => item.id !== textEditingId));
        emitWhiteboardAction('update', { id: textEditingId, remove: true });
      } else {
        setScribbles(prev => prev.map(item => item.id === textEditingId ? { ...item, text: text } as TextShape : item));
        emitWhiteboardAction('update', { id: textEditingId, text });
      }
      setTextEditingId(null);
    }
  };

  const saveDrawing = async () => {
    if (!user) return;
    try {
      const token = await getIdToken();
      const thumbnail = stageRef?.current?.toDataURL();
      await axios.post(`${BACKEND_URL}/drawings/save`, { roomId, elements: scribbles, name: boardName, thumbnail }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: "Board Saved", status: "success", duration: 2000 });
    } catch (error: any) {
      toast({ title: "Save Failed", status: "error", duration: 3000 });
    }
  };

  const onImportImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const imageUrl = URL.createObjectURL(e.target.files?.[0]);
      const img = new Image(SIZE / 2, SIZE / 2);
      img.src = imageUrl;
      setImage(img);
    }
    e.target.files = null;
  }, []);

  const handleWhiteboardAction = useCallback((action: any) => {
    switch (action.type) {
      case DrawAction.Scribble:
      case DrawAction.Rectangle:
      case DrawAction.Circle:
      case DrawAction.Arrow:
      case DrawAction.Text:
        setScribbles((prevScribbles) => {
          const existingScribbleIndex = prevScribbles.findIndex(s => s.id === action.action.id);
          if (existingScribbleIndex !== -1) {
            const updatedScribbles = [...prevScribbles];
            const existing = updatedScribbles[existingScribbleIndex];
            if ((action.type === DrawAction.Scribble || action.type === 'scribble') && 'points' in action.action) {
              updatedScribbles[existingScribbleIndex] = { ...existing, points: [...(existing as Scribble).points, ...action.action.points] } as Scribble;
            } else {
              updatedScribbles[existingScribbleIndex] = { ...existing, ...action.action };
            }
            return updatedScribbles;
          }
          const newShape = { ...action.action, type: action.action.type || action.type };
          return [...prevScribbles, newShape];
        });
        break;
      case 'update':
        if (action.action.remove) { setScribbles((prev) => prev.filter(s => s.id !== action.action.id)); }
        else { setScribbles((prev) => prev.map(s => s.id === action.action.id ? { ...s, ...action.action } : s)); }
        break;
      case 'clear':
        setScribbles([]); setImage(undefined);
        break;
      case 'undo':
      case 'redo':
        setCurrentStep(action.action.step);
        applyState(history[action.action.step]);
        break;
    }
  }, [applyState, history]);

  // Effects
  useEffect(() => {
    if (!roomId) return;
    const onConnect = () => socket.emit('joinRoom', { roomId, user });
    if (socket.connected) onConnect();
    socket.on('connect', onConnect);
    socket.on('roomState', ({ users, elements }) => {
      setActiveUsers(users.filter((u: any) => u.id !== socket.id));
      if (elements && elements.length > 0) setScribbles(elements);
    });
    socket.on('usersUpdated', (users) => setActiveUsers(users.filter((u: any) => u.id !== socket.id)));
    socket.on('cursorMoved', ({ userId, x, y }) => setRemoteCursors(prev => ({ ...prev, [userId]: { ...prev[userId], x, y } })));
    socket.on('whiteboardAction', handleWhiteboardAction);
    return () => {
      socket.off('connect', onConnect);
      socket.off('roomState');
      socket.off('usersUpdated');
      socket.off('cursorMoved');
      socket.off('whiteboardAction', handleWhiteboardAction);
    };
  }, [roomId, user, handleWhiteboardAction]);

  useEffect(() => {
    const fetchDrawing = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/drawings/room/${roomId}`);
        if (response.data) {
          setScribbles(response.data.elements || []);
          setBoardName(response.data.name || "Untitled Board");
        }
      } catch (error: any) { }
    };
    if (roomId) fetchDrawing();
  }, [roomId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !textEditingId && !isSpacePressed) { e.preventDefault(); setIsSpacePressed(true); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !textEditingId) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        const selectedNodes = transformerRef.current?.nodes();
        if (selectedNodes && selectedNodes.length > 0) {
          const idsToRemove = selectedNodes.map((node: any) => node.id());
          setScribbles(prev => {
            const newState = prev.filter(s => !idsToRemove.includes(s.id));
            addToHistory({ scribbles: newState, image });
            return newState;
          });
          idsToRemove.forEach((id: string) => emitWhiteboardAction('update', { id, remove: true }));
          transformerRef.current.nodes([]);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setIsSpacePressed(false); setIsPanning(false); lastPanPointRef.current = null; }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [textEditingId, isSpacePressed, image, addToHistory, emitWhiteboardAction]);

  useEffect(() => {
    const newCursors: any = {};
    activeUsers.forEach(u => {
      newCursors[u.id] = { x: remoteCursors[u.id]?.x || 0, y: remoteCursors[u.id]?.y || 0, name: u.name, color: u.color };
    });
    setRemoteCursors(newCursors);
  }, [activeUsers]);

  const onStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef?.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const isMiddleButton = 'button' in e.evt && (e.evt as any).button === 1;
    if (isSpacePressed || isMiddleButton) {
      setIsPanning(true);
      lastPanPointRef.current = { x: pos.x, y: pos.y };
      return;
    }
    if (drawAction === DrawAction.Select) return;
    const clickedOnShape = e.target !== e.target.getStage() && e.target.id() !== 'bg';
    if (clickedOnShape && drawAction !== DrawAction.Text) return;
    const oldScale = stage.scaleX();
    const x = (pos.x - stage.x()) / oldScale;
    const y = (pos.y - stage.y()) / oldScale;
    const id = uuidv4();
    currentShapeRef.current = id;
    startShapePosRef.current = { x, y };
    isPaintRef.current = true;
    let newAction: any = { id, x, y, color, type: drawAction };
    if (drawAction === DrawAction.Scribble) { newAction.x = 0; newAction.y = 0; newAction.points = [x, y]; newAction.type = 'freedraw'; }
    else if (drawAction === DrawAction.Rectangle) { newAction.width = 0; newAction.height = 0; newAction.type = 'rectangle'; }
    else if (drawAction === DrawAction.Circle) { newAction.radius = 0; newAction.type = 'circle'; }
    else if (drawAction === DrawAction.Arrow) { newAction.points = [x, y, x, y]; newAction.type = 'arrow'; }
    else if (drawAction === DrawAction.Text) {
      newAction.text = "Click to edit"; newAction.fontSize = 20; newAction.type = 'text';
      setScribbles((prev) => [...prev, newAction as BoardElement]);
      emitWhiteboardAction(drawAction, newAction);
      setTimeout(() => handleTextEdit(null, id, "Click to edit", color, x, y, 20), 50);
      isPaintRef.current = false; currentShapeRef.current = undefined; startShapePosRef.current = null;
      return;
    }
    setScribbles((prev) => [...prev, newAction as BoardElement]);
    emitWhiteboardAction(drawAction, newAction);
  }, [drawAction, color, emitWhiteboardAction, isSpacePressed, scale, position, theme]);

  const onStageMouseMove = useCallback((_e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const stage = stageRef?.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    if (isPanning && lastPanPointRef.current) {
      const dx = pos.x - lastPanPointRef.current.x;
      const dy = pos.y - lastPanPointRef.current.y;
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPointRef.current = { x: pos.x, y: pos.y };
      return;
    }
    const oldScale = stage.scaleX();
    const x = (pos.x - stage.x()) / oldScale;
    const y = (pos.y - stage.y()) / oldScale;
    const now = Date.now();
    if (now - lastCursorEmitRef.current > 50) { socket.emit('cursorMove', { roomId, x, y }); lastCursorEmitRef.current = now; }
    if (drawAction === DrawAction.Select || !isPaintRef.current) return;
    const id = currentShapeRef.current;
    const startPos = startShapePosRef.current;
    if (!id || !startPos) return;
    let updatedShape: any = null;
    if (drawAction === DrawAction.Scribble) {
      setScribbles((prev) => prev.map((s) => s.id === id ? { ...s, points: [...(s as Scribble).points, x, y] } as Scribble : s));
      updatedShape = { id, points: [x, y], type: DrawAction.Scribble };
    } else if (drawAction === DrawAction.Rectangle) {
      const w = x - startPos.x; const h = y - startPos.y;
      setScribbles(prev => prev.map(s => s.id === id ? { ...s, width: w, height: h } as Rectangle : s));
      updatedShape = { id, width: w, height: h, type: DrawAction.Rectangle };
    } else if (drawAction === DrawAction.Circle) {
      const r = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      setScribbles(prev => prev.map(s => s.id === id ? { ...s, radius: r } as Circle : s));
      updatedShape = { id, radius: r, type: DrawAction.Circle };
    } else if (drawAction === DrawAction.Arrow) {
      setScribbles(prev => prev.map(s => s.id === id ? { ...s, points: [startPos.x, startPos.y, x, y] } as Arrow : s));
      updatedShape = { id, points: [startPos.x, startPos.y, x, y], type: DrawAction.Arrow };
    }
    if (updatedShape) emitWhiteboardAction(drawAction, updatedShape);
  }, [drawAction, emitWhiteboardAction, roomId, isPanning, textEditingId]);

  const onTransformEnd = useCallback((e: KonvaEventObject<Event>) => {
    const node = e.target;
    // transformer is changing scale, rotation and position
    const id = node.id();

    const props = {
      x: node.x(),
      y: node.y(),
      scaleX: node.scaleX(),
      scaleY: node.scaleY(),
      rotation: node.rotation(),
    };

    setScribbles(prev => prev.map(s => s.id === id ? { ...s, ...props } : s));
    emitWhiteboardAction('update', { id, ...props });
  }, [emitWhiteboardAction]);

  const onExportClick = useCallback(() => {
    const dataUri = stageRef?.current?.toDataURL({ pixelRatio: 3 });
    downloadURI(dataUri, "boardify-export.png");
  }, []);

  const onStageMouseUp = useCallback(() => {
    // Stop panning
    if (isPanning) {
      setIsPanning(false);
      lastPanPointRef.current = null;
      return;
    }

    isPaintRef.current = false;
    startShapePosRef.current = null;
    currentShapeRef.current = undefined;
    // We update history only after mouse up to keep it clean
    // Need to use functional setHistory to avoid stale scribbles or we can use another state/ref
    setScribbles(curr => {
      addToHistory({ scribbles: curr, image });
      return curr;
    });
  }, [image, addToHistory, isPanning]);

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
      {/* Sidebar Overlay (Mobile) */}
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

      {/* Main Sidebar */}
      <aside className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-[50]' : 'relative h-full'} 
        ${isSidebarOpen ? (isMobile ? 'w-64' : 'w-64') : (isMobile ? 'w-0' : 'w-20')}
        border-r ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} 
        flex flex-col p-3 ${useColorModeValue('bg-white', '#0f172a')} 
        transition-all duration-300 ease-in-out overflow-hidden
        ${isMobile && !isSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        <div className={`flex items-center ${!isSidebarOpen && !isMobile ? 'justify-center' : 'justify-between'} gap-2 px-2 mb-8 mt-1`}>
          <div className="flex items-center gap-3 cursor-pointer overflow-hidden" onClick={() => navigate("/dashboard")}>
            <div className="shrink-0 w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <LuLayoutDashboard size={22} />
            </div>
            {(isSidebarOpen || isMobile) && (
              <span className={`font-bold text-xl ${useColorModeValue('text-gray-900', 'white')} transition-all`}>Boardify</span>
            )}
          </div>
          {isMobile && isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
              <LuX size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 mb-6">
          <SidebarItem icon={LuLayout} label="Dashboard" active={false} onClick={() => navigate("/dashboard")} isCollapsed={!isSidebarOpen && !isMobile} />
          <SidebarItem icon={LuUsers} label="Collaborators" isCollapsed={!isSidebarOpen && !isMobile} />
          <SidebarItem icon={LuClock} label="History" isCollapsed={!isSidebarOpen && !isMobile} />
        </div>

        <div className={`h-[1px] ${useColorModeValue('bg-gray-100', 'whiteAlpha.100')} mx-2 mb-6`}></div>

        {/* Workspace Tools */}
        {(isSidebarOpen || isMobile) && (
          <ChakraText fontSize="2xs" fontWeight="bold" color="gray.400" px={4} mb={3} textTransform="uppercase" letterSpacing="widest">
            Workbench
          </ChakraText>
        )}

        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto no-scrollbar">
          {PAINT_OPTIONS.map(({ id, icon, label }) => (
            <SidebarItem
              key={id}
              icon={() => icon}
              label={label}
              active={drawAction === id}
              onClick={() => setDrawAction(id as DrawAction)}
              isCollapsed={!isSidebarOpen && !isMobile}
            />
          ))}

          <div className={`h-[1px] ${useColorModeValue('bg-gray-100', 'whiteAlpha.100')} mx-2 my-2`}></div>

          {/* Color Picker Sidebar Integrated */}
          <div className={`px-1.5 ${!isSidebarOpen && !isMobile ? 'flex justify-center' : ''}`}>
            <Popover placement="right">
              <PopoverTrigger>
                <button className={`w-full group flex items-center ${!isSidebarOpen && !isMobile ? 'justify-center' : 'px-3'} py-2 rounded-xl transition-all hover:bg-gray-50 dark:hover:bg-whiteAlpha.50`}>
                  <div
                    className="w-7 h-7 rounded-lg border shadow-sm shrink-0 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                  {(isSidebarOpen || isMobile) && (
                    <span className="ml-3 text-sm font-medium text-gray-500 dark:text-gray-400">Appearance</span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent border="none" borderRadius="2xl" shadow="2xl" p={0} overflow="hidden">
                {/*@ts-ignore*/}
                <SketchPicker
                  color={color}
                  onChangeComplete={(selectedColor) => setColor(selectedColor.hex)}
                  width="220"
                />
              </PopoverContent>
            </Popover>
          </div>

          <SidebarItem
            icon={LuTrash2}
            label="Delete / Clear"
            onClick={onClear}
            isCollapsed={!isSidebarOpen && !isMobile}
          />
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
          <SidebarItem icon={LuSettings} label="Settings" isCollapsed={!isSidebarOpen && !isMobile} />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 w-full relative h-full ${useColorModeValue('bg-white', '#0f172a')}`}>
        {/* Top Header */}
        <header className={`h-16 border-b ${useColorModeValue('border-gray-100', 'whiteAlpha.100')} ${useColorModeValue('bg-white', '#0f172a')} flex items-center justify-between px-4 sm:px-6 z-10 shrink-0 transition-colors`}>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 -ml-2 ${useColorModeValue('text-gray-500', 'gray.400')} hover:bg-gray-100 rounded-lg`}
              title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              <LuMenu size={24} />
            </button>
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

        {/* Pan Mode Indicator */}
        {isSpacePressed && (
          <div className={`
            absolute z-20 flex items-center gap-2 ${useColorModeValue('bg-blue-50', 'blue.900')} text-blue-600 dark:text-blue-200 rounded-xl shadow-lg border border-blue-200 dark:border-blue-700 px-4 py-2
            ${isMobile ? 'left-3 bottom-3' : 'left-6 bottom-6'}
          `}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-sm font-medium">Pan Mode Active - Click and drag to move canvas</span>
          </div>
        )}

        {/* Mobile Floating Toolbar */}
        {isMobile && !isSidebarOpen && (
          <motion.div
            initial={{ y: 100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            className={`
              fixed bottom-6 left-1/2 z-30 flex items-center 
              ${useColorModeValue('bg-white/90', '#1e293b/90')} 
              backdrop-blur-md rounded-2xl shadow-2xl border 
              ${useColorModeValue('border-gray-200', 'whiteAlpha.200')} 
              p-1.5 gap-0.5
            `}
          >
            {PAINT_OPTIONS.map(({ id, icon, label }) => (
              <Tooltip key={id} label={label} placement="top">
                <button
                  onClick={() => setDrawAction(id as DrawAction)}
                  className={`
                    p-3 rounded-xl transition-all duration-200
                    ${drawAction === id
                      ? (useColorModeValue('bg-blue-50 text-blue-600', 'bg-blue-900/40 text-blue-400'))
                      : (useColorModeValue('text-gray-500 hover:bg-gray-100', 'text-gray-400 hover:bg-whiteAlpha.100'))}
                  `}
                >
                  {icon}
                </button>
              </Tooltip>
            ))}

            <div className={`w-[1px] h-6 ${useColorModeValue('bg-gray-200', 'whiteAlpha.200')} mx-1`} />

            <Popover placement="top">
              <PopoverTrigger>
                <button className={`p-1.5 rounded-xl ${useColorModeValue('hover:bg-gray-100', 'hover:bg-whiteAlpha.100')} transition-all`}>
                  <div
                    className="w-8 h-8 rounded-lg border-2 shadow-sm border-white dark:border-gray-700"
                    style={{ backgroundColor: color }}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent border="none" borderRadius="2xl" shadow="2xl" p={0} overflow="hidden">
                {/*@ts-ignore*/}
                <SketchPicker color={color} onChangeComplete={(c) => setColor(c.hex)} width="200" />
              </PopoverContent>
            </Popover>

            <div className={`w-[1px] h-6 ${useColorModeValue('bg-gray-200', 'whiteAlpha.200')} mx-1`} />

            <Tooltip label="Delete / Clear" placement="top">
              <button
                onClick={onClear}
                className={`p-3 rounded-xl ${useColorModeValue('text-gray-500 hover:bg-red-50 hover:text-red-600', 'text-gray-400 hover:bg-red-900/20 hover:text-red-400')} transition-all`}
              >
                <LuTrash2 size={20} />
              </button>
            </Tooltip>
          </motion.div>
        )}

        {/* Canvas Area */}
        <div
          id="canvas-container"
          className={`flex-1 relative overflow-hidden transition-colors duration-300 ${theme === 'light' ? 'bg-gray-50' : 'bg-[#121212]'}`}
          style={{
            touchAction: 'none',
            cursor: isSpacePressed || isPanning ? 'grab' : 'default'
          }}
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
                id="bg"
                x={0}
                y={0}
                height={size.height}
                width={size.width}
                fill="transparent"
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

              {scribbles.map((scribble) => {
                const type = scribble.type || ((scribble as any).points ? 'freedraw' : '');

                switch (type) {
                  case 'freedraw':
                  case 'scribble':
                    return (
                      <KonvaLine
                        key={scribble.id}
                        id={scribble.id}
                        lineCap="round"
                        lineJoin="round"
                        stroke={scribble?.color}
                        strokeWidth={4}
                        points={(scribble as Scribble).points}
                        rotation={scribble.rotation || 0}
                        scaleX={scribble.scaleX || 1}
                        scaleY={scribble.scaleY || 1}
                        x={scribble.x || 0}
                        y={scribble.y || 0}
                        onClick={onShapeClick}
                        onTap={onShapeClick}
                        draggable={isDraggable}
                        onTransformEnd={onTransformEnd}
                        onDragEnd={onTransformEnd}
                      />
                    );
                  case 'rectangle':
                    const rect = scribble as Rectangle;
                    return (
                      <KonvaRect
                        key={rect.id}
                        id={rect.id}
                        x={rect.x}
                        y={rect.y}
                        width={rect.width}
                        height={rect.height}
                        rotation={rect.rotation || 0}
                        scaleX={rect.scaleX || 1}
                        scaleY={rect.scaleY || 1}
                        stroke={rect.color}
                        strokeWidth={2}
                        onClick={onShapeClick}
                        onTap={onShapeClick}
                        draggable={isDraggable}
                        onTransformEnd={onTransformEnd}
                        onDragEnd={onTransformEnd}
                      />
                    );
                  case 'circle':
                    const circle = scribble as Circle;
                    return (
                      <KonvaCircle
                        key={circle.id}
                        id={circle.id}
                        x={circle.x}
                        y={circle.y}
                        radius={circle.radius}
                        rotation={circle.rotation || 0}
                        scaleX={circle.scaleX || 1}
                        scaleY={circle.scaleY || 1}
                        stroke={circle.color}
                        strokeWidth={2}
                        onClick={onShapeClick}
                        onTap={onShapeClick}
                        draggable={isDraggable}
                        onTransformEnd={onTransformEnd}
                        onDragEnd={onTransformEnd}
                      />
                    );
                  case 'arrow':
                    const arrow = scribble as Arrow;
                    return (
                      <KonvaArrow
                        key={arrow.id}
                        id={arrow.id}
                        points={arrow.points}
                        stroke={arrow.color}
                        fill={arrow.color}
                        strokeWidth={4}
                        rotation={arrow.rotation || 0}
                        scaleX={arrow.scaleX || 1}
                        scaleY={arrow.scaleY || 1}
                        onClick={onShapeClick}
                        onTap={onShapeClick}
                        draggable={isDraggable}
                        onTransformEnd={onTransformEnd}
                        onDragEnd={onTransformEnd}
                      />
                    );
                  case 'text':
                    const textShape = scribble as TextShape;
                    return (
                      <KonvaText
                        key={textShape.id}
                        id={textShape.id}
                        x={textShape.x}
                        y={textShape.y}
                        text={textShape.text}
                        fontSize={textShape.fontSize}
                        rotation={textShape.rotation || 0}
                        scaleX={textShape.scaleX || 1}
                        scaleY={textShape.scaleY || 1}
                        fill={textShape.color}
                        onClick={onShapeClick}
                        onTap={onShapeClick}
                        onDblClick={(e) => handleTextEdit(e, textShape.id, textShape.text, textShape.color, textShape.x, textShape.y, textShape.fontSize)}
                        onDblTap={(e) => handleTextEdit(e, textShape.id, textShape.text, textShape.color, textShape.x, textShape.y, textShape.fontSize)}
                        draggable={isDraggable}
                        onTransformEnd={onTransformEnd}
                        onDragEnd={onTransformEnd}
                      />
                    );
                  default:
                    return null;
                }
              })}

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
        <textarea
          ref={textAreaRef}
          style={{
            display: textEditingId ? 'block' : 'none',
            position: 'fixed',
            zIndex: 9999,
            margin: 0,
            padding: '8px',
            background: 'transparent',
            resize: 'none',
            outline: 'none',
            overflow: 'auto',
            minHeight: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
          onBlur={handleTextBlur}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              textAreaRef.current?.blur();
            }
            // Allow Enter for new lines, Shift+Enter also works
          }}
        />
      </div>
    </div>
  );
});
