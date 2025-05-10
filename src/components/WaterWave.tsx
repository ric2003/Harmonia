"use client";
import { useMemo } from "react";
import { DropletOff } from "lucide-react";

export default function WaterWave({ 
  fillPercentage = 0, 
  showBadge = true, 
  badgePosition = "bottom-right",
  className = "",
  waveColor = {
    top: "#9BE6FF",
    bottom: "#003F8A"
  }
}) {
  // Ensure percentage is between 0-100
  const percent = useMemo(() => {
    return Math.min(Math.max(fillPercentage, 0), 100);
  }, [fillPercentage]);

  // Helper to pick a gradient based on fill %
  const getBadgeGradient = (percent: number) => {
    if (percent > 70)
      return "bg-gradient-to-r from-green-500 to-green-400";
    if (percent > 40)
      return "bg-gradient-to-r from-yellow-500 to-yellow-400";
    if (percent > 20)
      return "bg-gradient-to-r from-orange-500 to-orange-400";
    return "bg-gradient-to-r from-red-500 to-red-400";
  };

  // Calculate badge position classes
  const getBadgePositionClass = () => {
    switch (badgePosition) {
      case "bottom-right": return "bottom-2 right-2";
      case "bottom-left": return "bottom-2 left-2";
      case "top-right": return "top-2 right-2";
      case "top-left": return "top-2 left-2";
      default: return "bottom-2 right-2";
    }
  };

  const badgeClass = getBadgeGradient(percent);
  const badgePositionClass = getBadgePositionClass();
  
  // Check if we should show empty state
  const isEmpty = percent === 0;

  return (
    <div className={`w-full bg-sky-50 rounded relative overflow-hidden aspect-video ${className}`}>
      {/* Enhanced dam floor background */}
      <div className="absolute inset-0 bg-blue-50 dark:bg-blue-100" />
      
      {/* Empty state icon */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <DropletOff size={48} strokeWidth={1.5} className="opacity-40" />
        </div>
      )}

      <div
        className="water-layer"
        /* add the crest height so 100 % truly reaches the rim */
        style={{ height: `calc(${percent * 1.95}%)` }}
      >
        {/* 2-copy SVG, wavelength 80 px, amplitude 8 px */}
        <svg
          shapeRendering="crispEdges"
          className="water-svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient
              id="waterGrad"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={waveColor.top}
              />
              <stop
                offset="100%"
                stopColor={waveColor.bottom}
              />
            </linearGradient>
          </defs>

          <g className="waveGroup">
            <path
              d="M0 60 
                 Q 40 59 80 60 T160 60 T240 60 T320 60 T400 60 T480 60 T560 60 T640 60
                 T720 60 T800 60 T880 60 T960 60 T1040 60 T1120 60 T1200 60
                 L1200 120 L0 120 Z"
              fill="url(#waterGrad)"
            />
            <path
              d="M0 60 
                 Q 40 59 80 60 T160 60 T240 60 T320 60 T400 60 T480 60 T560 60 T640 60
                 T720 60 T800 60 T880 60 T960 60 T1040 60 T1120 60 T1200 60
                 L1200 120 L0 120 Z"
              fill="url(#waterGrad)"
              transform="translate(1200,0)"
            />
          </g>
        </svg>

        {/* shimmer */}
        <div className="water-noise" />
      </div>

      {/* Percentage badge */}
      {showBadge && (
        <div
          className={`absolute ${badgePositionClass} text-white px-2 py-1 rounded text-sm ${badgeClass}`}
        >
          {percent.toFixed(0)}%
        </div>
      )}

      {/* COMPONENT CSS */}
      <style jsx>{`
        .water-layer {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          overflow: hidden;
          transition: height 0.7s ease-in-out;
        }

        .water-svg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 100%;
        }

        .waveGroup {
          animation: waveShift 2s linear infinite;
        }

        @keyframes waveShift {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-323px); /* width of one copy */
          }
        }

        .water-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.05;
          background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAQCAYAAADJViUEAAAAsElEQVR4nGP8//8/AyWAiYFRQVHPxMDAwMDA+P///0xMTNTU1LwGBgcH4+vr66uLi8kLCwsbGxq5ubm8A/QPj59+/fZ6enp8wcHBy2tLSQkpJiYmLu4+NDQ0CA4ODqampg5ubm56eHhFRUVLSwt7e3t/f39Hh4eEhIS8fHxNzExU1NToKKihkYGIGBgYEBHz6AMP37t0zMzHR0NBISEhAwMDP/h3SkpKDExMVFRUbS0tJkZGT///8JiISHiCQDmMXC1Wv/e8QAAAABJRU5ErkJggg==")
            repeat;
          animation: noiseDrift 0.35s steps(2) infinite;
        }

        @keyframes noiseDrift {
          0% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(2%, 2%);
          }
          100% {
            transform: translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
}