"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface AgenticFlowProps {
  isActive?: boolean;
  isProcessing?: boolean;
}

interface Node {
  id: number;
  x: number;
  y: number;
  color: "emerald" | "cyan";
  pulsePhase: number;
  label: string;
}

// Node labels mapping
const NODE_LABELS: Record<number, string> = {
  0: "JANITOR",
  1: "VALIDATOR",
  2: "AUDITOR",
  3: "POLICY",
  4: "NARRATIVE",
  5: "INTELLIGENCE",
  6: "SYNTHESIS",
  7: "SENTINEL",
  8: "ORCHESTRATOR",
  9: "ANALYTICS",
  10: "OPTIMIZER",
  11: "STRATEGIST",
};

interface DataPacket {
  id: string;
  fromNode: number;
  toNode: number;
  progress: number; // 0 to 1
  color: "emerald" | "cyan";
}

export default function AgenticFlow({ isActive = true, isProcessing = false }: AgenticFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const nodesRef = useRef<Node[]>([]);
  const packetsRef = useRef<DataPacket[]>([]);
  const lastPacketTimeRef = useRef<number>(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Initialize 12 nodes in a grid pattern
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Create 12 nodes in a 4x3 grid
      const cols = 4;
      const rows = 3;
      const paddingX = canvas.width * 0.15;
      const paddingY = canvas.height * 0.15;
      const cellWidth = (canvas.width - paddingX * 2) / (cols - 1);
      const cellHeight = (canvas.height - paddingY * 2) / (rows - 1);

      nodesRef.current = [];
      for (let i = 0; i < 12; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        nodesRef.current.push({
          id: i,
          x: paddingX + col * cellWidth,
          y: paddingY + row * cellHeight,
          color: i % 2 === 0 ? "emerald" : "cyan",
          pulsePhase: Math.random() * Math.PI * 2,
          label: NODE_LABELS[i] || `NODE_${i}`,
        });
      }
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Mouse tracking for hover detection
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };

      // Check if hovering over a node
      const nodes = nodesRef.current;
      let foundNode: number | null = null;
      
      for (const node of nodes) {
        const dx = mousePosRef.current.x - node.x;
        const dy = mousePosRef.current.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 20) { // Hover radius
          foundNode = node.id;
          break;
        }
      }
      
      setHoveredNode(foundNode);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", () => setHoveredNode(null));

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", () => setHoveredNode(null));
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    
    // Adjust speed based on isProcessing
    const packetSpeed = isProcessing ? 800 : 2000; // Faster when processing
    const packetSpawnRate = isProcessing ? 800 : 2000; // More frequent when processing
    const lineBrightness = isProcessing ? 0.15 : 0.08; // Brighter when processing

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;
      const packets = packetsRef.current;

      // Update node pulse phases
      nodes.forEach((node) => {
        node.pulsePhase += (deltaTime / 1000) * 0.5; // Slow pulse
      });

      // Spawn new data packets periodically
      if (currentTime - lastPacketTimeRef.current > packetSpawnRate) {
        // Randomly select two nodes
        const fromNode = Math.floor(Math.random() * nodes.length);
        let toNode = Math.floor(Math.random() * nodes.length);
        while (toNode === fromNode) {
          toNode = Math.floor(Math.random() * nodes.length);
        }

        packets.push({
          id: `${Date.now()}-${Math.random()}`,
          fromNode,
          toNode,
          progress: 0,
          color: Math.random() > 0.5 ? "emerald" : "cyan",
        });

        lastPacketTimeRef.current = currentTime;
      }

      // Update packet positions
      packets.forEach((packet) => {
        packet.progress += deltaTime / packetSpeed;
        if (packet.progress >= 1) {
          // Remove completed packets
          const index = packets.indexOf(packet);
          if (index > -1) packets.splice(index, 1);
        }
      });

      // Draw connections (thin lines between nodes)
      ctx.strokeStyle = `rgba(16, 185, 129, ${lineBrightness})`;
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          // Only draw connections to nearby nodes
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < Math.min(canvas.width, canvas.height) * 0.4) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw data packets (moving dots)
      packets.forEach((packet) => {
        const fromNode = nodes[packet.fromNode];
        const toNode = nodes[packet.toNode];
        
        if (!fromNode || !toNode) return;

        const x = fromNode.x + (toNode.x - fromNode.x) * packet.progress;
        const y = fromNode.y + (toNode.y - fromNode.y) * packet.progress;

        const color = packet.color === "emerald" 
          ? "rgba(16, 185, 129, 0.8)" 
          : "rgba(6, 182, 212, 0.8)";

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 8);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw nodes (glowing circles)
      nodes.forEach((node) => {
        const pulse = Math.sin(node.pulsePhase) * 0.3 + 0.7; // 0.4 to 1.0
        const baseRadius = 6;
        const radius = baseRadius * pulse;

        const color = node.color === "emerald"
          ? "rgba(16, 185, 129, 0.9)"
          : "rgba(6, 182, 212, 0.9)";

        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, radius * 3
        );
        glowGradient.addColorStop(0, color);
        glowGradient.addColorStop(0.5, color.replace("0.9", "0.3"));
        glowGradient.addColorStop(1, "transparent");
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node circle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.arc(node.x - radius * 0.3, node.y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Draw node label on hover
        if (hoveredNode === node.id) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
          ctx.font = "8px 'JetBrains Mono', 'Courier New', monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          
          const labelText = `[NODE_${node.id}: ${node.label}]`;
          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = 10;
          
          // Background box
          ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
          ctx.fillRect(
            node.x - textWidth / 2 - 4,
            node.y + radius + 4,
            textWidth + 8,
            textHeight + 4
          );
          
          // Label text
          ctx.fillStyle = node.color === "emerald" 
            ? "rgba(16, 185, 129, 0.9)" 
            : "rgba(6, 182, 212, 0.9)";
          ctx.fillText(labelText, node.x, node.y + radius + 6);
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isProcessing]);

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ opacity: 0.6, cursor: hoveredNode !== null ? "pointer" : "default" }}
      />
    </div>
  );
}

