import React, { useEffect, useRef } from 'react';
import './SpiderManBackground.css';

const SpiderManBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let spidermanX = 0;
    let spidermanY = 0;
    let velocityX = 2;
    let velocityY = 1;
    let webPoints = [];
    let lastWebPoint = null;

    // Spider-Man image
    const spidermanImg = new Image();
    spidermanImg.src = '/spiderman.svg'; // Updated to use SVG

    // Building positions
    const buildings = [
      { x: 100, y: 300, width: 200, height: 400 },
      { x: 400, y: 200, width: 150, height: 500 },
      { x: 700, y: 250, width: 180, height: 450 },
      { x: 1000, y: 180, width: 220, height: 520 },
    ];

    const drawBuilding = (building) => {
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(building.x, building.y, building.width, building.height);
      
      // Add windows
      ctx.fillStyle = '#34495e';
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 8; j++) {
          if (Math.random() > 0.3) { // Random lit windows
            ctx.fillRect(
              building.x + 20 + j * 20,
              building.y + 20 + i * 30,
              10,
              15
            );
          }
        }
      }
    };

    const drawWeb = (startX, startY, endX, endY) => {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Create a curved web line
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const controlX = midX + (Math.random() - 0.5) * 50;
      const controlY = midY + (Math.random() - 0.5) * 50;
      
      ctx.quadraticCurveTo(controlX, controlY, endX, endY);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw buildings
      buildings.forEach(drawBuilding);

      // Draw webs
      webPoints.forEach((point, index) => {
        if (index > 0) {
          drawWeb(
            webPoints[index - 1].x,
            webPoints[index - 1].y,
            point.x,
            point.y
          );
        }
      });

      // Update Spider-Man position
      spidermanX += velocityX;
      spidermanY += velocityY;

      // Bounce off walls
      if (spidermanX > canvas.width - 50 || spidermanX < 0) {
        velocityX *= -1;
      }
      if (spidermanY > canvas.height - 50 || spidermanY < 0) {
        velocityY *= -1;
      }

      // Draw Spider-Man
      ctx.drawImage(spidermanImg, spidermanX, spidermanY, 50, 50);

      // Add web points
      if (lastWebPoint === null || 
          Math.hypot(spidermanX - lastWebPoint.x, spidermanY - lastWebPoint.y) > 100) {
        webPoints.push({ x: spidermanX + 25, y: spidermanY + 25 });
        lastWebPoint = { x: spidermanX + 25, y: spidermanY + 25 };
        
        // Keep only last 10 web points
        if (webPoints.length > 10) {
          webPoints.shift();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="spiderman-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
      }}
    />
  );
};

export default SpiderManBackground; 