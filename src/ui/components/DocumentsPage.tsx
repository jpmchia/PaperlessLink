"use client";

import React from "react";

import { DocumentsTableFeature } from "./DocumentsCustomView";

/**
 * The main Documents Page.
 * Now acts as a wrapper around the unified DocumentsTableFeature, provided with a shared context.
 */
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";

export function DocumentsPage() {
  return (
    <DefaultPageLayout>
      <DocumentsTableFeature />
    </DefaultPageLayout>
  );
}
