import React from 'react';
import { Button } from '@/ui/components/Button';
import { FeatherSave, FeatherRotateCcw, FeatherCopy } from '@subframe/core';

interface CustomViewActionsProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onRevert: () => void;
  onSaveAs: () => void;
}

export function CustomViewActions({
  hasUnsavedChanges,
  isSaving,
  onSave,
  onRevert,
  onSaveAs,
}: CustomViewActionsProps) {
  return (
    <>
      <Button
        variant="neutral-secondary"
        size="medium"
        icon={<FeatherRotateCcw />}
        onClick={onRevert}
        disabled={!hasUnsavedChanges}
      >
        Revert
      </Button>
      <Button
        variant="neutral-secondary"
        size="medium"
        icon={<FeatherCopy />}
        onClick={onSaveAs}
        disabled={isSaving}
      >
        Save As...
      </Button>
      <Button
        variant="brand-primary"
        size="medium"
        icon={<FeatherSave />}
        onClick={onSave}
        disabled={!hasUnsavedChanges || isSaving}
      >
        {isSaving ? "Saving..." : "Save"}
      </Button>
    </>
  );
}

