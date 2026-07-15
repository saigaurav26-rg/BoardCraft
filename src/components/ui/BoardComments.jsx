// src/components/BoardComments.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Send, MessageSquare, X } from "lucide-react";

export function BoardComments({ boardId, user, onClose }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!boardId) return;

    // Fetch existing comments
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("board_comments")
        .select("*")
        .eq("board_id", boardId)
        .order("created_at", { ascending: true });
      if (!error && data) setComments(data);
    };

    fetchComments();

    // Subscribe to real-time additions
    const channel = supabase
      .channel(`comments-${boardId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "board_comments", filter: `board_id=eq.${boardId}` },
        (payload) => {
          setComments((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase.from("board_comments").insert([
      {
        board_id: boardId,
        user_id: user.id,
        user_name: user.fullName || user.username || "Collaborator",
        user_image: user.imageUrl,
        text: newComment.trim(),
      },
    ]);

    if (error) console.error("Error sending comment:", error.message);
    setNewComment("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 w-80 text-white shadow-xl shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-400" />
          <span className="font-semibold text-sm">Live Comments</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-850 transition">
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
          </button>
        )}
      </div>
      
      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-xs text-slate-500 italic text-center mt-4">No comments yet. Start the brainstorm!</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2 text-sm">
              <img src={c.user_image} className="h-7 w-7 rounded-full object-cover shrink-0" alt="avatar" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-indigo-300">{c.user_name}</p>
                <p className="text-slate-300 bg-slate-800 p-2 rounded-lg mt-1 break-words text-xs">{c.text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Entry */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 flex gap-2 bg-slate-950">
        <input
          type="text"
          placeholder="Type a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 bg-slate-800 text-xs px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
        />
        <button type="submit" className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
    </div>
  );
}