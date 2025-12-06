import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDocuments } from '@/lib/api/hooks';
import { Document } from '@/app/data/document';

/**
 * Hook to manage document actions (view, download, delete)
 */
export function useDocumentActions() {
  const router = useRouter();
  const { delete: deleteDocument, service } = useDocuments();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  const handleViewDocument = useCallback((docId: number | undefined) => {
    if (docId) {
      router.push(`/documents/${docId}`);
    }
  }, [router]);

  const handleDownloadDocument = useCallback((docId: number | undefined) => {
    if (docId) {
      const downloadUrl = service.getDownloadUrl(docId);
      window.open(downloadUrl, '_blank');
    }
  }, [service]);

  const handleDeleteDocument = useCallback(async (docId: number | undefined, refetchDocuments: () => Promise<void>) => {
    if (!docId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this document? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingDocId(docId);
      await deleteDocument(docId);
      await refetchDocuments();
      // Clear selection if deleted document was selected
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setDeletingDocId(null);
    }
  }, [deleteDocument, selectedDocument]);

  const handleRowClick = useCallback((doc: Document) => {
    if (doc?.id) {
      setSelectedDocument(doc);
    }
  }, []);

  return {
    selectedDocument,
    deletingDocId,
    handleViewDocument,
    handleDownloadDocument,
    handleDeleteDocument,
    handleRowClick,
  };
}

