import React, { memo, useMemo } from 'react';
import { TextField } from "@/ui/components/TextField";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { FilterDropDown } from "@/ui/components/FilterDropDown";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch, FeatherTag, FeatherUser, FeatherFolder, FeatherUsers, FeatherListFilter, FeatherHash, FeatherChevronRight, FeatherChevronLeft, FeatherDownload, FeatherPlus } from "@subframe/core";
import { useDocumentFilters, FilterVisibility } from './useDocumentFilters';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterVisibility: FilterVisibility;
  filters: {
    dateRange: { start: Date | null; end: Date | null } | null;
    category: number[];
    correspondent: number[];
    tags: number[];
    storagePath: number[];
    owner: string[];
    status: string[];
    asn: number[];
  };
  updateFilter: {
    dateRange: (value: { start: Date | null; end: Date | null } | null) => void;
    category: (value: number[]) => void;
    correspondent: (value: number[]) => void;
    tags: (value: number[]) => void;
    storagePath: (value: number[]) => void;
    owner: (value: string[]) => void;
    status: (value: string[]) => void;
    asn: (value: number[]) => void;
  };
  documentTypes: Array<{ id?: number; name?: string }>;
  correspondents: Array<{ id?: number; name?: string }>;
  tags: Array<{ id?: number; name?: string }>;
  isPanelVisible: boolean;
  onTogglePanel: () => void;
  onExport: () => void;
  onAddDocument: () => void;
  filterBarRef?: React.RefObject<HTMLDivElement>;
}

export const FilterBar = memo<FilterBarProps>(({
  searchQuery,
  onSearchChange,
  filterVisibility,
  filters,
  updateFilter,
  documentTypes,
  correspondents,
  tags,
  isPanelVisible,
  onTogglePanel,
  onExport,
  onAddDocument,
  filterBarRef,
}) => {
  // Memoize filter options to prevent unnecessary re-renders
  const categoryOptions = useMemo(
    () => documentTypes
      .filter(type => type.id !== undefined && type.name !== undefined)
      .map(type => ({ id: type.id!, label: type.name! })),
    [documentTypes]
  );

  const correspondentOptions = useMemo(
    () => correspondents
      .filter(corr => corr.id !== undefined && corr.name !== undefined)
      .map(corr => ({ id: corr.id!, label: corr.name! })),
    [correspondents]
  );

  const tagOptions = useMemo(
    () => tags
      .filter(tag => tag.id !== undefined && tag.name !== undefined)
      .map(tag => ({ id: tag.id!, label: tag.name! })),
    [tags]
  );

  return (
    <div ref={filterBarRef} className="flex w-full flex-none items-center gap-2 border-b border-solid border-neutral-border px-6 py-4">
      <TextField
        variant="filled"
        label=""
        helpText=""
        icon={<FeatherSearch />}
        className="h-auto w-64 flex-none"
      >
        <TextField.Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onSearchChange(event.target.value);
          }}
        />
      </TextField>
      {filterVisibility.dateRange && (
        <DateRangePicker
          value={filters.dateRange || undefined}
          onChange={(range) => updateFilter.dateRange(range.start || range.end ? range : null)}
        />
      )}
      {filterVisibility.category && (
        <FilterDropDown
          label="Category"
          icon={<FeatherTag />}
          options={categoryOptions}
          selectedIds={filters.category}
          onSelectionChange={(ids) => updateFilter.category(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Categories"
        />
      )}
      {filterVisibility.correspondent && (
        <FilterDropDown
          label="Correspondent"
          icon={<FeatherUser />}
          options={correspondentOptions}
          selectedIds={filters.correspondent}
          onSelectionChange={(ids) => updateFilter.correspondent(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Correspondents"
        />
      )}
      {filterVisibility.tags && (
        <FilterDropDown
          label="Tags"
          icon={<FeatherTag />}
          options={tagOptions}
          selectedIds={filters.tags}
          onSelectionChange={(ids) => updateFilter.tags(ids as number[])}
          multiSelect={true}
        />
      )}
      {filterVisibility.storagePath && (
        <FilterDropDown
          label="Storage Path"
          icon={<FeatherFolder />}
          options={[]}
          selectedIds={filters.storagePath}
          onSelectionChange={(ids) => updateFilter.storagePath(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Storage Paths"
        />
      )}
      {filterVisibility.owner && (
        <FilterDropDown
          label="Owner"
          icon={<FeatherUsers />}
          options={[{ id: "me", label: "Me" }]}
          selectedIds={filters.owner}
          onSelectionChange={(ids) => updateFilter.owner(ids as string[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Owners"
        />
      )}
      {filterVisibility.status && (
        <FilterDropDown
          label="Status"
          icon={<FeatherListFilter />}
          options={[
            { id: "active", label: "Active" },
            { id: "archived", label: "Archived" },
          ]}
          selectedIds={filters.status}
          onSelectionChange={(ids) => updateFilter.status(ids as string[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Status"
        />
      )}
      {filterVisibility.asn && (
        <FilterDropDown
          label="ASN"
          icon={<FeatherHash />}
          options={[]}
          selectedIds={filters.asn}
          onSelectionChange={(ids) => updateFilter.asn(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All ASN"
        />
      )}
      <div className="flex grow shrink-0 basis-0 items-center justify-end gap-2">
        <IconButton
          variant="neutral-secondary"
          icon={isPanelVisible ? <FeatherChevronRight /> : <FeatherChevronLeft />}
          onClick={onTogglePanel}
          title={isPanelVisible ? "Hide preview panel" : "Show preview panel"}
        />
        <Button
          variant="neutral-tertiary"
          icon={<FeatherDownload />}
          onClick={onExport}
        >
          Export
        </Button>
        <Button
          variant="brand-primary"
          icon={<FeatherPlus />}
          onClick={onAddDocument}
        >
          Upload
        </Button>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';

