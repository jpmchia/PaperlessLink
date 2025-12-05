import { CustomFieldDataType } from "@/app/data/custom-field";

export function getFilterTypeOptions(dataType: CustomFieldDataType): Array<{ value: string; label: string }> {
  const baseOptions = [
    { value: 'populated', label: 'Populated' },
    { value: 'exact-match', label: 'Exact Match' },
    { value: 'text', label: 'Text' },
    { value: 'date-range', label: 'Date Range' },
  ];

  switch (dataType) {
    case CustomFieldDataType.String:
    case CustomFieldDataType.Url:
    case CustomFieldDataType.LongText:
      return [
        ...baseOptions,
        { value: 'multi-select', label: 'Multi-Select' },
      ];
    case CustomFieldDataType.Select:
      return [
        { value: 'populated', label: 'Populated' },
        { value: 'multi-select', label: 'Multi-Select' },
        { value: 'single-select', label: 'Single Select' },
        { value: 'date-range', label: 'Date Range' },
      ];
    case CustomFieldDataType.Integer:
    case CustomFieldDataType.Float:
    case CustomFieldDataType.Monetary:
      return [
        { value: 'populated', label: 'Populated' },
        { value: 'numerical', label: 'Numerical' },
        { value: 'range', label: 'Range' },
        { value: 'date-range', label: 'Date Range' },
      ];
    case CustomFieldDataType.Boolean:
      return [
        { value: 'populated', label: 'Populated' },
        { value: 'boolean', label: 'Boolean' },
        { value: 'date-range', label: 'Date Range' },
      ];
    case CustomFieldDataType.Date:
      return [
        { value: 'populated', label: 'Populated' },
        { value: 'date-range', label: 'Date Range' },
        { value: 'single-date', label: 'Single Date' },
      ];
    case CustomFieldDataType.DocumentLink:
      return [
        { value: 'populated', label: 'Populated' },
        { value: 'document-link', label: 'Document Link' },
        { value: 'date-range', label: 'Date Range' },
      ];
    default:
      return baseOptions;
  }
}

export function getDefaultFilterType(dataType: CustomFieldDataType): string {
  switch (dataType) {
    case CustomFieldDataType.Date:
      return 'date-range';
    case CustomFieldDataType.String:
    case CustomFieldDataType.Url:
    case CustomFieldDataType.LongText:
      return 'text';
    case CustomFieldDataType.Select:
      return 'multi-select';
    case CustomFieldDataType.Integer:
    case CustomFieldDataType.Float:
    case CustomFieldDataType.Monetary:
      return 'numerical';
    case CustomFieldDataType.Boolean:
      return 'boolean';
    case CustomFieldDataType.DocumentLink:
      return 'document-link';
    default:
      return 'text';
  }
}

export function getTableDisplayTypeOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'text', label: 'Text' },
    { value: 'date', label: 'Date' },
    { value: 'url', label: 'URL' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'list', label: 'List' },
    { value: 'identifier', label: 'Identifier' },
  ];
}

export function getDefaultTableDisplayType(dataType: CustomFieldDataType): string {
  switch (dataType) {
    case CustomFieldDataType.Date:
      return 'date';
    case CustomFieldDataType.Url:
      return 'url';
    case CustomFieldDataType.Boolean:
      return 'checkbox';
    case CustomFieldDataType.Select:
      return 'list';
    case CustomFieldDataType.DocumentLink:
      return 'identifier';
    default:
      return 'text';
  }
}

export function getEditModeEntryTypeOptions(): Array<{ value: string; label: string }> {
  return [
    { value: 'text', label: 'Text' },
    { value: 'url', label: 'URL' },
    { value: 'number', label: 'Number' },
    { value: 'unique-id', label: 'Unique ID' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'multi-select', label: 'Multi-Select' },
    { value: 'date', label: 'Date' },
  ];
}

export function getDefaultEditModeEntryType(dataType: CustomFieldDataType): string {
  switch (dataType) {
    case CustomFieldDataType.Date:
      return 'date';
    case CustomFieldDataType.Url:
      return 'url';
    case CustomFieldDataType.Integer:
    case CustomFieldDataType.Float:
    case CustomFieldDataType.Monetary:
      return 'number';
    case CustomFieldDataType.Boolean:
      return 'boolean';
    case CustomFieldDataType.Select:
      return 'multi-select';
    case CustomFieldDataType.DocumentLink:
      return 'unique-id';
    default:
      return 'text';
  }
}


