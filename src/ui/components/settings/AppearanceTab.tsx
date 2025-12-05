"use client";

import React from "react";
import { Switch } from "../Switch";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

interface AppearanceTabProps {
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
}

export function AppearanceTab({ getSetting, updateSetting }: AppearanceTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Dark Mode
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Enable dark mode theme
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DARK_MODE_ENABLED, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DARK_MODE_ENABLED, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Use System Theme
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Automatically match system dark mode preference
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Invert Thumbnails in Dark Mode
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Invert document thumbnails when using dark mode
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DARK_MODE_THUMB_INVERTED, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DARK_MODE_THUMB_INVERTED, checked)
          }
        />
      </div>
    </div>
  );
}


