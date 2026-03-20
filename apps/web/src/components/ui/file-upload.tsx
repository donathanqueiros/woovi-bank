import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, X, File as FileIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type FileUploadProps = {
  accept?: string;
  maxSizeBytes?: number;
  value?: File | null;
  onChange?: (file: File | null) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  "aria-describedby"?: string;
};

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUpload({
  accept = "image/jpeg,image/png,application/pdf",
  maxSizeBytes = DEFAULT_MAX_SIZE,
  value,
  onChange,
  error,
  disabled,
  className,
  "aria-describedby": ariaDescribedBy,
}: FileUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const activeFile = value ?? null;
  const imagePreviewUrl = useMemo(() => {
    if (!activeFile?.type.startsWith("image/")) return null;
    return URL.createObjectURL(activeFile);
  }, [activeFile]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const validate = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return t("kyc.validation.fileTypeInvalid");
      }
      if (file.size > maxSizeBytes) {
        return t("kyc.validation.fileTooLarge");
      }
      return null;
    },
    [maxSizeBytes, t],
  );

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validate(file);
      if (validationError) {
        setLocalError(validationError);
        onChange?.(null);
        return;
      }
      setLocalError(null);
      onChange?.(file);
    },
    [onChange, validate],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      void processFile(file);
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (!file) return;
      void processFile(file);
    },
    [disabled, processFile],
  );

  const handleClear = useCallback(() => {
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange?.(null);
  }, [onChange]);

  const displayError = error ?? localError;
  const hasFile = Boolean(activeFile);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-describedby={ariaDescribedBy}
        aria-invalid={Boolean(displayError)}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex min-h-30 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragging
            ? "border-primary/60 bg-primary/5"
            : "border-input hover:border-ring/50 hover:bg-muted/40",
          displayError && "border-destructive/60 bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          hasFile && "border-(--success)/60 bg-(--success)/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleChange}
          className="sr-only"
          aria-hidden="true"
        />

        {hasFile && activeFile ? (
          <div className="flex w-full items-center gap-3">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt={activeFile.name}
                className="size-12 shrink-0 rounded-md object-cover"
              />
            ) : (
              <FileIcon className="size-8 shrink-0 text-(--success)" />
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">
                {activeFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(activeFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="ml-auto shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-label="Remover arquivo"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud
              className={cn(
                "size-8",
                displayError ? "text-destructive" : "text-muted-foreground",
              )}
            />
            <div>
              <p className="text-sm font-medium text-foreground">
                Arraste e solte ou{" "}
                <span className="text-primary underline">selecione um arquivo</span>
              </p>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, PNG — máx. {formatBytes(maxSizeBytes)}
              </p>
            </div>
          </>
        )}
      </div>

      {displayError && (
        <p role="alert" className="text-xs text-destructive">
          {displayError}
        </p>
      )}
    </div>
  );
}

export { FileUpload };
