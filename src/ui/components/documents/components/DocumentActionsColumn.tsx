import React from 'react';
import { IconButton } from '@/ui/components/IconButton';
import { FeatherMoreHorizontal, FeatherEye, FeatherDownload, FeatherShare2, FeatherTrash } from '@subframe/core';
import * as SubframeCore from '@subframe/core';
import { DropdownMenu } from '@/ui/components/DropdownMenu';
import { Document } from '@/app/data/document';

interface DocumentActionsColumnProps {
  doc: Document;
  deletingDocId: number | null;
  onView: (docId: number | undefined) => void;
  onDownload: (docId: number | undefined) => void;
  onDelete: (docId: number | undefined) => void;
}

export function DocumentActionsColumn({
  doc,
  deletingDocId,
  onView,
  onDownload,
  onDelete,
}: DocumentActionsColumnProps) {
  return (
    <div className="flex grow shrink-0 basis-0 items-center justify-end">
      <SubframeCore.DropdownMenu.Root>
        <SubframeCore.DropdownMenu.Trigger asChild={true}>
          <IconButton
            size="small"
            icon={<FeatherMoreHorizontal />}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
            }}
          />
        </SubframeCore.DropdownMenu.Trigger>
        <SubframeCore.DropdownMenu.Portal>
          <SubframeCore.DropdownMenu.Content
            side="bottom"
            align="end"
            sideOffset={8}
            asChild={true}
            style={{ zIndex: 10000 }}
          >
            <DropdownMenu>
              <DropdownMenu.DropdownItem
                icon={<FeatherEye />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onView(doc.id);
                }}
              >
                View
              </DropdownMenu.DropdownItem>
              <DropdownMenu.DropdownItem
                icon={<FeatherDownload />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDownload(doc.id);
                }}
              >
                Download
              </DropdownMenu.DropdownItem>
              <DropdownMenu.DropdownItem
                icon={<FeatherShare2 />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  // TODO: Implement share functionality
                }}
              >
                Share
              </DropdownMenu.DropdownItem>
              <DropdownMenu.DropdownItem
                icon={<FeatherTrash />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  if (deletingDocId !== doc.id) {
                    onDelete(doc.id);
                  }
                }}
              >
                {deletingDocId === doc.id ? "Deleting..." : "Delete"}
              </DropdownMenu.DropdownItem>
            </DropdownMenu>
          </SubframeCore.DropdownMenu.Content>
        </SubframeCore.DropdownMenu.Portal>
      </SubframeCore.DropdownMenu.Root>
    </div>
  );
}

