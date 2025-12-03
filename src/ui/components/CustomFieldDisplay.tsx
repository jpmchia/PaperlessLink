"use client";

import React from "react";
import { FeatherGlobe, FeatherCheck } from "@subframe/core";
import { Badge } from "./Badge";
import { Checkbox } from "./Checkbox";

interface CustomFieldDisplayProps {
  value: any;
  displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier';
  className?: string;
}

/**
 * Text Display - just a normal string
 */
function TextDisplay({ value, className }: { value: any; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }
  return <span className={`text-body font-body text-default-font ${className || ''}`}>{String(value)}</span>;
}

/**
 * Date Display - date formatted as "dd mmm yyyy" (e.g., "15 Jan 2024")
 */
function DateDisplay({ value, className }: { value: any; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
    }

    const day = date.getDate().toString().padStart(2, '0');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = date.getMonth();
    const monthName = monthNames[monthIndex];
    const year = date.getFullYear();

    return (
      <span className={`text-body font-body text-default-font ${className || ''}`}>
        {`${day} ${monthName} ${year}`}
      </span>
    );
  } catch (error) {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }
}

/**
 * URL Display - collapses to globe icon, or displays URL truncated from the left (showing the end)
 */
function UrlDisplay({ value, className }: { value: any; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }

  const urlString = String(value);
  const maxLength = 30; // Maximum characters to show before truncating

  if (urlString.length <= maxLength) {
    return (
      <a
        href={urlString}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-1 text-body font-body text-brand-600 hover:text-brand-700 ${className || ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <FeatherGlobe className="text-body font-body text-brand-600" />
        <span>{urlString}</span>
      </a>
    );
  }

  // Truncate from the left, showing the end of the URL
  const truncated = '...' + urlString.slice(-(maxLength - 3));

  return (
    <a
      href={urlString}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1 text-body font-body text-brand-600 hover:text-brand-700 ${className || ''}`}
      title={urlString}
      onClick={(e) => e.stopPropagation()}
    >
      <FeatherGlobe className="text-body font-body text-brand-600 flex-shrink-0" />
      <span className="truncate">{truncated}</span>
    </a>
  );
}

/**
 * Checkbox Display - checkbox that is either true/false or is populated / no value set
 */
function CheckboxDisplay({ value, className }: { value: any; className?: string }) {
  // Check if value is populated (not null, undefined, or empty string)
  const isPopulated = value !== null && value !== undefined && value !== '';
  // Also check if it's explicitly a boolean true
  const isChecked = value === true || isPopulated;

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <Checkbox checked={isChecked} disabled />
    </div>
  );
}

/**
 * List Display - field value contains comma or colon separated list, display them as pills
 */
function ListDisplay({ value, className }: { value: any; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }

  const valueString = String(value);
  // Split by comma or colon
  const items = valueString.split(/[,:]/).map(item => item.trim()).filter(item => item.length > 0);

  if (items.length === 0) {
    return <span className={`text-body font-body text-subtext-color ${className || ''}`}>—</span>;
  }

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ''}`}>
      {items.map((item, index) => (
        <Badge key={index} variant="neutral">
          {item}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Identifier Display - just a text field but centered
 */
function IdentifierDisplay({ value, className }: { value: any; className?: string }) {
  if (value === null || value === undefined || value === '') {
    return <span className={`text-body font-body text-subtext-color text-center ${className || ''}`}>—</span>;
  }
  return (
    <span className={`text-body font-body text-default-font text-center ${className || ''}`}>
      {String(value)}
    </span>
  );
}

/**
 * Main CustomFieldDisplay component that renders the appropriate display based on displayType
 */
export function CustomFieldDisplay({ value, displayType, className }: CustomFieldDisplayProps) {
  switch (displayType) {
    case 'text':
      return <TextDisplay value={value} className={className} />;
    case 'date':
      return <DateDisplay value={value} className={className} />;
    case 'url':
      return <UrlDisplay value={value} className={className} />;
    case 'checkbox':
      return <CheckboxDisplay value={value} className={className} />;
    case 'list':
      return <ListDisplay value={value} className={className} />;
    case 'identifier':
      return <IdentifierDisplay value={value} className={className} />;
    default:
      return <TextDisplay value={value} className={className} />;
  }
}

// Export individual components for direct use if needed
export { TextDisplay, DateDisplay, UrlDisplay, CheckboxDisplay, ListDisplay, IdentifierDisplay };

