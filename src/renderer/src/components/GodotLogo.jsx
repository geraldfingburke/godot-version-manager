import React from 'react';

/**
 * Renders three cascaded official Godot mascot logos down and to the right
 */
export default function GodotLogo({ className = "w-12 h-12" }) {
  return (
    <div className={`relative ${className} select-none shrink-0`}>
      <img
        src="/cascading_logo.svg"
        alt="Godot Version Manager Cascading Logo"
        className="w-full h-full drop-shadow-md object-contain"
      />
    </div>
  );
}
