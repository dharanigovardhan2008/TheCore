"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

interface LogoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export default function LogoUpload({ value, onChange }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be smaller than 5 MB.");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload PNG, JPG, WEBP, or SVG.");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // 1. Get auth parameters
      const authRes = await fetch("/api/imagekit/auth");
      if (!authRes.ok) throw new Error("Authentication failed");
      const authData = await authRes.json();

      if (authData.error) throw new Error(authData.error);

      // 2. Upload to ImageKit
      const formData = new FormData();
      formData.append("file", file);
      formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
      formData.append("signature", authData.signature);
      formData.append("expire", authData.expire.toString());
      formData.append("token", authData.token);
      formData.append("folder", "/project-logos");
      formData.append("fileName", `project-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await uploadRes.json();
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload logo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-1">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp,.svg"
        className="hidden"
      />

      {value ? (
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white border border-[var(--border-light)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
          <img src={value} alt="Logo" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-white hover:scale-110 transition-transform p-1"
              disabled={isUploading}
              title="Change"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="text-red-400 hover:text-red-300 hover:scale-110 transition-transform p-1"
              disabled={isUploading}
              title="Remove"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex flex-col items-center justify-center border border-dashed border-[var(--border-color)] hover:border-[var(--color-primary)] bg-[var(--bg-page)] hover:bg-[var(--color-primary-light)] shadow-sm transition-premium cursor-pointer group relative"
        >
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" /> : (
            <>
              <div className="w-10 h-10 rounded-full bg-[var(--bg-surface-tint)] group-hover:bg-white flex items-center justify-center mb-2 shadow-sm transition-colors">
                <ImageIcon className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-[var(--color-primary)] transition-colors" />
              </div>
              <span className="text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-[var(--color-primary)]">Logo</span>
            </>
          )}
        </div>
      )}

      {error && <p className="text-[var(--color-danger)] text-xs mt-2 font-medium max-w-[112px] text-center leading-tight">{error}</p>}
    </div>
  );
}
