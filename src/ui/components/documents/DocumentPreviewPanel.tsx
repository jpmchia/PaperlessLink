import React, { memo } from 'react';
import { Document } from "@/app/data/document";
import { Badge } from "@/ui/components/Badge";
import { IconButton } from "@/ui/components/IconButton";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { FeatherFileText, FeatherDownload, FeatherEye, FeatherMoreHorizontal, FeatherShare2, FeatherTrash } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { formatDate } from './documentUtils';

interface DocumentPreviewPanelProps {
  document: Document | null;
  documentTypeName: string;
  correspondentName: string;
  tagNames: Map<number, string>;
  onView: (docId: number | undefined) => void;
  onDownload: (docId: number | undefined) => void;
}

export const DocumentPreviewPanel = memo<DocumentPreviewPanelProps>(({
  document,
  documentTypeName,
  correspondentName,
  tagNames,
  onView,
  onDownload,
}) => {
  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full px-4 py-8">
        <FeatherFileText className="text-heading-1 font-heading-1 text-subtext-color mb-2" />
        <span className="text-body font-body text-subtext-color text-center">
          Select a document to view details
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full px-4 py-4 gap-4">
      <div className="flex w-full items-center justify-between">
        <div className="flex flex-col items-start">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {document.title || document.original_file_name || `Document ${document.id}`}
          </span>
          <span className="text-caption font-caption text-subtext-color">
            {formatDate(document.modified || document.created)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <IconButton
            variant="neutral-secondary"
            icon={<FeatherDownload />}
            onClick={() => onDownload(document.id)}
          />
          <IconButton
            variant="neutral-secondary"
            icon={<FeatherEye />}
            onClick={() => onView(document.id)}
          />
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <IconButton
                variant="neutral-secondary"
                icon={<FeatherMoreHorizontal />}
              />
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="end"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                    Share
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                    Delete
                  </DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4 w-full">
        <div className="flex flex-col items-start gap-2 w-full">
          <span className="text-caption-bold font-caption-bold text-subtext-color">Category</span>
          {document.document_type ? (
            <Badge variant="neutral">{documentTypeName}</Badge>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 w-full">
          <span className="text-caption-bold font-caption-bold text-subtext-color">Correspondent</span>
          <span className="text-body font-body text-default-font">
            {correspondentName || "—"}
          </span>
        </div>

        <div className="flex flex-col items-start gap-2 w-full">
          <span className="text-caption-bold font-caption-bold text-subtext-color">Tags</span>
          <div className="flex items-center gap-1 flex-wrap">
            {document.tags && document.tags.length > 0 ? (
              document.tags.map((tagId) => (
                <Badge key={tagId} variant="neutral">
                  {tagNames.get(tagId) || `Tag ${tagId}`}
                </Badge>
              ))
            ) : (
              <span className="text-body font-body text-subtext-color">—</span>
            )}
          </div>
        </div>

        {document.content && (
          <div className="flex flex-col items-start gap-2 w-full">
            <span className="text-caption-bold font-caption-bold text-subtext-color">Content Preview</span>
            <div className="text-body font-body text-default-font max-h-64 overflow-y-auto p-3 bg-neutral-50 rounded border border-neutral-border">
              {document.content.substring(0, 500)}
              {document.content.length > 500 && "..."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

DocumentPreviewPanel.displayName = 'DocumentPreviewPanel';

