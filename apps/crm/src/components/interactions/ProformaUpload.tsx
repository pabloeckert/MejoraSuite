import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Image, X, Eye } from "lucide-react";

interface ProformaUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE_MB = 10;

export function ProformaUpload({ value, onChange, file, onFileChange }: ProformaUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSet = useCallback((f: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError("Formato no válido. Usá JPG, PNG, WebP o PDF.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_SIZE_MB}MB.`);
      return;
    }
    onFileChange(f);
    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
    // Create object URL for the file
    const url = URL.createObjectURL(f);
    onChange(url);
  }, [onChange, onFileChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) validateAndSet(f);
  }, [validateAndSet]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) validateAndSet(f);
  }, [validateAndSet]);

  const handleRemove = () => {
    onFileChange(null);
    onChange(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const FileIcon = file?.type === "application/pdf" ? FileText : Image;

  if (file || value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20">
          <FileIcon className="h-8 w-8 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{file?.name || "Proforma adjunta"}</p>
            {file && <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>}
          </div>
          <div className="flex gap-1">
            {preview && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(value!, "_blank")}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {preview && (
          <div className="rounded-lg border overflow-hidden max-h-48">
            <img src={preview} alt="Preview proforma" className="w-full h-full object-contain" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
          dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20"
        }`}
      >
        <Upload className={`h-6 w-6 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
        <div className="text-center">
          <p className="text-sm font-medium">Arrastrá la proforma acá</p>
          <p className="text-xs text-muted-foreground mt-0.5">o hacé clic para seleccionar</p>
          <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP o PDF · Máx. {MAX_SIZE_MB}MB</p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        onChange={handleSelect}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
