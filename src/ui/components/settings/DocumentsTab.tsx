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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}created`, true)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}created`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}category`, true)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}category`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}correspondent`, false)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}correspondent`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}tags`, false)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}tags`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}storagePath`, false)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}storagePath`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}owner`, true)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}owner`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}status`, true)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}status`, checked)
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
          checked={getSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}asn`, false)}
          onCheckedChange={(checked) =>
            updateSetting(`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}asn`, checked)
          }
        />
      </div>
    </div>
  );
}


