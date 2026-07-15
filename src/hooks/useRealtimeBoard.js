import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useRealtimeBoard(boardId, currentUser, onRemoteElementUpdate) {
  const [activeUsers, setActiveUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    if (!boardId || !currentUser) return;

    // 1. Initialize a dedicated Supabase Realtime channel for this specific board
    const channel = supabase.channel(`board_room:${boardId}`, {
      config: { 
        broadcast: { self: false }, // Don't receive our own broadcasted events
        presence: { key: currentUser.id } 
      }
    });

    // 2. Listen to real-time broadcast changes (drawing updates and cursor tracks)
    channel
      .on("broadcast", { event: "drawing-change" }, ({ payload }) => {
        // Trigger callback to update elements array inside the main canvas state
        onRemoteElementUpdate(payload.elements);
      })
      .on("broadcast", { event: "cursor-move" }, ({ payload }) => {
        // Track where other active peers are pointing
        setRemoteCursors((prev) => ({
          ...prev,
          [payload.userId]: { x: payload.x, y: payload.y, name: payload.name }
        }));
      })
      // 3. Sync Presence state to show who is online
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state)
          .flat()
          .map((presence) => presence.user);
        setActiveUsers(users);
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        // Clean up cursor shadows when someone leaves the board
        leftPresences.forEach((p) => {
          setRemoteCursors((prev) => {
            const copy = { ...prev };
            delete copy[p.user.id];
            return copy;
          });
        });
      });

    // 4. Subscribe and track the current user's online state
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user: { 
            id: currentUser.id, 
            name: currentUser.fullName || currentUser.username || "Anonymous Creator" 
          }
        });
      }
    });

    // Clean up connections on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [boardId, currentUser]);

  // Expose broadcasting functions so the canvas UI can push actions out
  const broadcastCursor = (x, y) => {
    if (!channel || channel.state !== "joined") return;
    channel.send({
      type: "broadcast",
      event: "cursor-move",
      payload: { userId: currentUser.id, name: currentUser.fullName || "Collaborator", x, y }
    });
  };

  const broadcastCanvasUpdate = (newElements) => {
    if (!channel || channel.state !== "joined") return;
    channel.send({
      type: "broadcast",
      event: "drawing-change",
      payload: { elements: newElements }
    });
  };

  return { activeUsers, remoteCursors, broadcastCursor, broadcastCanvasUpdate };
}