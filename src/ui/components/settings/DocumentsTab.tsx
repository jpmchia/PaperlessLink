"use client";

import React from "react";
import { Switch } from "../Switch";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

interface DocumentsTabProps {
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
}

export function DocumentsTab({ getSetting, updateSetting }: DocumentsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-2 mb-2">
        <span className="text-heading-3 font-heading-3 text-default-font">
          Document Filters
        </span>
        <span className="text-caption font-caption text-subtext-color">
          Choose which filters to display on the Documents page
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Date Range
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter documents by creation, modification, or added date
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Category (Document Type)
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter by document type/category
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Correspondent
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter by document correspondent/sender
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Tags
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter documents by tags
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Storage Path
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter by storage location/path
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Owner
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter documents by owner/user
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Status
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter by document status (active, archived, inbox)
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Archive Serial Number (ASN)
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Filter by archive serial number
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_ASN, false)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_ASN, checked)
          }
        />
      </div>
    </div>
  );
}


