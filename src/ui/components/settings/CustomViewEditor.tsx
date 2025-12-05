"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Switch } from "../Switch";
import { CustomView } from "@/app/data/custom-view";

interface CustomViewEditorProps {
  open: boolean;
  view: CustomView | null; // null = create new, otherwise edit existing
  onSave: (viewData: Omit<CustomView, 'id'>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export function CustomViewEditor({
  open,
  view,
  onSave,
  onCancel,
  isSaving,
}: CustomViewEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);

  // Initialize form when view changes or modal opens
  useEffect(() => {
    if (open) {
      if (view) {
        // Edit mode
        setName(view.name || "");
        setDescription(view.description || "");
        setIsGlobal(view.is_global || false);
      } else {
        // Create mode
        setName("");
        setDescription("");
        setIsGlobal(false);
      }
    }
  }, [view, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a name for the custom view");
      return;
    }

    // The actual view data (column order, filters, etc.) will be captured
    // from the current DocumentsCustomView state when saving
    const viewData: Omit<CustomView, 'id'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_global: isGlobal,
      // These will be populated from the current view state
      column_order: [],
      column_sizing: {},
      column_visibility: {},
      column_display_types: {},
      filter_rules: [],
      filter_visibility: {},
    };

    await onSave(viewData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Content className="w-[600px] max-h-[80vh]">
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-heading-2 font-heading-2 text-default-font">
            {view ? "Edit Custom View" : "Create Custom View"}
          </h2>

          <TextField label="Name *">
            <TextField.Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter view name"
            />
          </TextField>

          <TextField label="Description">
            <TextField.Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
            />
          </TextField>

          <div className="flex items-center gap-2">
            <Switch
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
            <label className="text-body font-body text-default-font">
              Share globally (visible to all users)
            </label>
          </div>

          {view && (
            <div className="text-body font-body text-subtext-color text-sm">
              <p>Created: {view.created ? new Date(view.created).toLocaleString() : "—"}</p>
              <p>Modified: {view.modified ? new Date(view.modified).toLocaleString() : "—"}</p>
              <p>Owner: {view.username || "—"}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-solid border-neutral-border">
            <Button variant="neutral-secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="brand-primary"
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? "Saving..." : view ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

