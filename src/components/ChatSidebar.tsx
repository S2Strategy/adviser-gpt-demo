import React, { useEffect, useMemo, useRef, useState } from "react";
import { Forward, Pencil, Archive, Trash } from "lucide-react";

type ChatItem = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string; // ISO
  unread?: boolean;
  pinned?: boolean;
  archived?: boolean;
};

type ChatSidebarProps = {
  items: ChatItem[];
  activeId?: string;
  onOpenChat: (id: string) => void;
  onShare: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  title?: string;
  className?: string;
};

export default function ChatSidebar({
  items,
  activeId,
  onOpenChat,
  onShare,
  onRename,
  onArchive,
  onDelete,
  title = "Chats",
  className = ""
}: ChatSidebarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");

  // Sort pinned to top; archived excluded
  const visible = useMemo(
    () => items.filter(i => !i.archived).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())),
    [items]
  );

  // Close menu on outside click / Esc
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!listRef.current) return;
      if (menuFor && !listRef.current.contains(e.target as Node)) setMenuFor(null);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuFor(null); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuFor]);

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMenuFor(id);
  };

  const handleStartRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameValue(currentTitle);
    setMenuFor(null); // Close the menu
  };

  const handleRenameSubmit = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSubmit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleRenameCancel();
    }
  };

  const handleKeyList = (e: React.KeyboardEvent) => {
    const focusables = Array.from(listRef.current?.querySelectorAll<HTMLDivElement>("[role='option']") ?? []);
    const idx = focusables.findIndex(el => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = focusables[Math.min(idx + 1, focusables.length - 1)] || focusables[0];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = focusables[Math.max(idx - 1, 0)] || focusables[focusables.length - 1];
      prev?.focus();
    } else if (e.key === "Enter") {
      const el = document.activeElement as HTMLDivElement | null;
      if (el?.dataset.id) onOpenChat(el.dataset.id);
    } else if ((e.shiftKey && e.key === "F10") || e.key === "ContextMenu") {
      const el = document.activeElement as HTMLDivElement | null;
      if (el?.dataset.id) setMenuFor(el.dataset.id);
    }
  };

  return (
    <div className={`flex flex-col min-w-0 w-full ${className}`}>
      <div
        ref={listRef}
        role="listbox"
        aria-label={`${title} conversations`}
        tabIndex={-1}
        onKeyDown={handleKeyList}
        className="flex-1 min-w-0"
      >
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map((item) => (
            <ChatRow
              key={item.id}
              item={item}
              active={item.id === activeId}
              openMenu={menuFor === item.id}
              isRenaming={renamingId === item.id}
              renameValue={renameValue}
              onOpen={() => onOpenChat(item.id)}
              onShowMenu={() => setMenuFor(item.id)}
              onHideMenu={() => setMenuFor(null)}
              onShare={() => onShare(item.id)}
              onStartRename={() => handleStartRename(item.id, item.title)}
              onRenameSubmit={handleRenameSubmit}
              onRenameCancel={handleRenameCancel}
              onRenameKeyDown={handleRenameKeyDown}
              onRenameValueChange={setRenameValue}
              onArchive={() => onArchive(item.id)}
              onDelete={() => onDelete(item.id)}
              onContextMenu={(e) => handleContextMenu(e, item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-4 text-center text-sm text-sidebar-foreground">
      No conversations yet.
    </div>
  );
}

function ChatRow({
  item,
  active,
  openMenu,
  isRenaming,
  renameValue,
  onOpen,
  onShowMenu,
  onHideMenu,
  onShare,
  onStartRename,
  onRenameSubmit,
  onRenameCancel,
  onRenameKeyDown,
  onRenameValueChange,
  onArchive,
  onDelete,
  onContextMenu
}: {
  item: ChatItem;
  active: boolean;
  openMenu: boolean;
  isRenaming: boolean;
  renameValue: string;
  onOpen: () => void;
  onShowMenu: () => void;
  onHideMenu: () => void;
  onShare: () => void;
  onStartRename: () => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onRenameKeyDown: (e: React.KeyboardEvent) => void;
  onRenameValueChange: (value: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div
      role="option"
      aria-selected={active}
      data-id={item.id}
      className={`
        group relative flex items-center cursor-pointer select-none gap-2 px-2 py-1 h-9
        hover:bg-sidebar-primary/5 transition-colors outline-none w-full hover:border-gray-200 rounded-md ${
        active 
          ? "bg-sidebar-primary/10"
          : ""
      }`}
      onDoubleClick={onOpen}
      onClick={onOpen}
      onContextMenu={onContextMenu}
      tabIndex={0}
    >
      <div className="min-w-0 flex-1 flex items-center overflow-hidden transition">
        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => onRenameValueChange(e.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onRenameSubmit}
            className="w-full text-sm tracking-[-0.2px] h-7 text-sidebar-foreground rounded-sm px-1 bg-sidebar-primary/10 border-none outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={`truncate text-sm ${item.unread ? "font-semibold" : ""} text-sidebar-foreground/80 hover:text-sidebar-foreground tracking-[-0.2px] transition-colors w-full`}>
            {item.title || "Untitled chat"}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-start gap-1">
        <time className="mt-0.5 text-xs text-sidebar-foreground/60 whitespace-nowrap" dateTime={item.updatedAt}>
          {formatRelative(item.updatedAt)}
        </time>
        <button
          ref={buttonRef}
          className="
            -m-1 ml-1 inline-flex h-7 w-7 items-center justify-center rounded
            text-sidebar-foreground/60 opacity-0 transition-all duration-150
            group-hover:opacity-100 group-focus-within:opacity-100
            hover:bg-sidebar-primary/10 focus:bg-sidebar-primary/20 focus:outline-none
            hover:text-sidebar-foreground focus:text-sidebar-foreground
          "
          aria-haspopup="menu"
          aria-expanded={openMenu}
          aria-label="Open chat menu"
          onClick={(e) => {
            e.stopPropagation();
            openMenu ? onHideMenu() : onShowMenu();
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 8a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm5 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>
          </svg>
        </button>
      </div>

      {/* Menu */}
      {openMenu && (
        <Menu
          open={openMenu}
          onClose={onHideMenu}
          onShare={(e) => { e.stopPropagation(); onShare(); }}
          onRename={(e) => { e.stopPropagation(); onStartRename(); }}
          onArchive={(e) => { e.stopPropagation(); onArchive(); }}
          onDelete={(e) => { e.stopPropagation(); onDelete(); }}
          buttonRef={buttonRef}
        />
      )}
    </div>
  );
}

function Menu({
  open,
  onClose,
  onShare,
  onRename,
  onArchive,
  onDelete,
  buttonRef
}: {
  open: boolean;
  onClose: () => void;
  onShare: (e: React.MouseEvent) => void;
  onRename: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    
    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    
    // Position menu just below the button, aligned to the right edge
    setPosition({
      top: rect.bottom + 4, // 4px gap below button
      right: window.innerWidth - rect.right // Align to right edge of button
    });

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, buttonRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Chat options"
      className="
        fixed z-[9999] w-36 rounded-md border border-[#E4E4E7] bg-background p-1 shadow-lg
      "
      style={{
        top: `${position.top}px`,
        right: `${position.right}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-primary/10 focus:bg-sidebar-primary/10">
        <Forward className="w-3 h-3 text-sidebar-foreground" />
        <span onClick={onShare}>Share</span>
      </button>
      <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-primary/10 focus:bg-sidebar-primary/10">
        <Pencil className="w-3 h-3 text-sidebar-foreground" />
        <span onClick={onRename}>Rename</span>
      </button>
      <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-primary/10 focus:bg-sidebar-primary/10">
        <Archive className="w-3 h-3 text-sidebar-foreground" />
        <span onClick={onArchive}>Archive</span>
      </button>
      <button role="menuitem" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50">
        <Trash className="w-3 h-3 text-red-600" />
        <span onClick={onDelete}>Delete</span>
      </button>
    </div>
  );
}

// util
function formatRelative(iso: string): string {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - d);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  return `${years}y`;
}
