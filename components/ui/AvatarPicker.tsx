"use client";

import React, { useState, useRef } from "react";
import { Upload, X, Check, Sparkles, Camera } from "lucide-react";

// List of all 20 premium 3D avatars available in public/avatars/
export const DEFAULT_AVATARS = Array.from({ length: 20 }, (_, i) => `/avatars/avatar-${String(i + 1).padStart(2, '0')}.png`);

interface AvatarPickerProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  nameFallback?: string;
  variant?: "default" | "compact";
}

export default function AvatarPicker({
  value,
  onChange,
  label = "Profile Photo",
  nameFallback = "User",
  variant = "default",
}: AvatarPickerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5 MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      // First try ImageKit if available, otherwise fallback to compressed FileReader base64
      let uploadedUrl: string | null = null;
      try {
        const authRes = await fetch("/api/imagekit/auth");
        if (authRes.ok) {
          const authData = await authRes.json();
          if (!authData.error) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("publicKey", process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "");
            formData.append("signature", authData.signature);
            formData.append("expire", authData.expire.toString());
            formData.append("token", authData.token);
            formData.append("folder", "/profile-avatars");
            formData.append("fileName", `avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`);

            const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
              method: "POST",
              body: formData,
            });

            if (uploadRes.ok) {
              const resJson = await uploadRes.json();
              if (resJson.url) {
                uploadedUrl = resJson.url;
              }
            }
          }
        }
      } catch {
        // Fallback to FileReader
      }

      if (!uploadedUrl) {
        // Safe reliable fallback: convert to base64 Data URL
        uploadedUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      onChange(uploadedUrl);
    } catch (err: unknown) {
      setUploadError((err as Error)?.message || "Failed to process image.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const currentAvatar = value || DEFAULT_AVATARS[0];

  if (variant === "compact") {
    return (
      <div className="space-y-3">
        {label && (
          <label className="block text-sm font-semibold text-[var(--text-primary)]">
            {label}
          </label>
        )}

        <div className="flex items-start gap-6">
          {/* Avatar Preview */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-[var(--border-light)]">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt="Profile avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                  {nameFallback?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 p-2 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-colors cursor-pointer">
              <Camera className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleCustomUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          {/* Avatar Actions */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Choose Avatar
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCustomUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Choose from 20 premium 3D avatars or upload your own image (max 5MB)
            </p>

            {uploadError && (
              <p className="text-xs text-rose-500 font-medium">{uploadError}</p>
            )}
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleCustomUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-[#172B2A]">
          {label}
        </label>
      )}

      {/* Main Avatar Preview & Actions Row */}
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-[#DCE9E3] shadow-xs">
        <div className="relative group shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden border-2 border-blue-500/40 shadow-sm bg-slate-100 flex items-center justify-center">
            {value ? (
              <img
                src={value}
                alt="Selected avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center text-xl font-bold uppercase">
                {nameFallback?.charAt(0) || "U"}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload custom photo"
            aria-label="Upload custom photo"
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-transform active:scale-90"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/70 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Choose 3D Avatar
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              {isUploading ? "Uploading..." : "Upload Photo"}
            </button>

            {value && (
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-xs text-slate-400 hover:text-rose-500 transition-colors p-1"
                title="Remove photo"
              >
                Clear
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500 truncate">
            Pick from 20 premium 3D avatars or upload your custom image.
          </p>

          {uploadError && (
            <p className="text-xs text-rose-500 font-medium">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleCustomUpload}
        className="hidden"
      />

      {/* Full 20-Avatar Gallery Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border border-[#DCE9E3] max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-[#DCE9E3] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172B2A] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Select Your 3D Avatar
                </h3>
                <p className="text-xs text-[#647570] mt-0.5">
                  Choose from 20 premium 3D character avatars
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Avatars Grid */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 sm:gap-4">
              {DEFAULT_AVATARS.map((avatarPath, index) => {
                const isSelected = value === avatarPath;
                return (
                  <button
                    key={avatarPath}
                    type="button"
                    onClick={() => {
                      onChange(avatarPath);
                      setIsModalOpen(false);
                    }}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-500/40 scale-105 shadow-md bg-blue-50"
                        : "border-transparent hover:border-slate-300 hover:scale-105 bg-slate-50"
                    }`}
                  >
                    <img
                      src={avatarPath}
                      alt={`Avatar option ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-blue-600/35 rounded-xl flex items-center justify-center">
                        <Check className="w-5 h-5 text-white stroke-[3] drop-shadow-sm" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#DCE9E3] bg-[#F4FAF7] flex items-center justify-between">
              <span className="text-xs text-[#647570]">
                20 premium avatars available
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

