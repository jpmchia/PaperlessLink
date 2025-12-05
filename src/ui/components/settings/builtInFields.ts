import { CustomFieldDataType } from "@/app/data/custom-field";

export interface BuiltInField {
  id: string;
  name: string;
  data_type: CustomFieldDataType;
  isBuiltIn: true;
}

export const BUILT_IN_FIELDS: BuiltInField[] = [
  {
    id: "title",
    name: "Document Name",
    data_type: CustomFieldDataType.String,
    isBuiltIn: true,
  },
  {
    id: "created",
    name: "Created Date",
    data_type: CustomFieldDataType.Date,
    isBuiltIn: true,
  },
  {
    id: "added",
    name: "Added Date",
    data_type: CustomFieldDataType.Date,
    isBuiltIn: true,
  },
  {
    id: "correspondent",
    name: "Correspondent",
    data_type: CustomFieldDataType.String,
    isBuiltIn: true,
  },
  {
    id: "asn",
    name: "ASN",
    data_type: CustomFieldDataType.Integer,
    isBuiltIn: true,
  },
  {
    id: "page_count",
    name: "Pages",
    data_type: CustomFieldDataType.Integer,
    isBuiltIn: true,
  },
  {
    id: "fileSize",
    name: "File Size",
    data_type: CustomFieldDataType.Integer,
    isBuiltIn: true,
  },
  {
    id: "category",
    name: "Type",
    data_type: CustomFieldDataType.String,
    isBuiltIn: true,
  },
  {
    id: "owner",
    name: "Owner",
    data_type: CustomFieldDataType.String,
    isBuiltIn: true,
  },
];

