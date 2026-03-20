import React from "react";

// Helper for cleaner React.createElement calls
export const h = (type, props, ...children) => {
  return React.createElement(type, props, ...children.flat());
};
