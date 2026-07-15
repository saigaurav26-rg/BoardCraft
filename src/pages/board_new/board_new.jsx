import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeft, Save, Share2, Download, ChevronDown, Menu, X,
  Type, Square, Circle, MoveRight, 
  Eraser, MousePointer, ZoomIn, ZoomOut, Maximize2, Edit3, Hand, PenTool,
  Sparkles, Loader2, Bot, Undo2, Redo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SESSION_USER_ID = "user_" + Math.random().toString(36).substring(2, 9);
const SESSION_USER_NAME = "Peer " + Math.floor(Math.random() * 1000);

// Helper to determine the direction of the cursor near corner anchors
function directionCursor(handle) {
  switch (handle) {
    case "tl": case "br": return "nwse-resize";
    case "tr": case "bl": return "nesw-resize";
    case "t":  case "b":  return "ns-resize";
    case "l":  case "r":  return "ew-resize";
    default: return "default";
  }
}

export default function BoardWorkspace() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(null);
  const [boardTitle, setBoardTitle] = useState("Untitled Board");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [loading, setLoading] = useState(true);

  // Canvas Engine
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const textareaRef = useRef(null);
  const [elements, setElements] = useState([]); 
  const [tool, setTool] = useState("select"); 
  const [action, setAction] = useState("none"); // "none", "drawing", "moving", "resizing", "panning", "writing"
  const [selectedElementIdx, setSelectedElementIdx] = useState(null); 
  const [resizeHandle, setResizeHandle] = useState(null); // 'tl', 'tr', 'bl', 'br', 't', 'b', 'l', 'r'
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [newElement, setNewElement] = useState(null);

  // Layout Controls
  const [showConfigSidebar, setShowConfigSidebar] = useState(true);

  // History Matrix
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Style Matrix
  const [strokeColor, setStrokeColor] = useState("#4f46e5");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(24); 
  const [strokeStyle, setStrokeStyle] = useState("solid");

  // Viewport Tracking
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const [elementDragStart, setElementDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredElementIdx, setHoveredElementIdx] = useState(null);

  // Text Engine State
  const [textSession, setTextSession] = useState(null); 
  // Structure: { canvasX, canvasY, screenX, screenY, value, isEditingExisting: boolean, elementIndex: number | null }

  // Collaboration Engines
  const [remoteCursors, setRemoteCursors] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const channelRef = useRef(null);

  // AI Generation Engines
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  useEffect(() => {
    if (loading || !board) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [loading, board]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const { data, error } = await supabase
          .from("BoardCraft")
          .select("*")
          .eq("id", boardId)
          .single();

        if (error) throw error;
        setBoard(data);
        setBoardTitle(data.title || "Untitled Board");
        if (data.canvas_data && Array.isArray(data.canvas_data)) {
          setElements(data.canvas_data);
          setHistory([data.canvas_data]);
          setHistoryIndex(0);
        }

        const channel = supabase.channel(`board_collab_${boardId}`, {
          config: { presence: { key: SESSION_USER_ID } }
        });
        channelRef.current = channel;

        channel
          .on("broadcast", { event: "canvas-update" }, ({ payload }) => {
            if (payload && Array.isArray(payload.elements)) {
              setElements(payload.elements);
              setHistory(prev => [...prev.slice(0, historyIndex + 1), payload.elements]);
              setHistoryIndex(prev => prev + 1);
            }
          })
          .on("broadcast", { event: "cursor-move" }, ({ payload }) => {
            if (payload && payload.userId !== SESSION_USER_ID) {
              setRemoteCursors((prev) => ({
                ...prev,
                [payload.userId]: { x: payload.x, y: payload.y, name: payload.name }
              }));
            }
          })
          .on("presence", { event: "sync" }, () => {
            const newState = channel.presenceState();
            setOnlineUsers(newState);
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              await channel.track({
                userId: SESSION_USER_ID,
                name: SESSION_USER_NAME,
                onlineAt: new Date().toISOString(),
              });
            }
          });

      } catch (err) {
        console.error("Error loading workspace data:", err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (boardId) loadWorkspace();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [boardId]);

  const broadcastCanvas = (updatedElements) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "canvas-update",
        payload: { elements: updatedElements }
      });
    }
  };

  const updateHistoryAndElements = (newElements) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    setHistory([...nextHistory, newElements]);
    setHistoryIndex(nextHistory.length);
    setElements(newElements);
    broadcastCanvas(newElements);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setElements(history[prevIdx]);
      broadcastCanvas(history[prevIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setElements(history[nextIdx]);
      broadcastCanvas(history[nextIdx]);
    }
  };

  useEffect(() => {
    if (selectedElementIdx !== null && elements[selectedElementIdx] && action !== "moving" && action !== "resizing") {
      const updated = elements.map((el, idx) => {
        if (idx === selectedElementIdx) {
          return { ...el, strokeColor, backgroundColor, strokeWidth, opacity, fontSize, strokeStyle };
        }
        return el;
      });
      setElements(updated);
      broadcastCanvas(updated);
    }
  }, [strokeColor, backgroundColor, strokeWidth, opacity, fontSize, strokeStyle, selectedElementIdx]);

  const saveWorkspaceData = async () => {
    try {
      const { error } = await supabase
        .from("BoardCraft")
        .update({ canvas_data: elements, title: boardTitle })
        .eq("id", boardId);
      if (error) throw error;
      alert("Whiteboard saved successfully!");
    } catch (err) {
      console.error("Persistence save failure:", err.message);
    }
  };

  const handleAiGeneration = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);

    try {
      const currentCenterX = (-panOffset.x + (canvasRef.current?.width || 800) / 2) / zoom;
      const currentCenterY = (-panOffset.y + (canvasRef.current?.height || 600) / 2) / zoom;

      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      let parsedResponse = [];
      const promptLower = aiPrompt.toLowerCase();

      if (promptLower.includes("chart") || promptLower.includes("bar") || promptLower.includes("graph")) {
        parsedResponse = [
          { type: "line", relX1: -150, relY1: 100, relX2: 150, relY2: 100, strokeColor: "#1e293b", strokeWidth: 2, strokeStyle: "solid" },
          { type: "line", relX1: -150, relY1: -100, relX2: -150, relY2: 100, strokeColor: "#1e293b", strokeWidth: 2, strokeStyle: "solid" },
          { type: "rectangle", relX1: -120, relY1: 10, relX2: -80, relY2: 100, strokeColor: "#4f46e5", backgroundColor: "#e0e7ff", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: -115, relY1: 110, text: "Q1", strokeColor: "#64748b", fontSize: 14 },
          { type: "rectangle", relX1: -50, relY1: -40, relX2: -10, relY2: 100, strokeColor: "#7c3aed", backgroundColor: "#f3e8ff", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: -45, relY1: 110, text: "Q2", strokeColor: "#64748b", fontSize: 14 },
          { type: "rectangle", relX1: 20, relY1: -80, relX2: 60, relY2: 100, strokeColor: "#10b981", backgroundColor: "#d1fae5", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: 25, relY1: 110, text: "Q3", strokeColor: "#64748b", fontSize: 14 },
          { type: "text", relX1: -80, relY1: -140, text: "AI Generated Metrics Chart", strokeColor: "#0f172a", fontSize: 18 }
        ];
      } else if (promptLower.includes("mindmap") || promptLower.includes("mind map") || promptLower.includes("hub")) {
        parsedResponse = [
          { type: "circle", relX1: -50, relY1: -30, relX2: 50, relY2: 30, strokeColor: "#f59e0b", backgroundColor: "transparent", strokeWidth: 3 },
          { type: "text", relX1: -35, relY1: -10, text: "Core Idea", strokeColor: "#0f172a", fontSize: 16 },
          { type: "line", relX1: -50, relY1: 0, relX2: -150, relY2: -60, strokeColor: "#f59e0b", strokeWidth: 2 },
          { type: "rectangle", relX1: -230, relY1: -85, relX2: -150, relY2: -35, strokeColor: "#4f46e5", strokeWidth: 2 },
          { type: "text", relX1: -215, relY1: -70, text: "Concept A", strokeColor: "#0f172a", fontSize: 14 },
          { type: "line", relX1: 50, relY1: 0, relX2: 150, relY2: 60, strokeColor: "#f59e0b", strokeWidth: 2 },
          { type: "rectangle", relX1: 150, relY1: 35, relX2: 230, relY2: 85, strokeColor: "#7c3aed", strokeWidth: 2 },
          { type: "text", relX1: 165, relY1: 50, text: "Concept B", strokeColor: "#0f172a", fontSize: 14 }
        ];
      } else {
        parsedResponse = [
          { type: "rectangle", relX1: -100, relY1: -90, relX2: 100, relY2: -40, strokeColor: "#d946ef", backgroundColor: "transparent", strokeWidth: 2 },
          { type: "text", relX1: -75, relY1: -75, text: `Generated: ${aiPrompt.substring(0, 18)}...`, strokeColor: "#0f172a", fontSize: 14 }
        ];
      }

      const newlyConstructedVectors = parsedResponse.map((vector) => {
        const structuralBase = {
          ...vector,
          opacity: vector.opacity ?? 1,
          strokeWidth: vector.strokeWidth ?? 3,
          strokeStyle: vector.strokeStyle ?? "solid"
        };

        if (vector.type === "text") {
          structuralBase.x1 = currentCenterX + vector.relX1;
          structuralBase.y1 = currentCenterY + vector.relY1;
          structuralBase.fontSize = vector.fontSize ?? 20;
        } else {
          structuralBase.x1 = currentCenterX + vector.relX1;
          structuralBase.y1 = currentCenterY + vector.relY1;
          structuralBase.x2 = currentCenterX + vector.relX2;
          structuralBase.y2 = currentCenterY + vector.relY2;
        }

        delete structuralBase.relX1; delete structuralBase.relY1;
        delete structuralBase.relX2; delete structuralBase.relY2;
        return structuralBase;
      });

      updateHistoryAndElements([...elements, ...newlyConstructedVectors]);
      setAiPrompt("");
    } catch (err) {
      console.error("AI Node Engine Compilation Failure: ", err);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const getElementAbsoluteBounds = (el, ctx) => {
    if (el.type === "pencil" && el.points) {
      let minX = Math.min(...el.points.map(p => p[0]));
      let maxX = Math.max(...el.points.map(p => p[0]));
      let minY = Math.min(...el.points.map(p => p[1]));
      let maxY = Math.max(...el.points.map(p => p[1]));
      return { x1: minX, y1: minY, x2: maxX, y2: maxY, w: maxX - minX, h: maxY - minY };
    } else if (el.type === "text") {
      ctx.save();
      ctx.font = `bold ${el.fontSize || 24}px sans-serif`;
      const lines = (el.text || "").split("\n");
      let maxWidth = 0;
      lines.forEach(l => {
        const w = ctx.measureText(l).width;
        if (w > maxWidth) maxWidth = w;
      });
      const fontHeight = el.fontSize || 24;
      const totalHeight = lines.length * fontHeight * 1.2;
      ctx.restore();
      return { x1: el.x1, y1: el.y1, x2: el.x1 + maxWidth, y2: el.y1 + totalHeight, w: maxWidth, h: totalHeight };
    } else {
      const x1 = Math.min(el.x1, el.x2);
      const x2 = Math.max(el.x1, el.x2);
      const y1 = Math.min(el.y1, el.y2);
      const y2 = Math.max(el.y1, el.y2);
      return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1 };
    }
  };

  const getResizeHandles = (bounds) => {
    const { x1, y1, x2, y2 } = bounds;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    return {
      tl: { x: x1, y: y1 },
      t:  { x: mx, y: y1 },
      tr: { x: x2, y: y1 },
      r:  { x: x2, y: my },
      br: { x: x2, y: y2 },
      b:  { x: mx, y: y2 },
      bl: { x: x1, y: y2 },
      l:  { x: x1, y: my }
    };
  };

  const renderElementsOnContext = (ctx, targetElements, activeSelectionIdx, eraserHoverIdx) => {
    targetElements.forEach((el, idx) => {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      ctx.strokeStyle = el.strokeColor;
      ctx.fillStyle = el.strokeColor;
      ctx.lineWidth = el.strokeWidth;
      
      if (el.strokeStyle === "dashed") ctx.setLineDash([8, 8]);
      else if (el.strokeStyle === "dotted") ctx.setLineDash([3, 6]);
      else ctx.setLineDash([]);

      if (idx === activeSelectionIdx) {
        ctx.shadowColor = "#4f46e5"; ctx.shadowBlur = 8;
      } else if (tool === "eraser" && idx === eraserHoverIdx) {
        ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 12;
      }

      ctx.beginPath();

      if (el.type === "pencil" && el.points) {
        if (el.points.length > 0) {
          ctx.moveTo(el.points[0][0], el.points[0][1]);
          for (let i = 1; i < el.points.length; i++) {
            ctx.lineTo(el.points[i][0], el.points[i][1]);
          }
          ctx.stroke();
        }
      } else if (el.type === "line") {
        ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
      } else if (el.type === "rectangle") {
        ctx.fillStyle = el.backgroundColor || "transparent";
        if (el.backgroundColor && el.backgroundColor !== "transparent") {
          ctx.fillRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
        }
        ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
      } else if (el.type === "circle") {
        ctx.fillStyle = el.backgroundColor || "transparent";
        const rx = Math.abs(el.x2 - el.x1) / 2; const ry = Math.abs(el.y2 - el.y1) / 2;
        const cx = (el.x1 + el.x2) / 2; const cy = (el.y1 + el.y2) / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (el.backgroundColor && el.backgroundColor !== "transparent") ctx.fill();
        ctx.stroke();
      } else if (el.type === "arrow") {
        ctx.moveTo(el.x1, el.y1); ctx.lineTo(el.x2, el.y2); ctx.stroke();
        const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
        ctx.save(); ctx.fillStyle = el.strokeColor; ctx.beginPath(); ctx.translate(el.x2, el.y2); ctx.rotate(angle);
        ctx.moveTo(0, 0); ctx.lineTo(-15, -6); ctx.lineTo(-15, 6); ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (el.type === "text") {
        ctx.font = `bold ${el.fontSize || 24}px sans-serif`;
        ctx.textBaseline = "top";
        const lines = (el.text || "").split("\n");
        const fontHeight = el.fontSize || 24;
        lines.forEach((line, lineIdx) => {
          ctx.fillText(line, el.x1, el.y1 + lineIdx * fontHeight * 1.2);
        });
      }

      if (idx === activeSelectionIdx) {
        ctx.save();
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        
        const bounds = getElementAbsoluteBounds(el, ctx);
        ctx.strokeRect(bounds.x1 - 4, bounds.y1 - 4, bounds.w + 8, bounds.h + 8);
        
        // Draw 8 Resizing Anchors
        ctx.setLineDash([]);
        ctx.fillStyle = "#white";
        ctx.strokeStyle = "#4f46e5";
        ctx.lineWidth = 2;
        const handles = getResizeHandles(bounds);
        
        Object.values(handles).forEach((h) => {
          ctx.fillRect(h.x - 4, h.y - 4, 8, 8);
          ctx.strokeRect(h.x - 4, h.y - 4, 8, 8);
        });
        
        ctx.restore();
      }
      ctx.restore();
    });
  };

  const handleExport = (format) => {
    if (elements.length === 0) {
      alert("There are no visual elements drawn on the board to export.");
      return;
    }

    const currentCanvas = canvasRef.current;
    if (!currentCanvas) return;

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = currentCanvas.width;
    exportCanvas.height = currentCanvas.height;
    const eCtx = exportCanvas.getContext("2d");

    eCtx.fillStyle = "#f8fafc";
    exportCanvas.getContext("2d").fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    eCtx.save();
    eCtx.translate(panOffset.x, panOffset.y);
    eCtx.scale(zoom, zoom);
    renderElementsOnContext(eCtx, elements, null, null);
    eCtx.restore();

    if (format === "png") {
      const dataUrl = exportCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${boardTitle.replace(/\s+/g, "_")}_export.png`;
      link.href = dataUrl;
      link.click();
    } 
  };

  useEffect(() => {
    if (loading || !board) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Grid Layer
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    const gridSize = 30;
    const startX = Math.floor((-panOffset.x / zoom) / gridSize) * gridSize - 500;
    const endX = startX + (canvas.width / zoom) + 1000;
    const startY = Math.floor((-panOffset.y / zoom) / gridSize) * gridSize - 500;
    const endY = startY + (canvas.height / zoom) + 1000;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, startY); ctx.lineTo(x, endY); ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(endX, y); ctx.stroke();
    }

    renderElementsOnContext(ctx, elements, selectedElementIdx, hoveredElementIdx);

    if (newElement) {
      const activePreviewEl = { ...newElement, strokeColor, backgroundColor, strokeWidth, opacity, fontSize, strokeStyle };
      renderElementsOnContext(ctx, [activePreviewEl], null, null);
    }

    // Remotes
    Object.entries(remoteCursors).forEach(([userId, cursor]) => {
      ctx.save();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      const mappedX = (cursor.x - panOffset.x) / zoom;
      const mappedY = (cursor.y - panOffset.y) / zoom;
      ctx.arc(mappedX, mappedY, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = "12px sans-serif";
      ctx.fillText(cursor.name || "Peer", mappedX + 8, mappedY + 4);
      ctx.restore();
    });

    ctx.restore();
  }, [elements, newElement, panOffset, zoom, loading, board, opacity, strokeColor, backgroundColor, strokeWidth, strokeStyle, selectedElementIdx, hoveredElementIdx, tool, fontSize, remoteCursors]);

  const handleWheel = (e) => {
    e.preventDefault();
    if (textSession) return; 
    const scaleFactor = 0.05;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mX = e.clientX - rect.left;
    const mY = e.clientY - rect.top;

    const direction = e.deltaY < 0 ? 1 : -1;
    const factor = Math.exp(direction * scaleFactor);
    const nextZoom = Math.min(Math.max(0.1, zoom * factor), 4);

    setPanOffset(prev => ({
      x: mX - (mX - prev.x) * (nextZoom / zoom),
      y: mY - (mY - prev.y) * (nextZoom / zoom)
    }));
    setZoom(nextZoom);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, panOffset, textSession]);

  const fetchCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, cx: 0, cy: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    return {
      x: (cx - panOffset.x) / zoom,
      y: (cy - panOffset.y) / zoom,
      cx,
      cy
    };
  };

  const findElementAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return -1;

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      const bounds = getElementAbsoluteBounds(el, ctx);
      
      if (el.type === "pencil" && el.points) {
        const threshold = 12;
        for (let p of el.points) {
          if (Math.sqrt(Math.pow(p[0] - x, 2) + Math.pow(p[1] - y, 2)) < threshold) return i;
        }
      }

      if (x >= bounds.x1 && x <= bounds.x2 && y >= bounds.y1 && y <= bounds.y2) {
        if (el.type === "line" || el.type === "arrow") {
          const a = { x: el.x1, y: el.y1 };
          const b = { x: el.x2, y: el.y2 };
          const c = { x, y };
          const lineLength = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
          if (lineLength === 0) continue;
          const dot = (((c.x - a.x) * (b.x - a.x)) + ((c.y - a.y) * (b.y - a.y))) / Math.pow(lineLength, 2);
          const closestX = a.x + dot * (b.x - a.x);
          const closestY = a.y + dot * (b.y - a.y);
          if (dot >= 0 && dot <= 1) {
            const dist = Math.sqrt(Math.pow(closestX - x, 2) + Math.pow(closestY - y, 2));
            if (dist < 10) return i;
          }
          continue;
        }
        return i;
      }
    }
    return -1;
  };

  const getHandleAtPosition = (x, y, elIdx) => {
    if (elIdx === null) return null;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return null;

    const el = elements[elIdx];
    const bounds = getElementAbsoluteBounds(el, ctx);
    const handles = getResizeHandles(bounds);
    const hitBox = 8 / zoom;

    for (const [handleKey, pos] of Object.entries(handles)) {
      if (x >= pos.x - hitBox && x <= pos.x + hitBox && y >= pos.y - hitBox && y <= pos.y + hitBox) {
        return handleKey;
      }
    }
    return null;
  };

  const commitCurrentTextSession = () => {
    if (!textSession) return;
    
    if (textSession.isEditingExisting && textSession.elementIndex !== null) {
      if (textSession.value.trim() === "") {
        // Clear empty node
        const updated = elements.filter((_, idx) => idx !== textSession.elementIndex);
        updateHistoryAndElements(updated);
        setSelectedElementIdx(null);
      } else {
        const updated = elements.map((el, idx) => {
          if (idx === textSession.elementIndex) {
            return { ...el, text: textSession.value };
          }
          return el;
        });
        updateHistoryAndElements(updated);
      }
    } else if (textSession.value.trim() !== "") {
      const structuralTextNode = {
        type: "text",
        x1: textSession.canvasX,
        y1: textSession.canvasY,
        text: textSession.value,
        strokeColor: strokeColor,
        fontSize: fontSize,
        opacity: opacity
      };
      updateHistoryAndElements([...elements, structuralTextNode]);
    }

    setTextSession(null);
    setAction("none");
  };

  // double click trigger to turn existing textual element directly into input node frames
  const handleDoubleClick = (e) => {
    if (tool !== "select") return;
    const { x, y, cx, cy } = fetchCanvasCoordinates(e);
    const clickedIdx = findElementAtPosition(x, y);

    if (clickedIdx !== -1 && elements[clickedIdx].type === "text") {
      const targetTextEl = elements[clickedIdx];
      setAction("writing");
      setTextSession({
        canvasX: targetTextEl.x1,
        canvasY: targetTextEl.y1,
        screenX: cx,
        screenY: cy,
        value: targetTextEl.text || "",
        isEditingExisting: true,
        elementIndex: clickedIdx
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleMouseDown = (e) => {
    if (textSession) {
      commitCurrentTextSession();
      return;
    }

    const { x, y, cx, cy } = fetchCanvasCoordinates(e);

    if (tool === "pan" || isSpacePressed) {
      setAction("panning");
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - startPan.y });
      return;
    }

    if (tool === "text") {
      setAction("writing");
      setTextSession({
        canvasX: x,
        canvasY: y,
        screenX: cx,
        screenY: cy,
        value: "",
        isEditingExisting: false,
        elementIndex: null
      });
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

    if (tool === "select") {
      // Prioritize grabbing layout transformation handles
      const handle = getHandleAtPosition(x, y, selectedElementIdx);
      if (handle) {
        setAction("resizing");
        setResizeHandle(handle);
        setElementDragStart(JSON.parse(JSON.stringify(elements[selectedElementIdx])));
        setDragOffset({ x, y });
        return;
      }

      const clickedIdx = findElementAtPosition(x, y);
      if (clickedIdx !== -1) {
        setSelectedElementIdx(clickedIdx);
        setAction("moving");
        const target = elements[clickedIdx];
        
        setElementDragStart(JSON.parse(JSON.stringify(target)));
        setDragOffset({ x: x, y: y });

        setStrokeColor(target.strokeColor);
        setBackgroundColor(target.backgroundColor || "transparent");
        setStrokeWidth(target.strokeWidth);
        setOpacity(target.opacity || 1);
        if (target.fontSize) setFontSize(target.fontSize);
        if (target.strokeStyle) setStrokeStyle(target.strokeStyle);
      } else {
        setSelectedElementIdx(null);
      }
      return;
    }

    if (tool === "eraser") {
      const targetIndex = findElementAtPosition(x, y);
      if (targetIndex !== -1) {
        const updated = elements.filter((_, idx) => idx !== targetIndex);
        updateHistoryAndElements(updated);
        setHoveredElementIdx(null);
      }
      return;
    }

    setAction("drawing");
    if (tool === "pencil") {
      setNewElement({ type: "pencil", points: [[x, y]] });
    } else {
      setNewElement({ type: tool, x1: x, y1: y, x2: x, y2: y });
    }
  };

  const handleMouseMoveViewport = (e) => {
    const canvas = canvasRef.current;
    if (canvas && channelRef.current) {
      const rect = canvas.getBoundingClientRect();
      channelRef.current.send({
        type: "broadcast",
        event: "cursor-move",
        payload: {
          userId: SESSION_USER_ID,
          name: SESSION_USER_NAME,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
      });
    }

    const { x, y } = fetchCanvasCoordinates(e);

    // Adjust cursor styles dynamically when hovering selection parameters
    if (tool === "select" && action === "none" && selectedElementIdx !== null) {
      const handle = getHandleAtPosition(x, y, selectedElementIdx);
      canvas.style.cursor = handle ? directionCursor(handle) : "default";
    } else if (tool !== "select") {
      canvas.style.cursor = (isSpacePressed || tool === "pan") ? "grab" : "crosshair";
    }

    if (action === "panning") {
      setPanOffset({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    if (tool === "eraser") {
      setHoveredElementIdx(findElementAtPosition(x, y));
      return;
    }

    if (action === "moving" && selectedElementIdx !== null && elementDragStart) {
      const dx = x - dragOffset.x;
      const dy = y - dragOffset.y;

      const updated = elements.map((el, idx) => {
        if (idx !== selectedElementIdx) return el;
        if (el.type === "pencil" && elementDragStart.points) {
          return {
            ...el,
            points: elementDragStart.points.map(([px, py]) => [px + dx, py + dy])
          };
        } else {
          return {
            ...el,
            x1: elementDragStart.x1 + dx,
            y1: elementDragStart.y1 + dy,
            x2: elementDragStart.x2 + dx,
            y2: elementDragStart.y2 + dy
          };
        }
      });
      setElements(updated);
      broadcastCanvas(updated);
      return;
    }

    if (action === "resizing" && selectedElementIdx !== null && elementDragStart) {
      const dx = x - dragOffset.x;
      const dy = y - dragOffset.y;
      
      const updated = elements.map((el, idx) => {
        if (idx !== selectedElementIdx) return el;
        
        let { x1, y1, x2, y2 } = elementDragStart;
        
        if (el.type === "text") {
          // Dynamic text element structural adjustments change operational font sizing parameters
          if (resizeHandle.includes("r")) {
            const initialWidth = 100; // Reference structural index pivot
            const newWidth = Math.max(20, (x2 - x1) + dx);
            const scale = newWidth / (x2 - x1 || 1);
            return { ...el, fontSize: Math.max(10, Math.min(120, Math.round(elementDragStart.fontSize * scale))) };
          }
          if (resizeHandle.includes("b")) {
            const newHeight = Math.max(20, (y2 - y1) + dy);
            const scale = newHeight / (y2 - y1 || 1);
            return { ...el, fontSize: Math.max(10, Math.min(120, Math.round(elementDragStart.fontSize * scale))) };
          }
          return el;
        }

        // Standard structural geometry elements (Rectangles, Circles, Vectors)
        if (resizeHandle.includes("t")) y1 += dy;
        if (resizeHandle.includes("b")) y2 += dy;
        if (resizeHandle.includes("l")) x1 += dx;
        if (resizeHandle.includes("r")) x2 += dx;
        
        return { ...el, x1, y1, x2, y2 };
      });

      setElements(updated);
      broadcastCanvas(updated);
      return;
    }

    if (action === "drawing" && newElement) {
      if (tool === "pencil") {
        setNewElement(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
      } else {
        setNewElement(prev => ({ ...prev, x2: x, y2: y }));
      }
    }
  };

  const handleMouseUp = () => {
    if (action === "moving" || action === "resizing") {
      updateHistoryAndElements(elements);
    }
    if (action === "drawing" && newElement) {
      const updated = [...elements, { ...newElement, strokeColor, backgroundColor, strokeWidth, opacity, strokeStyle, fontSize }];
      updateHistoryAndElements(updated);
      setNewElement(null);
    }
    if (action !== "writing") {
      setAction("none");
      setResizeHandle(null);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Workspace sharing link copied!");
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-50/60 text-slate-800 overflow-hidden relative font-sans select-none antialiased">
      
      {/* HEADER LAYER */}
      <header className="h-16 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between z-10 shadow-sm shadow-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-500 hover:text-slate-800 h-9 w-9 hover:bg-slate-50 rounded-xl transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text" value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                className="bg-white border border-indigo-500 text-slate-800 rounded-lg px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-100" autoFocus
              />
            ) : (
              <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                <h1 className="font-bold text-sm tracking-tight text-slate-800">{boardTitle}</h1>
                <Edit3 className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            )}
          </div>
        </div>

        {/* OPERATIONS MATRIX */}
        <div className="flex items-center gap-2 ml-auto mr-4">
          <div className="flex -space-x-2 overflow-hidden mr-2">
            {Object.entries(onlineUsers).map(([presenceId, presences]) => {
              const userPresence = presences[0]; 
              if (!userPresence) return null;
              const initial = userPresence.name ? userPresence.name.charAt(0).toUpperCase() : "?";
              return (
                <div key={presenceId} className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700 shadow-sm" title={userPresence.name}>
                  {initial}
                </div>
              );
            })}
          </div>
          
          <Button variant="outline" size="sm" onClick={saveWorkspaceData} className="gap-1.5 h-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
            <Save className="h-4 w-4" /> Save
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5 h-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
            <Share2 className="h-4 w-4" /> Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-9 rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50">
                <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl p-1 shadow-md border-slate-100 min-w-[120px]">
              <DropdownMenuItem onClick={() => handleExport("png")} className="rounded-lg text-xs cursor-pointer">PNG Image</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={() => setShowConfigSidebar(!showConfigSidebar)} className={`h-9 w-9 rounded-xl ${showConfigSidebar ? "bg-slate-100 text-slate-800" : "text-slate-500"}`}>
            {showConfigSidebar ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* WORKSPACE VIEWPORT GRID */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Floating Tools Layout */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 bg-white border border-slate-200/80 shadow-md shadow-slate-100 rounded-2xl p-1.5 z-10">
          {[
            { id: "select", icon: MousePointer, label: "Select & Transform Node" },
            { id: "pan", icon: Hand, label: "Pan Architecture" },
            { id: "pencil", icon: PenTool, label: "Pencil Vector Sketch" },
            { id: "line", icon: MoveRight, label: "Solid Line Connector" },
            { id: "arrow", icon: MoveRight, label: "Link Arrow" },
            { id: "rectangle", icon: Square, label: "Block Rectangle" },
            { id: "circle", icon: Circle, label: "Round Ellipse Frame" },
            { id: "text", icon: Type, label: "Dynamic Inline Typography" },
            { id: "eraser", icon: Eraser, label: "Vector Purge Eraser" }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id} variant="ghost" size="icon" title={item.label}
                onClick={() => { setTool(item.id); setSelectedElementIdx(null); }}
                className={`h-9 w-9 rounded-xl transition-all ${tool === item.id ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Icon className="h-4 w-4" />
              </Button>
            );
          })}
          
          <div className="h-[1px] bg-slate-100 my-1" />
          <Button disabled={historyIndex === 0} onClick={handleUndo} variant="ghost" size="icon" title="Undo Mutation" className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 disabled:opacity-40">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button disabled={historyIndex === history.length - 1} onClick={handleRedo} variant="ghost" size="icon" title="Redo Mutation" className="h-9 w-9 rounded-xl text-slate-500 hover:text-slate-800 disabled:opacity-40">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Dynamic Zoom Metric Handles */}
        <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-white border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-sm shadow-slate-100 z-10 text-xs font-semibold text-slate-500">
          <button onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))} className="hover:text-slate-800"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(prev => Math.min(4, prev + 0.1))} className="hover:text-slate-800"><ZoomIn className="h-3.5 w-3.5" /></button>
          <div className="w-[1px] h-3 bg-slate-200 mx-1" />
          <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} title="Reset Grid Matrix View" className="hover:text-slate-800"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>

        {/* Display Frame Layer */}
        <div ref={containerRef} className="flex-1 h-full bg-slate-50 relative outline-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveViewport}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            className="block w-full h-full"
          />

          {/* Core Text Mutation Frame Area */}
          {textSession && (
            <textarea
              ref={textareaRef}
              value={textSession.value}
              onChange={(e) => setTextSession({ ...textSession, value: e.target.value })}
              onBlur={commitCurrentTextSession}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  commitCurrentTextSession();
                }
              }}
              style={{
                position: "absolute",
                left: `${textSession.screenX}px`,
                top: `${textSession.screenY}px`,
                font: `bold ${fontSize * zoom}px sans-serif`,
                color: strokeColor,
                opacity: opacity,
                background: "transparent",
                border: "1px dashed #4f46e5",
                outline: "none",
                margin: 0,
                padding: "2px",
                zIndex: 50,
                resize: "both",
                minWidth: "180px",
                minHeight: `${fontSize * zoom * 1.5}px`
              }}
            />
          )}
        </div>

        {/* INSPECTOR PANEL LAYOUT */}
        {showConfigSidebar && (
          <aside className="w-72 border-l border-slate-200/80 bg-white h-full z-10 flex flex-col shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Layer Settings</h2>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">
                {selectedElementIdx !== null ? `Layer #${selectedElementIdx}` : "Global Brush"}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
              
              {/* Stroke Configurations */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">Stroke Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {["#4f46e5", "#7c3aed", "#10b981", "#ef4444", "#f59e0b", "#0f172a", "#2563eb"].map((c) => (
                    <button
                      key={c} onClick={() => setStrokeColor(c)}
                      className={`h-6 w-6 rounded-full border border-black/5 transition-transform ${strokeColor === c ? "ring-2 ring-indigo-500 ring-offset-2 scale-105" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Background Configuration Architecture */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">Fill Surface</label>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setBackgroundColor("transparent")} className={`px-2 py-1 text-[11px] font-medium border rounded-md transition-all ${backgroundColor === "transparent" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                    Transparent
                  </button>
                  {["#e0e7ff", "#f3e8ff", "#d1fae5", "#fee2e2", "#fef3c7", "#f1f5f9"].map((c) => (
                    <button
                      key={c} onClick={() => setBackgroundColor(c)}
                      className={`h-6 w-6 rounded-md border border-black/5 transition-transform ${backgroundColor === c ? "ring-2 ring-indigo-500 ring-offset-1 scale-105" : "hover:scale-105"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Dimension / Opacity Track Controllers */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Stroke Weight</span>
                  <span>{strokeWidth}px</span>
                </div>
                <input type="range" min="1" max="12" step="1" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Layer Opacity</span>
                  <span>{Math.round(opacity * 100)}%</span>
                </div>
                <input type="range" min="0.1" max="1" step="0.05" value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Font Scale Dimension</span>
                  <span>{fontSize}pt</span>
                </div>
                <input type="range" min="12" max="64" step="2" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-indigo-600" />
              </div>

              {/* Stroke Styles Layout */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-600">Line Configuration</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["solid", "dashed", "dotted"].map((s) => (
                    <button
                      key={s} onClick={() => setStrokeStyle(s)}
                      className={`px-2 py-1.5 capitalize rounded-lg text-xs font-medium border transition-all ${strokeStyle === s ? "bg-indigo-600 border-indigo-600 text-white shadow-sm" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI SYSTEM MODULE ENGINE */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/70">
              <Button onClick={() => setShowAiPanel(!showAiPanel)} variant="outline" className="w-full gap-2 rounded-xl border-slate-200 h-10 shadow-sm text-slate-700 bg-white">
                <Bot className="h-4 w-4 text-indigo-600 animate-pulse" /> AI Assistant Node
              </Button>
              
              {showAiPanel && (
                <div className="mt-3 flex flex-col gap-2 transition-all">
                  <textarea
                    placeholder="Describe vectors (e.g. 'Mindmap layout sequence')..."
                    value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full text-xs font-medium p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-slate-800 placeholder-slate-400"
                    rows={3}
                  />
                  <Button onClick={handleAiGeneration} disabled={isAiGenerating || !aiPrompt.trim()} className="w-full gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs">
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Structuring Node...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Inject Prompt Vectors
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}