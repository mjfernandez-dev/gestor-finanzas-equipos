"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface SharedFile {
  file: File;
  url: string;
}

export function useSharedFiles() {
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function handleSharedFiles() {
      const params = new URLSearchParams(window.location.search);
      const hasFiles = params.has("file") || params.has("files");

      if (!hasFiles) return;

      setIsProcessing(true);

      try {
        const files: SharedFile[] = [];
        
        for (let i = 0; i < 10; i++) {
          const key = `shared_file_${i}`;
          const fileData = sessionStorage.getItem(key);
          if (fileData) {
            const blob = await fetch(fileData).then((r) => r.blob());
            const type = blob.type || "image/jpeg";
            const ext = type.split("/")[1] || "jpg";
            const file = new File([blob], `comprobante.${ext}`, { type });
            files.push({
              file,
              url: URL.createObjectURL(blob),
            });
            sessionStorage.removeItem(key);
          }
        }
        
        if (files.length > 0) {
          setSharedFiles(files);
        }

        window.history.replaceState({}, "", "/dashboard");
      } catch (error) {
        console.error("Error processing shared files:", error);
      } finally {
        setIsProcessing(false);
      }
    }

    if (typeof window !== "undefined") {
      handleSharedFiles();
    }
  }, []);

  const clearSharedFiles = () => {
    sharedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    setSharedFiles([]);
  };

  return { sharedFiles, isProcessing, clearSharedFiles };
}

export function SharedFilesHandler() {
  const { sharedFiles, isProcessing, clearSharedFiles } = useSharedFiles();

  useEffect(() => {
    if (sharedFiles.length > 0 && typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("files-shared", { detail: sharedFiles })
      );
    }
  }, [sharedFiles]);

  return null;
}
