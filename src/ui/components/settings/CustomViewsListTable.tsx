"use client";

import React from "react";
import { CustomView } from "@/app/data/custom-view";
import { Table } from "../Table";
import { Button } from "../Button";
import { FeatherEdit2, FeatherTrash2, FeatherCopy } from "@subframe/core";

interface CustomViewsListTableProps {
  customViews: CustomView[];
  onEdit: (view: CustomView) => void;
  onDelete: (view: CustomView) => void;
  onDuplicate: (view: CustomView) => void;
}

const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "—";
  }
};

export function CustomViewsListTable({
  customViews,
  onEdit,
  onDelete,
  onDuplicate,
}: CustomViewsListTableProps) {
  // Filter out drafts (they have string IDs starting with "draft-")
  const savedViews = customViews.filter(v => typeof v.id === 'number');

  if (savedViews.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-body font-body text-subtext-color">
          No custom views found. Click "New View" to create one.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell style={{ width: '120px' }}>Actions</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Description</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '100px' }}>Type</Table.HeaderCell>
            <Table.HeaderCell>Owner</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '180px' }}>Created</Table.HeaderCell>
            <Table.HeaderCell style={{ width: '180px' }}>Last Modified</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {savedViews.map((view) => (
          <Table.Row key={view.id}>
            <Table.Cell>
              <div className="flex items-center gap-1">
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherEdit2 />}
                  onClick={() => onEdit(view)}
                />
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherCopy />}
                  onClick={() => onDuplicate(view)}
                />
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherTrash2 />}
                  onClick={() => onDelete(view)}
                />
              </div>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-default-font">
                {view.name}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-subtext-color">
                {view.description || "—"}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-default-font">
                {view.is_global ? "Global" : "User"}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-default-font">
                {view.username || "—"}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-subtext-color">
                {formatDate(view.created)}
              </span>
            </Table.Cell>
            <Table.Cell>
              <span className="text-body font-body text-subtext-color">
                {formatDate(view.modified)}
              </span>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table>
    </div>
  );
}

