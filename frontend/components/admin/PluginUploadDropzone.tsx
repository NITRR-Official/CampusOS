'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileArchive,
  Link as LinkIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button, Input, Label, useToast } from '@campusos/design-system';
import { apiClient } from '@campus-os/shared/api-client';

interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  capabilities?: string[];
  [key: string]: unknown;
}

interface InstallResponse {
  success: boolean;
  message?: string;
  plugin?: PluginManifest;
  error?: string;
}

interface PluginUploadDropzoneProps {
  onInstalled?: (plugin: PluginManifest) => void;
  className?: string;
}

export function PluginUploadDropzone({
  onInstalled,
  className = ''
}: PluginUploadDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [packageUrl, setPackageUrl] = useState('');
  const [forceOverwrite, setForceOverwrite] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('Only .zip archive packages are supported.');
      return;
    }

    // 50MB max file size
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage('Archive file size exceeds the 50MB maximum limit.');
      return;
    }

    setSelectedFile(file);
    setPackageUrl(''); // Reset remote URL if local file selected
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleInstall = async () => {
    if (!selectedFile && !packageUrl.trim()) {
      setErrorMessage('Please select a .zip archive or provide a package URL.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let response: InstallResponse;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (forceOverwrite) {
          formData.append('force', 'true');
        }

        response = await apiClient.postForm<InstallResponse>(
          '/plugins/install',
          formData
        );
      } else {
        response = await apiClient.post<InstallResponse>('/plugins/install', {
          packageUrl: packageUrl.trim(),
          force: forceOverwrite
        });
      }

      if (response && response.success && response.plugin) {
        const plugin = response.plugin;
        const msg = `Plugin "${plugin.name}" (v${plugin.version}) installed successfully!`;
        setSuccessMessage(msg);
        toast({
          title: 'Plugin Installed',
          description: msg
        });

        // Reset inputs
        handleClearFile();
        setPackageUrl('');

        onInstalled?.(plugin);
      } else {
        throw new Error(response?.error || 'Installation failed');
      }
    } catch (err: unknown) {
      const errorText =
        err instanceof Error ? err.message : 'Failed to install plugin package';
      setErrorMessage(errorText);
      toast({
        title: 'Installation Failed',
        description: errorText,
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : selectedFile
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-border/60 hover:border-border hover:bg-muted/30 bg-card/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={handleFileChange}
          className="hidden"
          id="plugin-file-upload"
          disabled={uploading}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FileArchive className="size-6" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearFile}
              disabled={uploading}
              className="mt-2 text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3 mr-1" />
              Remove file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3 cursor-pointer">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <UploadCloud className="size-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drag and drop your plugin archive here, or{' '}
                <label
                  htmlFor="plugin-file-upload"
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  browse files
                </label>
              </p>
              <p className="text-xs text-muted-foreground">
                Accepts signed or community `.zip` packages up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Or Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-border/60 w-full" />
        <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
          Or install from URL
        </span>
        <div className="border-t border-border/60 w-full" />
      </div>

      {/* Remote URL Input */}
      <div className="space-y-2">
        <Label htmlFor="package-url" className="text-xs font-medium">
          GitHub Release Archive or Direct ZIP URL
        </Label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            id="package-url"
            type="text"
            placeholder="e.g. https://github.com/owner/repo or owner/repo"
            value={packageUrl}
            onChange={(e) => {
              setPackageUrl(e.target.value);
              if (selectedFile) handleClearFile();
            }}
            disabled={uploading}
            className="pl-9 text-sm"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Supports GitHub release archives, repository main branches (e.g.
          `NITRR-Official/CampusOS-Plugin`), or direct HTTPS download links.
        </p>
      </div>

      {/* Overwrite Option */}
      <div className="flex items-center space-x-2 pt-1">
        <input
          type="checkbox"
          id="force-overwrite"
          checked={forceOverwrite}
          onChange={(e) => setForceOverwrite(e.target.checked)}
          disabled={uploading}
          className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
        <Label
          htmlFor="force-overwrite"
          className="text-xs text-muted-foreground cursor-pointer font-normal"
        >
          Overwrite plugin files if already installed (force reinstall)
        </Label>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div className="p-3.5 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2.5 text-xs">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5 text-xs">
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleInstall}
          disabled={uploading || (!selectedFile && !packageUrl.trim())}
          className="w-full sm:w-auto px-6"
        >
          {uploading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Validating & Installing...
            </>
          ) : (
            <>
              <UploadCloud className="size-4 mr-2" />
              Install Plugin
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default PluginUploadDropzone;
