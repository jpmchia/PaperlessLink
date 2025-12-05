"use client";

import React from "react";
import { Switch } from "../Switch";
import { TextField } from "../TextField";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

interface GeneralSettingsTabProps {
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
}

export function GeneralSettingsTab({ getSetting, updateSetting }: GeneralSettingsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Slim Sidebar
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Use a minimized sidebar by default
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.SLIM_SIDEBAR, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.SLIM_SIDEBAR, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Bulk Edit Confirmation Dialogs
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Show confirmation dialogs for bulk edit operations
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Apply Bulk Edit on Close
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Automatically apply bulk edits when closing the editor
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE, checked)
          }
        />
      </div>

      <div className="flex flex-col items-start gap-2">
        <span className="text-body-bold font-body-bold text-default-font">
          Documents Per Page
        </span>
        <TextField
          variant="outline"
          label=""
          helpText=""
          className="w-32"
        >
          <TextField.Input
            type="number"
            value={getSetting(SETTINGS_KEYS.DOCUMENT_LIST_SIZE, 50).toString()}
            onChange={(e) =>
              updateSetting(SETTINGS_KEYS.DOCUMENT_LIST_SIZE, parseInt(e.target.value) || 50)
            }
          />
        </TextField>
      </div>
    </div>
  );
}


