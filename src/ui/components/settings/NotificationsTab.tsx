"use client";

import React from "react";
import { Switch } from "../Switch";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

interface NotificationsTabProps {
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
}

export function NotificationsTab({ getSetting, updateSetting }: NotificationsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            New Document Notifications
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Show notifications when new documents are processed
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_NEW_DOCUMENT, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_NEW_DOCUMENT, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Success Notifications
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Show notifications for successful operations
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUCCESS, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUCCESS, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Failure Notifications
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Show notifications for failed operations
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_FAILED, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_FAILED, checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-body-bold font-body-bold text-default-font">
            Suppress Notifications on Dashboard
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Hide notifications when viewing the dashboard
          </span>
        </div>
        <Switch
          checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUPPRESS_ON_DASHBOARD, true)}
          onCheckedChange={(checked) =>
            updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUPPRESS_ON_DASHBOARD, checked)
          }
        />
      </div>
    </div>
  );
}


