import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; 
import { supabase } from "@/lib/supabaseClient";
import { useUser, UserButton } from "@clerk/clerk-react"; 
import { 
  LayoutDashboard, 
  Star, 
  Users, 
  Clock, 
  Trash2, 
  Settings, 
  Search, 
  Bell, 
  Plus, 
  FileText, 
  KanbanSquare, 
  Grid3X3, 
  GitFork,
  Sun,
  Moon,
  Layers,
  Heart,
  Loader2,
  ExternalLink,
  ArrowLeft,
  User,
  Palette,
  ShieldCheck,
  FileSignature
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// EXCALIDRAW-READY MINI PREVIEW RENDERER
function MiniBoardPreview({ canvasData }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!canvasData || !Array.isArray(canvasData) || canvasData.length === 0) {
      context.strokeStyle = "#475569";
      context.lineWidth = 0.5;
      for (let i = 0; i < canvas.width; i += 20) {
        context.beginPath(); context.moveTo(i, 0); context.lineTo(i, canvas.height); context.stroke();
        context.beginPath(); context.moveTo(0, i); context.lineTo(canvas.width, i); context.stroke();
      }
      return;
    }

    context.save();
    
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    canvasData.forEach(el => {
      if (el.type === "pencil" && el.points) {
        el.points.forEach(([x, y]) => {
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        });
      } else if (el.x1 !== undefined) {
        minX = Math.min(minX, el.x1, el.x2 ?? el.x1);
        maxX = Math.max(maxX, el.x1, el.x2 ?? el.x1);
        minY = Math.min(minY, el.y1, el.y2 ?? el.y1);
        maxY = Math.max(maxY, el.y1, el.y2 ?? el.y1);
      }
    });

    const padding = 15;
    const drawingWidth = (maxX - minX) || 1;
    const drawingHeight = (maxY - minY) || 1;
    
    const scaleX = (canvas.width - padding * 2) / drawingWidth;
    const scaleY = (canvas.height - padding * 2) / drawingHeight;
    const scale = Math.min(scaleX, scaleY, 0.4); 

    const targetCenterX = canvas.width / 2;
    const targetCenterY = canvas.height / 2;
    const currentCenterX = minX + drawingWidth / 2;
    const currentCenterY = minY + drawingHeight / 2;

    context.translate(targetCenterX - currentCenterX * scale, targetCenterY - currentCenterY * scale);
    context.scale(scale, scale);

    canvasData.forEach((el) => {
      context.save();
      context.globalAlpha = el.opacity || 1;
      context.strokeStyle = el.strokeColor || "#6366f1";
      context.fillStyle = el.backgroundColor || "transparent";
      context.lineWidth = Math.max((el.strokeWidth || 2) * 0.5, 1.5);

      if (el.strokeStyle === "dashed") {
        context.setLineDash([6, 6]);
      } else if (el.strokeStyle === "dotted") {
        context.setLineDash([2, 4]);
      } else {
        context.setLineDash([]);
      }

      context.beginPath();

      if (el.type === "pencil" && el.points && el.points.length > 0) {
        context.moveTo(el.points[0][0], el.points[0][1]);
        for (let i = 1; i < el.points.length; i++) {
          context.lineTo(el.points[i][0], el.points[i][1]);
        }
        context.stroke();
      } else if (el.type === "line") {
        context.moveTo(el.x1, el.y1);
        context.lineTo(el.x2, el.y2);
        context.stroke();
      } else if (el.type === "rectangle") {
        if (el.backgroundColor && el.backgroundColor !== "transparent") {
          context.fillRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
        }
        context.strokeRect(el.x1, el.y1, el.x2 - el.x1, el.y2 - el.y1);
      } else if (el.type === "diamond") {
        const cx = (el.x1 + el.x2) / 2;
        const cy = (el.y1 + el.y2) / 2;
        context.moveTo(cx, el.y1);
        context.lineTo(el.x2, cy);
        context.lineTo(cx, el.y2);
        context.lineTo(el.x1, cy);
        context.closePath();
        if (el.backgroundColor && el.backgroundColor !== "transparent") context.fill();
        context.stroke();
      } else if (el.type === "circle") {
        const rx = Math.abs(el.x2 - el.x1) / 2;
        const ry = Math.abs(el.y2 - el.y1) / 2;
        const cx = (el.x1 + el.x2) / 2;
        const cy = (el.y1 + el.y2) / 2;
        context.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
        if (el.backgroundColor && el.backgroundColor !== "transparent") context.fill();
        context.stroke();
      } else if (el.type === "arrow") {
        context.moveTo(el.x1, el.y1);
        context.lineTo(el.x2, el.y2);
        context.stroke();
      } else if (el.type === "text") {
        context.font = `bold ${(el.fontSize || 20) * 0.9}px sans-serif`;
        context.fillStyle = el.strokeColor || "#6366f1";
        context.fillText(el.text || "", el.x1, el.y1);
      }

      context.restore();
    });

    context.restore();
  }, [canvasData]);

  return <canvas ref={canvasRef} width={280} height={128} className="w-full h-full object-cover block" />;
}

export default function Dashboard() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const navigate = useNavigate();

  const [currentView, setCurrentView] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [boards, setBoards] = useState([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const [deletedBoards, setDeletedBoards] = useState([]);

  // PRESET LAYOUT MAPPER
  const getTemplateSeedData = (templateName) => {
    switch (templateName) {
      case "Flowchart":
        return [
          { type: "rectangle", x1: 200, y1: 100, x2: 380, y2: 160, strokeColor: "#6366f1", backgroundColor: "#1e1b4b", strokeWidth: 3, opacity: 1 },
          { type: "text", x1: 235, y1: 135, text: "Start Trigger", strokeColor: "#ffffff", fontSize: 20 },
          { type: "arrow", x1: 290, y1: 160, x2: 290, y2: 240, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "diamond", x1: 190, y1: 240, x2: 390, y2: 360, strokeColor: "#f59e0b", backgroundColor: "#311042", strokeWidth: 3 },
          { type: "text", x1: 245, y1: 305, text: "Condition?", strokeColor: "#ffffff", fontSize: 20 },
          { type: "arrow", x1: 390, y1: 300, x2: 490, y2: 300, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "rectangle", x1: 490, y1: 250, x2: 670, y2: 350, strokeColor: "#10b981", backgroundColor: "#062f28", strokeWidth: 3 },
          { type: "text", x1: 525, y1: 305, text: "Action Node", strokeColor: "#ffffff", fontSize: 20 }
        ];
      case "Kanban":
        return [
          { type: "text", x1: 100, y1: 80, text: "To Do 📝", strokeColor: "#f59e0b", fontSize: 24 },
          { type: "text", x1: 360, y1: 80, text: "In Progress 🚀", strokeColor: "#6366f1", fontSize: 24 },
          { type: "text", x1: 640, y1: 80, text: "Done ✅", strokeColor: "#10b981", fontSize: 24 },
          { type: "rectangle", x1: 80, y1: 120, x2: 310, y2: 500, strokeColor: "#334155", strokeWidth: 2, strokeStyle: "dashed" },
          { type: "rectangle", x1: 340, y1: 120, x2: 570, y2: 500, strokeColor: "#334155", strokeWidth: 2, strokeStyle: "dashed" },
          { type: "rectangle", x1: 600, y1: 120, x2: 830, y2: 500, strokeColor: "#334155", strokeWidth: 2, strokeStyle: "dashed" },
          { type: "rectangle", x1: 95, y1: 140, x2: 295, y2: 220, strokeColor: "#ffffff", backgroundColor: "#1e1b4b", strokeWidth: 2 },
          { type: "text", x1: 110, y1: 180, text: "Setup Supabase Schema", strokeColor: "#ffffff", fontSize: 16 },
          { type: "rectangle", x1: 355, y1: 140, x2: 555, y2: 220, strokeColor: "#ffffff", backgroundColor: "#311042", strokeWidth: 2 },
          { type: "text", x1: 370, y1: 180, text: "Build Excalidraw Layer", strokeColor: "#ffffff", fontSize: 16 }
        ];
      case "Wireframe":
        return [
          { type: "rectangle", x1: 100, y1: 60, x2: 800, y2: 520, strokeColor: "#ffffff", strokeWidth: 3 }, 
          { type: "rectangle", x1: 100, y1: 60, x2: 800, y2: 120, strokeColor: "#334155", backgroundColor: "#1e1b4b", strokeWidth: 2 }, 
          { type: "text", x1: 130, y1: 95, text: "SaaS Application Header", strokeColor: "#6366f1", fontSize: 18 },
          { type: "circle", x1: 720, y1: 75, x2: 765, y2: 105, strokeColor: "#ffffff", strokeWidth: 2 }, 
          { type: "rectangle", x1: 140, y1: 160, x2: 400, y2: 440, strokeColor: "#334155", strokeWidth: 2 }, 
          { type: "line", x1: 170, y1: 210, x2: 370, y2: 210, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "line", x1: 170, y1: 250, x2: 320, y2: 250, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "text", x1: 440, y1: 190, text: "Main Content Layout Space", strokeColor: "#ffffff", fontSize: 26 }
        ];
      case "Mindmap":
        return [
          { type: "circle", x1: 350, y1: 200, x2: 510, y2: 280, strokeColor: "#ec4899", backgroundColor: "#311042", strokeWidth: 3 },
          { type: "text", x1: 385, y1: 245, text: "Central Node", strokeColor: "#ffffff", fontSize: 20 },
          { type: "line", x1: 350, y1: 240, x2: 200, y2: 140, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "rectangle", x1: 50, y1: 90, x2: 200, y2: 150, strokeColor: "#6366f1", backgroundColor: "#1e1b4b", strokeWidth: 2 },
          { type: "text", x1: 75, y1: 125, text: "Branch Alpha", strokeColor: "#ffffff", fontSize: 16 },
          { type: "line", x1: 510, y1: 240, x2: 660, y2: 340, strokeColor: "#ffffff", strokeWidth: 2 },
          { type: "rectangle", x1: 660, y1: 310, x2: 810, y2: 370, strokeColor: "#10b981", backgroundColor: "#062f28", strokeWidth: 2 },
          { type: "text", x1: 685, y1: 345, text: "Branch Beta", strokeColor: "#ffffff", fontSize: 16 }
        ];
      default:
        return [];
    }
  };

  useEffect(() => {
    async function fetchBoards() {
      if (!isUserLoaded || !user) return;
      
      try {
        const { data, error } = await supabase
          .from("BoardCraft") 
          .select("*")
          .eq("user_id", user.id);

        if (error) throw error;
        setBoards(data || []);
      } catch (err) {
        console.error("Error fetching boards:", err.message);
      } finally {
        setIsLoadingBoards(false);
      }
    }

    fetchBoards();
  }, [user, isUserLoaded]);

  const handleCreateBoard = async (title = "Untitled Board", templateName = "") => {
    if (!user) return;
    setIsCreating(true);

    const targetCanvasLayout = getTemplateSeedData(templateName);

    try {
      const { data, error } = await supabase
        .from("BoardCraft") 
        .insert([
          {
            title: title,
            user_id: user.id,
            canvas_data: targetCanvasLayout,
            is_starred: false
          }
        ])
        .select() 
        .single();

      if (error) throw error;

      if (data && data.id) {
        navigate(`/board/${data.id}`);
      }
    } catch (err) {
      console.error("Failed to create new board:", err.message);
      alert("Error generating board workspace layout configuration.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStar = async (id, currentStatus, e) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from("BoardCraft")
        .update({ is_starred: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      setBoards(prev => prev.map(b => b.id === id ? { ...b, is_starred: !currentStatus } : b));
    } catch (err) {
      console.error("Error updating star status:", err.message);
    }
  };

  const handleDeleteBoard = async (id, e) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to permanently delete this board?")) {
      return;
    }

    try {
      const targetBoard = boards.find(b => b.id === id);
      if (targetBoard) {
        setDeletedBoards(prev => [targetBoard, ...prev]);
      }

      const { error } = await supabase
        .from("BoardCraft")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setBoards((prevBoards) => prevBoards.filter((board) => board.id !== id));
    } catch (err) {
      console.error("Deletion Error:", err.message);
    }
  };

  const renderBoardGrid = (boardList) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {boardList.map((board) => (
        <Card 
          key={board.id} 
          onClick={() => navigate(`/board/${board.id}`)}
          className={`group border hover:shadow-md transition-all cursor-pointer relative overflow-hidden ${
            isDarkMode ? "bg-slate-900 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className={`h-32 border-b flex items-center justify-center transition-colors relative overflow-hidden ${
            isDarkMode ? "bg-slate-950 border-slate-800" : "bg-slate-50 border-slate-200"
          }`}>
            <MiniBoardPreview canvasData={board.canvas_data} />
            
            <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={(e) => handleToggleStar(board.id, board.is_starred, e)}
                className={`p-1.5 rounded-md backdrop-blur-sm shadow-sm transition-all ${
                  board.is_starred 
                    ? "bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30" 
                    : "bg-slate-900/40 text-slate-400 opacity-0 group-hover:opacity-100 border border-slate-700/40 hover:text-amber-500"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${board.is_starred ? "fill-amber-500 dark:fill-amber-400" : ""}`} />
              </button>
            </div>

            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
              <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-md shadow-lg">
                Open Workspace <ExternalLink className="h-3 w-3 text-indigo-400" />
              </span>
            </div>
          </div>

          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className={`font-medium truncate transition-colors ${
                isDarkMode ? "text-slate-200 group-hover:text-indigo-400" : "text-slate-900 group-hover:text-indigo-600"
              }`}>{board.title || "Untitled Board"}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Edited {formatDate(board.created_at || board.updated_at)}</p>
            </div>

            <button
              onClick={(e) => handleDeleteBoard(board.id, e)}
              className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/30 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const getFilteredBoardsByView = () => {
    const matched = boards.filter(board =>
      board.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    switch(currentView) {
      case "favorites":
        return matched.filter(b => b.is_starred);
      case "recent":
        return [...matched].sort((a,b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
      case "shared":
        return matched.filter(b => b.is_shared === true || (b.collaborators && b.collaborators.length > 0)); 
      default:
        return matched;
    }
  };

  const filteredBoards = getFilteredBoardsByView();

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const templates = [
    { name: "Flowchart", icon: GitFork, lightColor: "bg-blue-50 text-blue-600 border-blue-200", darkColor: "bg-blue-950/40 text-blue-400 border-blue-900/50" },
    { name: "Kanban", icon: KanbanSquare, lightColor: "bg-purple-50 text-purple-600 border-purple-200", darkColor: "bg-purple-950/40 text-purple-400 border-purple-900/50" },
    { name: "Wireframe", icon: Grid3X3, lightColor: "bg-amber-50 text-amber-600 border-amber-200", darkColor: "bg-amber-950/40 text-amber-400 border-purple-900/50" },
    { name: "Mindmap", icon: FileText, lightColor: "bg-emerald-50 text-emerald-600 border-emerald-200", darkColor: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50" },
  ];

  // Dynamically compute absolute distinct collaborator count across all your workspace boards
  const getCollaboratorCount = () => {
    const sets = new Set();
    boards.forEach(b => {
      if (b.collaborators && Array.isArray(b.collaborators)) {
        b.collaborators.forEach(id => sets.add(id));
      }
    });
    return sets.size;
  };

  return (
    <div className={`flex h-screen w-full flex-col transition-colors duration-200 ${
      isDarkMode ? "bg-slate-950 text-slate-50" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* NAVBAR */}
      <header className={`flex h-16 w-full items-center justify-between border-b px-6 transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/")} 
            className={`flex items-center gap-1 text-xs font-normal border ${
              isDarkMode ? "text-slate-400 border-slate-800 hover:bg-slate-800" : "text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Landing
          </Button>
          <div className="font-bold text-xl tracking-tight text-indigo-600 dark:text-indigo-400 select-none">
            BoardCraft
          </div>
        </div>

        <div className="relative w-full max-w-md mx-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search boards..."
            className={`pl-9 transition-colors ${
              isDarkMode 
                ? "bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:bg-slate-800/80" 
                : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:bg-slate-50/50"
            }`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className={`relative transition-colors ${isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}>
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-indigo-500" />
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className={`transition-colors ${isDarkMode ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </Button>

          <div className={`flex items-center justify-center pl-1 border-l h-6 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <UserButton afterSignOutUrl="/login" />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`w-64 border-r p-4 flex flex-col justify-between hidden md:flex transition-colors duration-200 ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}>
          <div className="space-y-1">
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              Workspace
            </p>
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "favorites", label: "Favorites", icon: Star },
              { id: "shared", label: "Shared", icon: Users },
              { id: "recent", label: "Recent", icon: Clock },
              { id: "trash", label: "Trash", icon: Trash2 },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors mb-0.5 ${
                    isActive ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* LOWER SIDEBAR LINKS */}
          <div className={`pt-4 border-t space-y-1 ${isDarkMode ? "border-slate-800" : "border-slate-200"}`}>
            <p className={`px-3 text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              Legal
            </p>
            {[
              { id: "privacy", label: "Privacy Policy", icon: ShieldCheck },
              { id: "terms", label: "Terms of Service", icon: FileSignature },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    isActive ? "bg-indigo-600 text-white" : isDarkMode ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* MAIN VIEWS */}
        <main className={`flex-1 overflow-y-auto flex flex-col justify-between transition-colors ${
          isDarkMode ? "bg-slate-950" : "bg-slate-50"
        }`}>
          {currentView === "dashboard" && (
            <>
              <div className="p-8 max-w-6xl w-full mx-auto space-y-10 flex-1">
                {/* HERO */}
                <section className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">
                        Welcome Back, {user?.firstName || "Craftsman"} 👋
                      </h1>
                      <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                        Pick up right where you left off or deploy a workflow.
                      </p>
                    </div>
                    <Button 
                      disabled={isCreating} 
                      onClick={() => handleCreateBoard("Untitled Board")} 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2"
                    >
                      {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      New Board
                    </Button>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Total Boards", value: boards.length, icon: Layers, color: "text-blue-500" },
                      { label: "Starred Boards", value: boards.filter(b => b.is_starred).length, icon: Star, color: "text-amber-500" },
                      { label: "Collaborators", value: getCollaboratorCount(), icon: Users, color: "text-indigo-500" },
                    ].map((stat, i) => {
                      const StatIcon = stat.icon;
                      return (
                        <Card key={i} className={`border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                                {stat.label}
                              </p>
                              <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-50">{stat.value}</p>
                            </div>
                            <div className={`p-2 rounded-lg ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                              <StatIcon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>

                <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />

                {/* RECENT BOARDS SECTION */}
                <section className="space-y-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Recent Boards</h2>
                  {isLoadingBoards ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading your boards...
                    </div>
                  ) : (
                    <>
                      {renderBoardGrid(filteredBoards)}
                      {filteredBoards.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 py-4 col-span-full">No boards found.</p>
                      )}
                    </>
                  )}
                </section>

                <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />

                {/* TEMPLATES */}
                <section className="space-y-4">
                  <h2 className={`text-lg font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Start with a Template</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {templates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <button
                          key={template.name}
                          disabled={isCreating}
                          onClick={() => handleCreateBoard(`New ${template.name}`, template.name)}
                          className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all group disabled:opacity-50 ${
                            isDarkMode ? "bg-slate-900 border-slate-800 hover:border-indigo-500/50" : "bg-white border-slate-200 hover:border-indigo-300"
                          }`}
                        >
                          <div className={`p-3 rounded-lg border mb-3 transition-transform group-hover:scale-105 ${
                            isDarkMode ? template.darkColor : template.lightColor
                          }`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300 group-hover:text-indigo-400" : "text-slate-700 group-hover:text-indigo-600"}`}>
                            {template.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* DYNAMIC VIEW MANAGEMENT COMPONENT INTEGRATIONS */}
          {["favorites", "shared", "recent"].includes(currentView) && (
            <div className="p-8 max-w-6xl w-full mx-auto space-y-6 flex-1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight capitalize">{currentView} Workspaces</h1>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {currentView === "favorites" && "Your highly valued workspace boards collections."}
                  {currentView === "shared" && "Canvas layouts where you collaborate with external teams."}
                  {currentView === "recent" && "Quick access to your most active layouts organized by edit dates."}
                </p>
              </div>
              <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />
              {filteredBoards.length > 0 ? (
                renderBoardGrid(filteredBoards)
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  No canvases match your current active view rules criteria.
                </div>
              )}
            </div>
          )}

          {currentView === "trash" && (
            <div className="p-8 max-w-6xl w-full mx-auto space-y-6 flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Deleted Canvases Trash</h1>
                  <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Review boards removed during this session.
                  </p>
                </div>
                {deletedBoards.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setDeletedBoards([])} className="text-xs text-rose-500 hover:bg-rose-50 border-rose-200 dark:hover:bg-rose-950/20 dark:border-rose-900/50">
                    Clear Trash Stack
                  </Button>
                )}
              </div>
              <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />
              {deletedBoards.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {deletedBoards.map((board) => (
                    <Card key={board.id} className={`border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} opacity-70`}>
                      <div className="p-4 flex flex-col justify-between h-32">
                        <div>
                          <h3 className="font-semibold truncate text-slate-900 dark:text-slate-50">{board.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">Temporary Cached Reference ID: {board.id.slice(0,8)}...</p>
                        </div>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="w-full text-xs"
                          onClick={async () => {
                            try {
                              const { error } = await supabase.from("BoardCraft").insert([board]);
                              if (error) throw error;
                              setBoards(prev => [board, ...prev]);
                              setDeletedBoards(prev => prev.filter(b => b.id !== board.id));
                            } catch(e) {
                              alert("Failed restoration: " + e.message);
                            }
                          }}
                        >
                          Restore Board
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-500">
                  Trash bin empty. Boards deleted during this active window will cache here for swift recovery options.
                </div>
              )}
            </div>
          )}

          {currentView === "settings" && (
            <div className="p-8 max-w-4xl w-full mx-auto space-y-8 flex-1">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Account & Workspace Settings</h1>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Manage preferences, details, integrations, and customization choices.
                </p>
              </div>
              
              <div className="space-y-6">
                <Card className={`border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-md font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                      <User className="h-4 w-4 text-indigo-500" /> User Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">First Name</label>
                        <Input value={user?.firstName || ""} disabled className={isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label>
                        <Input value={user?.primaryEmailAddress?.emailAddress || ""} disabled className={isDarkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-900"} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className={`border ${isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-md font-semibold flex items-center gap-2 text-slate-900 dark:text-slate-50">
                      <Palette className="h-4 w-4 text-amber-500" /> Interface Customization
                    </h3>
                    <div className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-50">Dark System Skin Theme</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Toggle default canvas workspace illumination mode styles.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsDarkMode(!isDarkMode)} className={!isDarkMode ? "border-slate-200 text-slate-700" : ""}>
                        {isDarkMode ? "Active: Dark Mode" : "Active: Light Mode"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY VIEW */}
          {currentView === "privacy" && (
            <div className="p-8 max-w-4xl w-full mx-auto space-y-6 flex-1 text-sm">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Privacy Policy</h1>
                <p className="text-xs text-slate-500 mt-1">Last revised: July 15, 2026</p>
              </div>
              <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />
              <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                <p>Your privacy is important to us. It is BoardCraft's policy to respect your privacy regarding any information we may collect from you across our application workspace layers.</p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-4">1. Information We Collect</h3>
                <p>We only ask for personal information (such as name and email authenticated via Clerk) when we truly need it to provide a seamless cloud rendering flow workspace state management solution back to you.</p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-4">2. Canvas Data Storage</h3>
                <p>All structured Excalidraw vector shapes, mindmaps, and text layers created within BoardCraft are stored securely via analytical metadata parameters on Supabase relational infrastructure environments.</p>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE VIEW */}
          {currentView === "terms" && (
            <div className="p-8 max-w-4xl w-full mx-auto space-y-6 flex-1 text-sm">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Terms of Service</h1>
                <p className="text-xs text-slate-500 mt-1">Last revised: July 15, 2026</p>
              </div>
              <hr className={isDarkMode ? "border-slate-800" : "border-slate-200"} />
              <div className={`space-y-4 leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">1. Acceptance of Terms</h3>
                <p>By accessing BoardCraft, you agree to comply with and be bound by these legal architecture conditions. If you do not agree, please stop using the workspace dashboards.</p>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-4">2. User Accounts</h3>
                <p>You are solely responsible for actions running within your instance account boundaries and keeping shared workspace canvas configuration access invites authentic.</p>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className={`mt-auto w-full py-5 px-8 border-t text-xs text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-200 ${
            isDarkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-center sm:text-left">
              <p className="font-medium text-slate-500 dark:text-slate-400">
                © 2026 BoardCraft Inc. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
                <button onClick={() => setCurrentView("privacy")} className="hover:text-indigo-500 transition-colors">Privacy Policy</button>
                <span className="h-3 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:inline" />
                <button onClick={() => setCurrentView("terms")} className="hover:text-indigo-500 transition-colors">Terms of Service</button>
                <span className="h-3 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:inline" />
                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Systems Operational
                </div>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${
              isDarkMode ? "bg-slate-900 border border-slate-800 text-slate-400" : "bg-slate-100 border border-slate-200 text-slate-600"
            }`}>
              <span className="text-slate-400 dark:text-slate-500">Engineered by</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">Gaurav</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-400 dark:text-slate-500">v1.0.0</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}