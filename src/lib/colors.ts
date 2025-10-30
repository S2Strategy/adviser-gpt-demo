// Centralized color configuration for highlighting system
// Change these values to update colors across the entire application

export const HIGHLIGHT_COLORS = {
  // AI-generated content colors
  ai: {
    background: 'bg-yellow-100',
    border: 'border-yellow-300',
    hover: 'hover:bg-yellow-200',
    text: 'text-sidebar-accent',
    accent: 'text-sidebar-accent/90',
    indicator: 'bg-sidebar-accent', // For legend dots/bars
    underline: 'decoration-sidebar-accent', // If we ever need AI underlines
    underlineHover: 'hover:decoration-sidebar-accent/50',
  },
  
  // Vault source content colors
  vault: {
    background: 'bg-primary/5',
    border: 'border-primary/50',
    hover: 'hover:bg-primary/40',
    text: 'text-foreground',
    accent: 'text-accent',
    indicator: 'bg-accent', // For legend dots/bars
    underline: 'decoration-foreground/40',
    underlineHover: 'hover:decoration-accent',
  }
} as const;

// Helper function to get source number color
export const getSourceNumberColor = (sourceIndex: number) => {
  const colors = [
    'bg-accent', 'bg-accent/90', 'bg-accent/80', 'bg-accent/70',
    'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700', 'bg-indigo-800',
    'bg-purple-500', 'bg-purple-600', 'bg-purple-700', 'bg-purple-800'
  ];
  return colors[sourceIndex % colors.length];
};
