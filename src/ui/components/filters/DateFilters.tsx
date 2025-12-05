"use client";

import React, { useCallback } from "react";
import { DateRangePicker } from "../DateRangePicker";

/**
 * Date Range Filter - uses DateRangePicker component
 */
export interface DateRangeFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: { from: Date | null; to: Date | null } | null;
  onChange: (value: { from: Date | null; to: Date | null } | null) => void;
  className?: string;
}

export function DateRangeFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  // Convert from/to format to start/end format, and null to undefined
  const convertedValue = value
    ? { start: value.from, end: value.to }
    : undefined;

  const handleChange = (range: { start: Date | null; end: Date | null }) => {
    // Convert start/end format back to from/to format, and undefined to null
    onChange({
      from: range.start,
      to: range.end,
    });
  };

  return (
    <DateRangePicker
      value={convertedValue}
      onChange={handleChange}
      className={className}
    />
  );
}

/**
 * Single Date Filter - date picker for a single date
 */
export interface SingleDateFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: Date | null;
  onChange: (value: Date | null) => void;
  className?: string;
}

export function SingleDateFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: SingleDateFilterProps) {
  // Convert single date to start/end format, and null to undefined
  const convertedValue = value
    ? { start: value, end: null }
    : undefined;

  const handleChange = useCallback((range: { start: Date | null; end: Date | null }) => {
    // Use the start date as the single date value
    onChange(range.start);
  }, [onChange]);

  return (
    <DateRangePicker
      value={convertedValue}
      onChange={handleChange}
      className={className}
    />
  );
}


