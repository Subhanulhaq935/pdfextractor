"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/lib/api";
import { DocumentItem } from "@/lib/types";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<DocumentItem[]>("/documents");
      setDocuments(res.data);
    } catch (err) {
      if (!silent) toast.error(getErrorMessage(err, "Failed to load documents"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll automatically while any document is still processing
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === "processing" || doc.status === "uploaded"
    );
    if (!hasProcessing) return;

    const timer = setInterval(() => {
      fetchDocuments(true);
    }, 3000);
    return () => clearInterval(timer);
  }, [documents, fetchDocuments]);

  const uploadDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await api.post<DocumentItem>("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`"${res.data.filename}" uploaded!`);
      await fetchDocuments(true);
      return res.data;
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload PDF"));
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      toast.success("Document deleted");
      return true;
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete document"));
      return false;
    }
  };

  return { documents, loading, uploading, uploadDocument, deleteDocument, fetchDocuments };
}
