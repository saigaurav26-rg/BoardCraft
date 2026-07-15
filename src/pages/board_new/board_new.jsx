import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { 
  ArrowLeft, Save, Share2, Download, ChevronDown,
  Type, Square, Circle, MoveRight, 
  Eraser, Trash2, ZoomIn, ZoomOut, Maximize2, MousePointer, Edit3, Hand, PenTool, HelpCircle,
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
  const [elements, setElements] = useState([]); 
  const [tool, setTool] = useState("select"); 
  const [action, setAction] = useState("none"); 
  const [selectedElementIdx, setSelectedElementIdx] = useState(null); 
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Undo / Redo History Matrix
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Style Matrix
  const [strokeColor, setStrokeColor] = useState("#6366f1");
  const [backgroundColor, setBackgroundColor] = useState("transparent");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [opacity, setOpacity] = useState(1);
  const [fontSize, setFontSize] = useState(24); 
  const [strokeStyle, setStrokeStyle] = useState("solid");

  // Viewport Tracking
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  const [elementDragStart, setElementDragStart] = useState({ x1: 0, y1: 0, points: [] });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredElementIdx, setHoveredElementIdx] = useState(null);

  const [textInput, setTextInput] = useState(null); 
  const [newElement, setNewElement] = useState(null);

  // Use a ref to always have the absolute latest text value inside async/event listener contexts
  const textInputRef = useRef(null);
  useEffect(() => {
    textInputRef.current = textInput;
  }, [textInput]);

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
    if (selectedElementIdx !== null && elements[selectedElementIdx]) {
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
          { type: "line", relX1: -150, relY1: 100, relX2: 150, relY2: 100, strokeColor: "#ffffff", strokeWidth: 2, strokeStyle: "solid" },
          { type: "line", relX1: -150, relY1: -100, relX2: -150, relY2: 100, strokeColor: "#ffffff", strokeWidth: 2, strokeStyle: "solid" },
          { type: "rectangle", relX1: -120, relY1: 10, relX2: -80, relY2: 100, strokeColor: "#6366f1", backgroundColor: "#1e1b4b", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: -115, relY1: 110, text: "Q1", strokeColor: "#94a3b8", fontSize: 14 },
          { type: "rectangle", relX1: -50, relY1: -40, relX2: -10, relY2: 100, strokeColor: "#ec4899", backgroundColor: "#311042", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: -45, relY1: 110, text: "Q2", strokeColor: "#94a3b8", fontSize: 14 },
          { type: "rectangle", relX1: 20, relY1: -80, relX2: 60, relY2: 100, strokeColor: "#10b981", backgroundColor: "#062f28", strokeWidth: 2, strokeStyle: "solid" },
          { type: "text", relX1: 25, relY1: 110, text: "Q3", strokeColor: "#94a3b8", fontSize: 14 },
          { type: "text", relX1: -80, relY1: -140, text: "AI Generated Metrics Chart", strokeColor: "#ffffff", fontSize: 18 }
        ];
      } else if (promptLower.includes("mindmap") || promptLower.includes("mind map") || promptLower.includes("hub")) {
        parsedResponse = [
          { type: "circle", relX1: -50, relY1: -30, relX2: 50, relY2: 30, strokeColor: "#f59e0b", backgroundColor: "transparent", strokeWidth: 3 },
          { type: "text", relX1: -35, relY1: -10, text: "Core Idea", strokeColor: "#ffffff", fontSize: 16 },
          { type: "line", relX1: -50, relY1: 0, relX2: -150, relY2: -60, strokeColor: "#f59e0b", strokeWidth: 2 },
          { type: "rectangle", relX1: -230, relY1: -85, relX2: -150, relY2: -35, strokeColor: "#6366f1", strokeWidth: 2 },
          { type: "text", relX1: -215, relY1: -70, text: "Concept A", strokeColor: "#ffffff", fontSize: 14 },
          { type: "line", relX1: 50, relY1: 0, relX2: 150, relY2: 60, strokeColor: "#f59e0b", strokeWidth: 2 },
          { type: "rectangle", relX1: 150, relY1: 35, relX2: 230, relY2: 85, strokeColor: "#ec4899", strokeWidth: 2 },
          { type: "text", relX1: 165, relY1: 50, text: "Concept B", strokeColor: "#ffffff", fontSize: 14 }
        ];
      } else if (promptLower.includes("flow") || promptLower.includes("graph") || promptLower.includes("sequence")) {
        parsedResponse = [
          { type: "rectangle", relX1: -200, relY1: -30, relX2: -80, relY2: 30, strokeColor: "#10b981", backgroundColor: "#062f28", strokeWidth: 2 },
          { type: "text", relX1: -180, relY1: -10, text: "Trigger Event", strokeColor: "#ffffff", fontSize: 15 },
          { type: "arrow", relX1: -80, relY1: 0, relX2: 0, relY2: 0, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "diamond", relX1: 0, relY1: -40, relX2: 100, relY2: 40, strokeColor: "#f59e0b", strokeWidth: 2 },
          { type: "text", relX1: 25, relY1: -10, text: "Verify?", strokeColor: "#ffffff", fontSize: 14 },
          { type: "arrow", relX1: 100, relY1: 0, relX2: 180, relY2: 0, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "rectangle", relX1: 180, relY1: -30, relX2: 300, relY2: 30, strokeColor: "#6366f1", backgroundColor: "#1e1b4b", strokeWidth: 2 },
          { type: "text", relX1: 205, relY1: -10, text: "Success Opt", strokeColor: "#ffffff", fontSize: 15 }
        ];
      } else {
        parsedResponse = [
          { type: "rectangle", relX1: -100, relY1: -90, relX2: 100, relY2: -40, strokeColor: "#a855f7", backgroundColor: "transparent", strokeWidth: 2 },
          { type: "text", relX1: -75, relY1: -75, text: `Generated: ${aiPrompt.substring(0, 18)}...`, strokeColor: "#ffffff", fontSize: 14 },
          { type: "circle", relX1: -40, relY1: 0, relX2: 40, relY2: 80, strokeColor: "#6366f1", strokeWidth: 2 }
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

  const renderElementsOnContext = (ctx, targetElements, activeSelectionIdx, eraserHoverIdx) => {
    targetElements.forEach((el, idx) => {
      ctx.save();
      ctx.globalAlpha = el.opacity ?? 1;
      ctx.strokeStyle = el.strokeColor;
      ctx.fillStyle = el.backgroundColor || "transparent";
      ctx.lineWidth = el.strokeWidth;
      
      if (el.strokeStyle === "dashed") ctx.setLineDash([8, 8]);
      else if (el.strokeStyle === "dotted") ctx.setLineDash([3, 6]);
      else ctx.setLineDash([]);

      if (idx === activeSelectionIdx) {
        ctx.shadowColor = "#6366f1"; ctx.shadowBlur = 12;
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
        if (el.backgroundColor && el.backgroundColor !== "transparent") {
          ctx.fillRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
        }
        ctx.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
      } else if (el.type === "diamond") {
        const cx = (el.x1 + el.x2) / 2; const cy = (el.y1 + el.y2) / 2;
        ctx.moveTo(cx, el.y1); ctx.lineTo(el.x2, cy); ctx.lineTo(cx, el.y2); ctx.lineTo(el.x1, cy);
        ctx.closePath();
        if (el.backgroundColor && el.backgroundColor !== "transparent") ctx.fill();
        ctx.stroke();
      } else if (el.type === "circle") {
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
        ctx.fillStyle = el.strokeColor;
        ctx.textBaseline = "top";
        ctx.fillText(el.text, el.x1, el.y1);
      }

      if (idx === activeSelectionIdx) {
        ctx.save();
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        if (el.type === "pencil" && el.points) {
          let minX = Math.min(...el.points.map(p => p[0]));
          let maxX = Math.max(...el.points.map(p => p[0]));
          let minY = Math.min(...el.points.map(p => p[1]));
          let maxY = Math.max(...el.points.map(p => p[1]));
          ctx.strokeRect(minX - 6, minY - 6, (maxX - minX) + 12, (maxY - minY) + 12);
        } else if (el.type === "text") {
          ctx.font = `bold ${el.fontSize || 24}px sans-serif`;
          const textWidth = ctx.measureText(el.text).width;
          ctx.strokeRect(el.x1 - 4, el.y1 - 4, textWidth + 8, (el.fontSize || 24) + 8);
        } else {
          const x = Math.min(el.x1, el.x2);
          const y = Math.min(el.y1, el.y2);
          const w = Math.abs(el.x2 - el.x1);
          const h = Math.abs(el.y2 - el.y1);
          ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
        }
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

    eCtx.fillStyle = "#020617";
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    eCtx.strokeStyle = "#1e293b";
    eCtx.lineWidth = 0.5;
    const gridSize = 30;
    const startX = Math.floor((-panOffset.x / zoom) / gridSize) * gridSize - 500;
    const endX = startX + (exportCanvas.width / zoom) + 1000;
    const startY = Math.floor((-panOffset.y / zoom) / gridSize) * gridSize - 500;
    const endY = startY + (exportCanvas.height / zoom) + 1000;

    for (let x = startX; x < endX; x += gridSize) {
      eCtx.beginPath(); eCtx.moveTo(x, startY); eCtx.lineTo(x, endY); eCtx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      eCtx.beginPath(); eCtx.moveTo(startX, y); eCtx.lineTo(endX, y); eCtx.stroke();
    }

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
    else if (format === "svg") {
      const svgLink = document.createElement("a");
      svgLink.download = `${boardTitle.replace(/\s+/g, "_")}_export.svg`;
      svgLink.href = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${exportCanvas.width}" height="${exportCanvas.height}"><rect width="100%" height="100%" fill="%23020617"/><text x="20" y="40" fill="white" font-family="sans-serif">Vector Export Feature Placeholder</text></svg>`;
      svgLink.click();
    } 
    else if (format === "pdf") {
      const pdfWindow = window.open("");
      pdfWindow.document.write(`<img src="${exportCanvas.toDataURL("image/png")}" style="width:100%; max-width:1200px;" />`);
      pdfWindow.document.title = `${boardTitle} Document Frame`;
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

    ctx.strokeStyle = "#1e293b";
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

    ctx.restore();
  }, [elements, newElement, panOffset, zoom, loading, board, opacity, strokeColor, backgroundColor, strokeWidth, strokeStyle, selectedElementIdx, hoveredElementIdx, tool, fontSize]);

  const handleWheel = (e) => {
    e.preventDefault();
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
  }, [zoom, panOffset]);

  const fetchCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    return {
      x: (cx - panOffset.x) / zoom,
      y: (cy - panOffset.y) / zoom
    };
  };

  const findElementAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      
      if (el.type === "pencil" && el.points) {
        const threshold = 12;
        for (let p of el.points) {
          if (Math.sqrt(Math.pow(p[0] - x, 2) + Math.pow(p[1] - y, 2)) < threshold) return i;
        }
      }

      if (el.type === "text" && ctx) {
        ctx.save();
        ctx.font = `bold ${el.fontSize || 24}px sans-serif`;
        const textWidth = ctx.measureText(el.text).width;
        ctx.restore();
        if (x >= el.x1 && x <= el.x1 + textWidth && y >= el.y1 && y <= el.y1 + (el.fontSize || 24)) {
          return i;
        }
      }

      const minX = Math.min(el.x1, el.x2), maxX = Math.max(el.x1, el.x2);
      const minY = Math.min(el.y1, el.y2), maxY = Math.max(el.y1, el.y2);

      if ((el.type === "rectangle" || el.type === "diamond" || el.type === "circle") && x >= minX && x <= maxX && y >= minY && y <= maxY) {
        return i;
      }
      
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
      }
    }
    return -1;
  };

  const handleMouseDown = (e) => {
    // CRITICAL FIX: If user clicks the canvas while an input is open, intercept it 
    // and explicitly call finalizeTextElement using the ref before executing any mouse actions.
    if (textInputRef.current) {
      finalizeTextElement();
      return;
    }

    const { x, y } = fetchCanvasCoordinates(e);

    if (tool === "pan" || isSpacePressed) {
      setAction("panning");
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (tool === "select") {
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

    if (tool === "text") {
      setAction("writing");
      setTextInput({ canvasX: x, canvasY: y, value: "" });
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

    if (action === "drawing" && newElement) {
      if (tool === "pencil") {
        setNewElement(prev => ({ ...prev, points: [...prev.points, [x, y]] }));
      } else {
        setNewElement(prev => ({ ...prev, x2: x, y2: y }));
      }
    }
  };

  const handleMouseUp = () => {
    if (action === "moving") {
      updateHistoryAndElements(elements);
    }
    if (action === "drawing" && newElement) {
      const updated = [...elements, { ...newElement, strokeColor, backgroundColor, strokeWidth, opacity, strokeStyle, fontSize }];
      updateHistoryAndElements(updated);
      setNewElement(null);
    }
    if (action !== "writing") {
      setAction("none");
    }
  };

  const finalizeTextElement = () => {
    // Pull text values straight from the ref to avoid stale closure variables during immediate canvas clicks
    const currentInput = textInputRef.current;
    if (currentInput && currentInput.value.trim() !== "") {
      const updated = [
        ...elements, 
        { 
          type: "text", 
          x1: currentInput.canvasX, 
          y1: currentInput.canvasY, 
          text: currentInput.value, 
          strokeColor, 
          fontSize, 
          opacity 
        }
      ];
      updateHistoryAndElements(updated);
    }
    setTextInput(null);
    setAction("none");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Workspace sharing link copied!");
  };

  const getTextInputStyles = () => {
    if (!textInput) return {};
    const screenX = textInput.canvasX * zoom + panOffset.x;
    const screenY = textInput.canvasY * zoom + panOffset.y;
    return {
      position: "absolute",
      top: `${screenY}px`,
      left: `${screenX}px`,
      transform: "translateY(-4px)",
      fontSize: `${fontSize * zoom}px`,
      lineHeight: "1",
      color: strokeColor,
      backgroundColor: "#0f172a",
      border: "1px solid #6366f1",
      padding: "2px 6px",
      borderRadius: "4px",
      outline: "none",
      zIndex: 100,
      fontFamily: "sans-serif",
      fontWeight: "bold"
    };
  };

  return (
    <div className="h-screen w-full flex flex-col bg-slate-950 text-slate-50 overflow-hidden relative font-sans select-none">
      
      {/* HEADER CONTROL LAYER */}
      <header className="h-14 border-b border-slate-900 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-slate-100 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            {isEditingTitle ? (
              <input
                type="text" value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)} onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                className="bg-slate-800 border border-indigo-500 rounded px-2 py-0.5 text-sm font-semibold focus:outline-none" autoFocus
              />
            ) : (
              <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsEditingTitle(true)}>
                <h1 className="font-semibold text-sm tracking-tight">{boardTitle}</h1>
                <Edit3 className="h-3 w-3 text-slate-500 group-hover:text-indigo-400" />
              </div>
            )}
          </div>
        </div>

        {/* COLLABORATORS */}
        <div className="flex items-center gap-2 ml-auto mr-4">
          <div className="flex -space-x-2 overflow-hidden">
            {Object.entries(onlineUsers).map(([presenceId, presences]) => {
              const userPresence = presences[0]; 
              if (!userPresence) return null;
              
              const initial = userPresence.name ? userPresence.name.charAt(0).toUpperCase() : "?";
              const isMe = userPresence.userId === SESSION_USER_ID;

              return (
                <div
                  key={presenceId}
                  title={`${userPresence.name} ${isMe ? "(You)" : ""}`}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ring-2 text-white select-none transition-transform hover:scale-110
                    ${isMe ? "bg-indigo-600 ring-slate-950 z-10" : "bg-emerald-600 ring-slate-950"}`}
                >
                  {initial}
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2.5">
          <Button 
            size="sm" 
            variant={showAiPanel ? "default" : "outline"} 
            onClick={() => setShowAiPanel(!showAiPanel)}
            className={`h-8 text-xs gap-1.5 ${showAiPanel ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent" : "border-slate-800 text-slate-300 hover:bg-slate-900"}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            AI Generator
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="border-slate-800 text-slate-300 h-8 text-xs gap-1">
                <Download className="h-3.5 w-3.5 text-indigo-400" /> Export <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-32">
              <DropdownMenuItem onClick={() => handleExport("png")} className="cursor-pointer text-xs focus:bg-slate-800 focus:text-white">Export as PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("svg")} className="cursor-pointer text-xs focus:bg-slate-800 focus:text-white">Export as SVG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")} className="cursor-pointer text-xs focus:bg-slate-800 focus:text-white">Export as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={handleShare} size="sm" variant="outline" className="border-slate-800 text-slate-300 h-8 text-xs">
            <Share2 className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Share
          </Button>
          <Button onClick={saveWorkspaceData} size="sm" className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save changes
          </Button>
        </div>
      </header>

      {/* FLOATING TOOLBAR */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-800/80 p-1 rounded-xl flex items-center gap-0.5 z-20 shadow-2xl">
        {[
          { id: "select", icon: MousePointer, label: "Select Picker" },
          { id: "pan", icon: Hand, label: "Pan Canvas" },
          { id: "pencil", icon: PenTool, label: "Freehand Pencil" },
          { id: "rectangle", icon: Square, label: "Rectangle Box" },
          { id: "diamond", icon: HelpCircle, label: "Rough Diamond" },
          { id: "circle", icon: Circle, label: "Perfect Circle" },
          { id: "arrow", icon: MoveRight, label: "Vector Arrow" },
          { id: "text", icon: Type, label: "Rich Text Layer" },
          { id: "eraser", icon: Eraser, label: "Eraser" },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id} size="sm" variant={tool === t.id ? "default" : "ghost"}
              onClick={() => { setTool(t.id); if(t.id !== "select") setSelectedElementIdx(null); }}
              className={`h-8 w-8 p-0 ${tool === t.id ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
              title={t.label}
            >
              <Icon className="h-4 w-4" />
            </Button>
          );
        })}
        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
        
        {/* UNDO & REDO CONTROLS */}
        <Button 
          disabled={historyIndex === 0} 
          variant="ghost" size="sm" onClick={handleUndo} 
          className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
          title="Undo Action"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button 
          disabled={historyIndex >= history.length - 1} 
          variant="ghost" size="sm" onClick={handleRedo} 
          className="h-8 w-8 p-0 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
          title="Redo Action"
        >
          <Redo2 className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
        <Button variant="ghost" size="sm" onClick={() => { if(confirm("Clear current canvas layers?")) { updateHistoryAndElements([]); } }} className="h-8 px-2 text-xs text-rose-400 hover:bg-rose-950/20">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* WORKSPACE LAYOUT */}
      <div className="flex-1 w-full flex relative">
        
        {/* SLIDING AI PANEL */}
        {showAiPanel && (
          <div className="w-80 border-r border-slate-900 bg-slate-900/80 backdrop-blur-md p-4 flex flex-col gap-4 z-10 overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Bot className="h-5 w-5 text-purple-400" />
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">AI Sketchpad</h2>
                <p className="text-[10px] text-slate-500">Build any shape configuration or intricate flow vector layout instantly.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe charts, maps, compound shapes, flow graphs, networks..."
                className="w-full h-24 text-xs p-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none font-sans"
              />
              <Button 
                disabled={isAiGenerating} 
                onClick={handleAiGeneration}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 font-medium w-full"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Compiling Vector Graph...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-2" /> Inject Vectors onto Board
                  </>
                )}
              </Button>
            </div>

            <div className="border-t border-slate-800 pt-3 mt-1 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Universal Presets</h4>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => setAiPrompt("Draw a metrics visualization quarterly revenue bar chart")} className="text-left text-xs bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 p-2 rounded text-slate-400 hover:text-white transition">
                  📊 Quarterly Performance Chart
                </button>
                <button onClick={() => setAiPrompt("Create a mindmap layout hub with a core idea expanding into branches A and B")} className="text-left text-xs bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 p-2 rounded text-slate-400 hover:text-white transition">
                  🧠 Brainstorming Mind Map
                </button>
                <button onClick={() => setAiPrompt("Generate a linear sequence architecture diagram flowchart validation graph")} className="text-left text-xs bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 p-2 rounded text-slate-400 hover:text-white transition">
                  🔄 Step-by-Step Sequence Graph
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANVAS GRAPHICS MATRIX CONTAINER */}
        <div ref={containerRef} className="flex-1 h-full relative overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMoveViewport} onMouseUp={handleMouseUp}
            className={`w-full h-full block ${isSpacePressed || tool === "pan" ? (action === "panning" ? "cursor-grabbing" : "cursor-grab") : tool === "select" ? "cursor-default" : "cursor-crosshair"}`}
          />

{/* TEXT OVERLAY INJECTOR */}
          {textInput && (
            <input
              type="text"
              value={textInput.value}
              onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  // Force it to use the exact target value immediately
                  finalizeTextElement(e.target.value);
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setTextInput(null);
                  setAction("none");
                }
              }}
              // Passing the fresh value on blur bypasses the React state delay/stale closure
              onBlur={(e) => finalizeTextElement(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              style={getTextInputStyles()}
              autoFocus
            />
          )}

          {/* REAL-TIME REMOTE CURSORS */}
          {Object.entries(remoteCursors).map(([userId, cursor]) => (
            <div
              key={userId}
              style={{
                position: "absolute",
                left: `${cursor.x}px`,
                top: `${cursor.y}px`,
                pointerEvents: "none",
                transform: "translate(-2px, -2px)",
                transition: "all 0.08s ease-out"
              }}
              className="z-50 flex flex-col items-start"
            >
              <svg className="w-4 h-4 text-indigo-400 fill-current drop-shadow-md" viewBox="0 0 24 24">
                <path d="M4.5 3V17l4.2-4.2 3.8 8 2.5-1.2-3.8-8 5.8-.1z" />
              </svg>
              <span className="bg-indigo-600 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mt-1">
                {cursor.name}
              </span>
            </div>
          ))}
        </div>

        {/* PROPERTY SIDEBAR CONFIGURATOR */}
        <div className="w-64 border-l border-slate-900 bg-slate-900/60 backdrop-blur-md p-4 flex flex-col gap-4 z-10 overflow-y-auto">
          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stroke Colors</h3>
            <div className="grid grid-cols-6 gap-1.5">
              {["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#ffffff"].map((c) => (
                <button
                  key={c} onClick={() => setStrokeColor(c)}
                  className={`h-6 w-6 rounded-md border transition-transform ${strokeColor === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Background</h3>
            <div className="grid grid-cols-4 gap-1">
              {["transparent", "#1e1b4b", "#311042", "#062f28"].map((bg) => (
                <button
                  key={bg} onClick={() => setBackgroundColor(bg)}
                  className={`text-[10px] py-1 rounded border capitalize text-slate-300 ${backgroundColor === bg ? "bg-slate-800 border-indigo-500" : "bg-slate-950 border-slate-800"}`}
                >
                  {bg === "transparent" ? "None" : "Fill"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Stroke Style</h3>
            <div className="grid grid-cols-3 gap-1">
              {["solid", "dashed", "dotted"].map((s) => (
                <button
                  key={s} onClick={() => setStrokeStyle(s)}
                  className={`text-[10px] py-1 rounded border capitalize text-slate-300 ${strokeStyle === s ? "bg-slate-800 border-indigo-500" : "bg-slate-950 border-slate-800"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Thickness ({strokeWidth}px)</h3>
            <input type="range" min="1" max="10" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Font Size ({fontSize}px)</h3>
            <input type="range" min="16" max="60" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-indigo-500" />
          </div>

          <div className="mt-auto pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 space-y-1">
            <p>Active Elements Layer: {elements.length}</p>
            <p>Scale Ratio: {Math.round(zoom * 100)}%</p>
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTROLS */}
      <div className="absolute bottom-4 left-4 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg flex items-center gap-1 z-20">
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} className="h-7 w-7 text-slate-400"><ZoomOut className="h-3.5 w-3.5" /></Button>
        <span className="text-xs font-mono px-1 text-slate-300">{Math.round(zoom * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(4, z + 0.1))} className="h-7 w-7 text-slate-400"><ZoomIn className="h-3.5 w-3.5" /></Button>
        <div className="h-4 w-[1px] bg-slate-800 mx-1" />
        <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="h-7 w-7 text-slate-400"><Maximize2 className="h-3.5 w-3.5" /></Button>
      </div>
      
    </div>
  );
}