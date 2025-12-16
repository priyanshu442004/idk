import React, { useState, useEffect } from "react";
import { useConversation } from "@elevenlabs/react";
import { io } from "socket.io-client";

const socket = io("https://idk-0ea4.onrender.com");

type Message = {
  text: string;
  sender: "user" | "agent";
};

const agentList = [
  { id: 1, agent_id: "agent_4001kc6cnz0deb9a29531s4ser5b" , agent_name:"test"},
   { id: 6, agent_id: "agent_9801kagjnzjqf798fvsj7n8627f4",agent_name:"Vikram" },
  { id: 5, agent_id: "agent_0401kagjcxt1ekvrq6z2ywshvvp2",agent_name:"PriyaMehta" },
  { id: 4, agent_id: "agent_4701kagjaeqsf83vdn3p83yaewqg",agent_name:"Vineeta" },
  { id: 3, agent_id: "agent_3401kagj0de1efytk046757d9f4p",agent_name:"Ananya" },
  { id: 2, agent_id: "agent_4501kae38yqaeh0sn0gq9bxsy3gr",agent_name:"Rajeev" },
  
 
];

const MultiAgentChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionActive, setSessionActive] = useState(false);

  const conversation = useConversation({
    onConnect: () => {
      setSessionActive(true);
      setMessages((prev) => [
        ...prev,
        { text: `✅ Session started`, sender: "agent" },
      ]);
    },

    onDisconnect: () => {
      setSessionActive(false);
      setMessages((prev) => [
        ...prev,
        { text: `⚠️ Session ended`, sender: "agent" },
      ]);
    },

    onMessage: (event: any) => {
      if (event?.message?.text) {
        setMessages((prev) => [...prev, { text: event.message.text, sender: "agent" }]);
      }
    },

    onError: (error: any) => {
      console.error("Conversation SDK error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "⚠️ Conversation error occurred.", sender: "agent" },
      ]);
    },
  });

  // ⭐ SOCKET LISTENER — AUTO SWITCH AGENT
  useEffect(() => {
    const handleNewData = async (incoming: any) => {
      console.log("Received:", incoming);

      if (incoming?.isend === "true") {
        const targetId = Number(incoming.id);

        const targetAgent = agentList.find((a) => a.id === targetId);
        console.log("taret",targetAgent)
        if (!targetAgent) {
          console.warn("No agent matches ID:", targetId);
          return;
        }

        console.log("Switching to agent:", targetAgent.agent_id);

        // End old session
        try {
          await conversation.endSession();
        } catch (err) {
          console.warn("Error ending previous session:", err);
        }

        // Start new agent session
        try {
          await conversation.startSession({
            agentId: targetAgent.agent_id,
            userId: "Sandeep",
            connectionType: "webrtc",
          });

          setMessages((prev) => [
            ...prev,
            { text: `🔄 Switched to Agent ID ${targetId}`, sender: "agent" },
          ]);
        } catch (err) {
          console.error("Failed to start new agent:", err);
        }
      }
    };

    socket.on("newData", handleNewData);
    return () => {
    socket.off("newData", handleNewData);
  };
  }, [conversation]);

  const startSession = async () => {
    if (sessionActive) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start with agent 1 by default
      await conversation.startSession({
        agentId: agentList[0].agent_id,
        userId: "Sandeep123",
        connectionType: "webrtc",
      });
    } catch (err) {
      console.error("Failed to start session:", err);
      setMessages((prev) => [...prev, { text: "⚠️ Failed to start session.", sender: "agent" }]);
    }
  };

  const endSession = async () => {
    if (!sessionActive) return;

    try {
      await conversation.endSession();
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const handleSend = () => {
    if (!input.trim() || !sessionActive) return;

    setMessages((prev) => [...prev, { text: input, sender: "user" }]);

    try {
      conversation.sendUserMessage(input);
    } catch {
      setMessages((prev) => [...prev, { text: "⚠️ Failed to send message.", sender: "agent" }]);
    }

    setInput("");
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", fontFamily: "sans-serif" }}>
      <h2>Multi-Agent Chat</h2>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          padding: 10,
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: msg.sender === "user" ? "#007bff" : "#e5e5ea",
              color: msg.sender === "user" ? "white" : "black",
              borderRadius: 12,
              padding: "6px 12px",
              maxWidth: "75%",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", marginTop: 10, gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!sessionActive}
        />
        <button onClick={handleSend} style={{ padding: "8px 16px" }} disabled={!sessionActive}>
          Send
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button onClick={startSession} style={{ padding: "6px 12px" }} disabled={sessionActive}>
          Start Session
        </button>
        <button onClick={endSession} style={{ padding: "6px 12px" }} disabled={!sessionActive}>
          End Session
        </button>
      </div>

      <div style={{ marginTop: 8 }}>
        <strong>Status:</strong> {conversation.status}
      </div>
    </div>
  );
};

export default MultiAgentChat;

