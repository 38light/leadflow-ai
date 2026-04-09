"use client";

import { cn } from "@/lib/utils";
import { UploadCloud } from "lucide-react";
import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from "react";

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

export function FileUpload({
  onUpload,
  accept,
  multiple = false,
  maxSize,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndUpload = useCallback(
    (files: File[]) => {
      setError(null);

      if (maxSize) {
        const oversized = files.find((f) => f.size > maxSize * 1024 * 1024);
        if (oversized) {
          setError(`File "${oversized.name}" exceeds ${maxSize}MB limit.`);
          return;
        }
      }

      if (files.length > 0) {
        onUpload(files);
      }
    },
    [maxSize, onUpload]
  );

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    validateAndUpload(multiple ? files : files.slice(0, 1));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    validateAndUpload(files);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition-colors",
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        )}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <UploadCloud className="mb-3 h-10 w-10 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">
          Drag and drop {multiple ? "files" : "a file"} here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {accept ? `Accepted formats: ${accept}` : "Any file type"}
          {maxSize ? ` (max ${maxSize}MB)` : ""}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        aria-label="File upload"
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
