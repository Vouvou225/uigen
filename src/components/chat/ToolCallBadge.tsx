"use client";

import { Loader2, FilePlus, FilePen, FileSearch, FileX, FileInput, Undo2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
}

function getLabel(toolName: string, args: Record<string, unknown>): { icon: React.ReactNode; text: string } {
  const path = typeof args.path === "string" ? args.path : "";
  const filename = path.split("/").filter(Boolean).pop() ?? path;
  const command = args.command;

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return { icon: <FilePlus className="w-3 h-3" />, text: `Creating ${filename}` };
      case "str_replace":
      case "insert":
        return { icon: <FilePen className="w-3 h-3" />, text: `Editing ${filename}` };
      case "view":
        return { icon: <FileSearch className="w-3 h-3" />, text: `Reading ${filename}` };
      case "undo_edit":
        return { icon: <Undo2 className="w-3 h-3" />, text: `Undoing edit in ${filename}` };
    }
  }

  if (toolName === "file_manager") {
    const newPath = typeof args.new_path === "string" ? args.new_path : "";
    const newFilename = newPath.split("/").filter(Boolean).pop() ?? newPath;
    switch (command) {
      case "rename":
        return { icon: <FileInput className="w-3 h-3" />, text: `Renaming ${filename} to ${newFilename}` };
      case "delete":
        return { icon: <FileX className="w-3 h-3" />, text: `Deleting ${filename}` };
    }
  }

  return { icon: <FilePen className="w-3 h-3" />, text: toolName };
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const done = state === "result";
  const { icon, text } = getLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {done ? (
        <div className="text-emerald-500">{icon}</div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
