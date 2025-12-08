"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "../Dialog";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Select } from "../Select";
import { Switch } from "../Switch";
import { Tag } from "@/app/data/tag";
import { MATCHING_ALGORITHMS, DEFAULT_MATCHING_ALGORITHM, MATCH_NONE } from "@/app/data/matching-model";
import { useTags } from "@/lib/api/hooks";

interface TagEditorProps {
  open: boolean;
  tag: Tag | null; // null = create new, otherwise edit existing
  onSave: () => Promise<void>;
  onCancel: () => void;
  allTags: Tag[];
}

// Simple function to generate a random color
function randomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function TagEditor({
  open,
  tag,
  onSave,
  onCancel,
  allTags,
}: TagEditorProps) {
  const { create, update } = useTags();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [parentId, setParentId] = useState<string>("");
  const [isInboxTag, setIsInboxTag] = useState(false);
  const [matchingAlgorithm, setMatchingAlgorithm] = useState<string>(String(DEFAULT_MATCHING_ALGORITHM));
  const [matchPattern, setMatchPattern] = useState("");
  const [isInsensitive, setIsInsensitive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out the current tag and its children from parent options
  const availableParentTags = useMemo(() => {
    if (!tag?.id) return allTags;
    
    // Filter out the tag itself and any of its descendants
    const excludeIds = new Set<number>([tag.id]);
    
    const collectDescendants = (tagId: number) => {
      allTags.forEach(t => {
        if (t.parent === tagId && t.id !== undefined) {
          excludeIds.add(t.id);
          collectDescendants(t.id);
        }
      });
    };
    
    collectDescendants(tag.id);
    
    return allTags.filter(t => t.id !== undefined && !excludeIds.has(t.id));
  }, [allTags, tag]);

  // Initialize form when tag changes or modal opens
  useEffect(() => {
    if (open) {
      if (tag) {
        // Edit mode
        setName(tag.name || "");
        setColor(tag.color || "#3B82F6");
        setTextColor(tag.text_color || "#FFFFFF");
        setParentId(tag.parent ? String(tag.parent) : "");
        setIsInboxTag(tag.is_inbox_tag || false);
        setMatchingAlgorithm(String(tag.matching_algorithm ?? DEFAULT_MATCHING_ALGORITHM));
        setMatchPattern(tag.match || "");
        setIsInsensitive(tag.is_insensitive ?? true);
      } else {
        // Create mode
        setName("");
        setColor(randomColor());
        setTextColor("#FFFFFF");
        setParentId("");
        setIsInboxTag(false);
        setMatchingAlgorithm(String(DEFAULT_MATCHING_ALGORITHM));
        setMatchPattern("");
        setIsInsensitive(true);
      }
    }
  }, [tag, open]);

  // Check if pattern is required based on matching algorithm
  const patternRequired = useMemo(() => {
    const algo = parseInt(matchingAlgorithm, 10);
    return algo !== MATCH_NONE && algo !== DEFAULT_MATCHING_ALGORITHM;
  }, [matchingAlgorithm]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Please enter a name for the tag");
      return;
    }

    if (patternRequired && !matchPattern.trim()) {
      alert("Please enter a matching pattern");
      return;
    }

    try {
      setIsSaving(true);
      
      const tagData: Partial<Tag> = {
        name: name.trim(),
        color: color,
        text_color: textColor,
        parent: parentId ? parseInt(parentId, 10) : undefined,
        is_inbox_tag: isInboxTag,
        matching_algorithm: parseInt(matchingAlgorithm, 10),
        match: patternRequired ? matchPattern.trim() : undefined,
        is_insensitive: isInsensitive,
      };

      if (tag?.id) {
        await update(tag.id, tagData);
      } else {
        await create(tagData);
      }

      await onSave();
    } catch (error) {
      console.error("Failed to save tag:", error);
      alert("Failed to save tag. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Content className="w-[600px] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-heading-2 font-heading-2 text-default-font">
            {tag ? "Edit Tag" : "Create Tag"}
          </h2>

          {tag?.id && (
            <div className="text-body font-body text-subtext-color">
              ID: {tag.id}
            </div>
          )}

          <TextField label="Name *">
            <TextField.Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name"
            />
          </TextField>

          <div className="flex flex-col gap-2">
            <label className="text-caption-bold font-caption-bold text-default-font">
              Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-solid border-neutral-border"
              />
              <TextField className="flex-1">
                <TextField.Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </TextField>
              <Button
                variant="neutral-secondary"
                size="small"
                onClick={() => setColor(randomColor())}
                title="Random color"
              >
                🎲
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-caption-bold font-caption-bold text-default-font">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-solid border-neutral-border"
              />
              <TextField className="flex-1">
                <TextField.Input
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  placeholder="#FFFFFF"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </TextField>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Select
              label="Parent Tag"
              value={parentId}
              onValueChange={setParentId}
              placeholder="None"
            >
              <Select.Item value="">None</Select.Item>
              {availableParentTags.map((t) => (
                <Select.Item key={t.id} value={String(t.id)}>
                  {t.color && (
                    <span
                      className="inline-block w-3 h-3 rounded mr-2 border border-solid border-neutral-300"
                      style={{ backgroundColor: t.color }}
                    />
                  )}
                  {t.name}
                </Select.Item>
              ))}
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={isInboxTag}
              onCheckedChange={setIsInboxTag}
            />
            <label className="text-body font-body text-default-font">
              Inbox tag (automatically assigned to all consumed documents)
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <Select
              label="Matching Algorithm"
              value={matchingAlgorithm}
              onValueChange={setMatchingAlgorithm}
            >
              {MATCHING_ALGORITHMS.map((algo) => (
                <Select.Item key={algo.id} value={String(algo.id)}>
                  {algo.name}
                </Select.Item>
              ))}
            </Select>
          </div>

          {patternRequired && (
            <>
              <TextField label="Matching Pattern *">
                <TextField.Input
                  value={matchPattern}
                  onChange={(e) => setMatchPattern(e.target.value)}
                  placeholder="Enter matching pattern"
                />
              </TextField>

              <div className="flex items-center gap-2">
                <Switch
                  checked={isInsensitive}
                  onCheckedChange={setIsInsensitive}
                />
                <label className="text-body font-body text-default-font">
                  Case insensitive
                </label>
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-solid border-neutral-border">
            <Button variant="neutral-secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="brand-primary"
              onClick={handleSave}
              disabled={isSaving || !name.trim() || (patternRequired && !matchPattern.trim())}
            >
              {isSaving ? "Saving..." : tag ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

