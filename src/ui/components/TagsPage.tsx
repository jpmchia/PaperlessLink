"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { EnhancedTable } from "@/ui/components/EnhancedTable";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Badge } from "@/ui/components/Badge";
import { TextField } from "@/ui/components/TextField";
import { FeatherPlus, FeatherMoreHorizontal, FeatherEdit, FeatherTrash, FeatherSearch, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { useTags } from "@/lib/api/hooks";
import { Tag } from "@/app/data/tag";
import type { ColumnDef } from "@tanstack/react-table";
import { TagEditor } from "./tags/TagEditor";

export function TagsPage() {
  const router = useRouter();
  const { data: tagsData, delete: deleteTag, refetch } = useTags();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  const tags = useMemo(() => tagsData?.results || [], [tagsData]);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      // When no search, show only root tags (no parent)
      return tags.filter(tag => !tag.parent);
    }
    
    // When searching, show matching tags and filter out children if parent is also present
    const query = searchQuery.toLowerCase();
    const matchingTags = tags.filter(tag => 
      tag.name?.toLowerCase().includes(query)
    );
    
    const availableIds = new Set(matchingTags.map(tag => tag.id));
    return matchingTags.filter(tag => !tag.parent || !availableIds.has(tag.parent));
  }, [tags, searchQuery]);

  // Create a map for parent tag names
  const parentTagMap = useMemo(() => {
    const map = new Map<number, string>();
    tags.forEach(tag => {
      if (tag.id !== undefined && tag.name) {
        map.set(tag.id, tag.name);
      }
    });
    return map;
  }, [tags]);

  const getParentTagName = useCallback((parentId: number | undefined): string => {
    if (!parentId) return "";
    return parentTagMap.get(parentId) || "";
  }, [parentTagMap]);

  const handleCreateTag = useCallback(() => {
    setEditingTag(null);
    setIsEditorOpen(true);
  }, []);

  const handleEditTag = useCallback((tag: Tag) => {
    setEditingTag(tag);
    setIsEditorOpen(true);
  }, []);

  const handleDeleteTag = useCallback(async (tag: Tag) => {
    if (!tag.id) return;
    
    const confirmed = window.confirm(
      `Do you really want to delete the tag "${tag.name}"?`
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingTagId(tag.id);
      await deleteTag(tag.id);
      await refetch();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("Failed to delete tag. Please try again.");
    } finally {
      setDeletingTagId(null);
    }
  }, [deleteTag, refetch]);

  const handleEditorClose = useCallback(() => {
    setIsEditorOpen(false);
    setEditingTag(null);
  }, []);

  const handleEditorSave = useCallback(async () => {
    await refetch();
    handleEditorClose();
  }, [refetch, handleEditorClose]);

  // Table columns
  const columns = useMemo<ColumnDef<Tag>[]>(() => [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      enableSorting: true,
      enableResizing: true,
      minSize: 200,
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <div className="flex items-center gap-2">
            {tag.color && (
              <div
                className="w-4 h-4 rounded border border-solid border-neutral-300"
                style={{
                  backgroundColor: tag.color,
                }}
                title={tag.color}
              />
            )}
            <span className="text-body font-body text-default-font">
              {tag.name || "—"}
            </span>
            {tag.is_inbox_tag && (
              <Badge variant="neutral" className="text-xs">
                Inbox
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "color",
      accessorKey: "color",
      header: "Color",
      enableSorting: true,
      enableResizing: true,
      minSize: 120,
      cell: ({ row }) => {
        const tag = row.original;
        if (!tag.color) return <span className="text-body font-body text-subtext-color">—</span>;
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-solid border-neutral-300"
              style={{
                backgroundColor: tag.color,
                color: tag.text_color || "#000000",
              }}
              title={tag.color}
            />
            <span className="text-body font-body text-subtext-color text-sm">
              {tag.color}
            </span>
          </div>
        );
      },
    },
    {
      id: "parent",
      accessorKey: "parent",
      header: "Parent",
      enableSorting: true,
      enableResizing: true,
      minSize: 150,
      cell: ({ row }) => {
        const tag = row.original;
        const parentName = getParentTagName(tag.parent);
        return (
          <span className="text-body font-body text-subtext-color">
            {parentName || "—"}
          </span>
        );
      },
    },
    {
      id: "document_count",
      accessorKey: "document_count",
      header: "Documents",
      enableSorting: true,
      enableResizing: true,
      minSize: 100,
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <span className="text-body font-body text-default-font">
            {tag.document_count ?? 0}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }: { row: { original: Tag } }) => {
        const tag = row.original;
        return (
          <div className="flex items-center justify-center">
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
                  style={{ zIndex: 100 }}
                >
                  <DropdownMenu>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherEdit />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleEditTag(tag);
                      }}
                    >
                      Edit
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherTrash />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (deletingTagId !== tag.id) {
                          handleDeleteTag(tag);
                        }
                      }}
                    >
                      {deletingTagId === tag.id ? "Deleting..." : "Delete"}
                    </DropdownMenu.DropdownItem>
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </div>
        );
      },
    },
  ], [getParentTagName, handleEditTag, handleDeleteTag, deletingTagId]);

  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-start w-full h-full overflow-hidden">
        {/* Header */}
        <div className="flex w-full flex-none items-center justify-between gap-4 border-b border-solid border-neutral-border px-6 py-4">
          <h1 className="text-heading-1 font-heading-1 text-default-font">
            Tags
          </h1>
          <Button
            variant="brand-primary"
            size="medium"
            icon={<FeatherPlus />}
            onClick={handleCreateTag}
          >
            Create Tag
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex w-full flex-none items-center gap-2 px-6 py-4 border-b border-solid border-neutral-border">
          <div className="flex-1 max-w-md">
            <TextField
              icon={searchQuery ? undefined : <FeatherSearch />}
              iconRight={searchQuery ? (
                <IconButton
                  size="small"
                  icon={<FeatherX />}
                  onClick={() => setSearchQuery("")}
                />
              ) : undefined}
            >
              <TextField.Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tags..."
              />
            </TextField>
          </div>
          <div className="text-body font-body text-subtext-color">
            {filteredTags.length} {filteredTags.length === 1 ? "tag" : "tags"}
          </div>
        </div>

        {/* Tags Table */}
        <div className="flex w-full grow shrink-0 basis-0 flex-col items-start overflow-hidden min-h-0 px-4 py-4">
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <EnhancedTable
              data={filteredTags}
              columns={columns}
              loading={false}
              enableSorting={true}
              enableColumnResizing={true}
              enableColumnReordering={false}
              enableColumnVisibility={false}
            />
          </div>
        </div>
      </div>

      {/* Tag Editor Dialog */}
      <TagEditor
        open={isEditorOpen}
        tag={editingTag}
        onSave={handleEditorSave}
        onCancel={handleEditorClose}
        allTags={tags}
      />
    </DefaultPageLayout>
  );
}

