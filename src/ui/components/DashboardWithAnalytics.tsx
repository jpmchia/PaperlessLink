"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { IconButton } from "@/ui/components/IconButton";
import { PieChart } from "@/ui/components/PieChart";
import { Table } from "@/ui/components/Table";
import { TextField } from "@/ui/components/TextField";
import { ToggleGroup } from "@/ui/components/ToggleGroup";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { FeatherEdit } from "@subframe/core";
import { FeatherEye } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherFilter } from "@subframe/core";
import { FeatherGripVertical } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherPlus } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherTrash } from "@subframe/core";
import { FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { useDocuments, useTags, useCorrespondents, useDocumentTypes, useCustomFields } from "@/lib/api/hooks";
import { Document } from "@/app/data/document";
import { FilterRule } from "@/app/data/filter-rule";
import { FILTER_DOCUMENT_TYPE, FILTER_CORRESPONDENT, FILTER_HAS_TAGS_ALL } from "@/app/data/filter-rule-type";
import { CustomField } from "@/app/data/custom-field";

type DistributionType = "type" | "correspondent" | "tags" | "status" | "prepared_by";

export function DashboardWithAnalytics() {
  const { listFiltered, loading: documentsLoading } = useDocuments();
  const { listAll: listAllTags } = useTags();
  const { listAll: listAllCorrespondents } = useCorrespondents();
  const { listAll: listAllDocumentTypes } = useDocumentTypes();
  const { listAll: listAllCustomFields } = useCustomFields();

  // State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [chart1Type, setChart1Type] = useState<DistributionType>("type");
  const [chart2Type, setChart2Type] = useState<DistributionType>("correspondent");
  const [chart3Type, setChart3Type] = useState<DistributionType>("tags");
  const [selectedDocumentTypes, setSelectedDocumentTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<number | null>(null);
  const [documentsPanelHeight, setDocumentsPanelHeight] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('documentsPanelHeight');
      return saved ? parseInt(saved, 10) : 400;
    }
    return 400;
  });
  
  // Filter options
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);

  // Find Status and Prepared By custom fields
  const statusField = useMemo(() => 
    customFields.find(field => field.name.toLowerCase() === "status"), 
    [customFields]
  );
  const preparedByField = useMemo(() => 
    customFields.find(field => field.name.toLowerCase() === "prepared by" || field.name.toLowerCase() === "prepared_by"), 
    [customFields]
  );

  // Fetch filter options on mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [typesResult, tagsResult, correspondentsResult, customFieldsResult] = await Promise.all([
          listAllDocumentTypes(),
          listAllTags(),
          listAllCorrespondents(),
          listAllCustomFields(),
        ]);
        setDocumentTypes(typesResult.results);
        setTags(tagsResult.results);
        setCorrespondents(correspondentsResult.results);
        setCustomFields(customFieldsResult.results);
      } catch (error) {
        console.error("Failed to fetch filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [listAllDocumentTypes, listAllTags, listAllCorrespondents, listAllCustomFields]);

  // Build filter rules
  const filterRules = useMemo<FilterRule[]>(() => {
    const rules: FilterRule[] = [];
    
    if (selectedDocumentTypes.length > 0) {
      selectedDocumentTypes.forEach(typeId => {
        rules.push({
          rule_type: FILTER_DOCUMENT_TYPE,
          value: typeId,
        });
      });
    }
    
    if (selectedCorrespondent) {
      rules.push({
        rule_type: FILTER_CORRESPONDENT,
        value: selectedCorrespondent.toString(),
      });
    }
    
    if (selectedTags.length > 0) {
      selectedTags.forEach(tagId => {
        rules.push({
          rule_type: FILTER_HAS_TAGS_ALL,
          value: tagId.toString(),
        });
      });
    }
    
    return rules;
  }, [selectedDocumentTypes, selectedCorrespondent, selectedTags]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        const extraParams: Record<string, any> = {};
        if (searchQuery) {
          extraParams.query = searchQuery;
        }
        const result = await listFiltered({
          page: currentPage,
          pageSize,
          filterRules: filterRules.length > 0 ? filterRules : undefined,
          extraParams: Object.keys(extraParams).length > 0 ? extraParams : undefined,
        });
        setDocuments(result.results);
        setTotalCount(result.count);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, [currentPage, filterRules, searchQuery, listFiltered, pageSize]);

  // Calculate statistics for pie charts
  const typeDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    documents.forEach(doc => {
      if (doc.document_type) {
        counts[doc.document_type] = (counts[doc.document_type] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([typeId, count]) => {
      const type = documentTypes.find(t => t.id === parseInt(typeId));
      return {
        name: type?.name || `Type ${typeId}`,
        value: count,
      };
    });
  }, [documents, documentTypes]);

  const correspondentDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    documents.forEach(doc => {
      if (doc.correspondent) {
        counts[doc.correspondent] = (counts[doc.correspondent] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([corrId, count]) => {
      const corr = correspondents.find(c => c.id === parseInt(corrId));
      return {
        name: corr?.name || `Correspondent ${corrId}`,
        value: count,
      };
    });
  }, [documents, correspondents]);

  const tagDistribution = useMemo(() => {
    const counts: Record<number, number> = {};
    documents.forEach(doc => {
      if (doc.tags && doc.tags.length > 0) {
        doc.tags.forEach(tagId => {
          counts[tagId] = (counts[tagId] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .map(([tagId, count]) => {
        const tag = tags.find(t => t.id === parseInt(tagId));
        return {
          name: tag?.name || `Tag ${tagId}`,
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by count descending
  }, [documents, tags]);

  // Custom field distributions
  const statusDistribution = useMemo(() => {
    if (!statusField) return [];
    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.custom_fields) {
        const statusInstance = doc.custom_fields.find(cf => cf.field === statusField.id);
        if (statusInstance && statusInstance.value !== null && statusInstance.value !== undefined) {
          const value = String(statusInstance.value);
          counts[value] = (counts[value] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .map(([value, count]) => ({
        name: value,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [documents, statusField]);

  const preparedByDistribution = useMemo(() => {
    if (!preparedByField) return [];
    const counts: Record<string, number> = {};
    documents.forEach(doc => {
      if (doc.custom_fields) {
        const preparedByInstance = doc.custom_fields.find(cf => cf.field === preparedByField.id);
        if (preparedByInstance && preparedByInstance.value !== null && preparedByInstance.value !== undefined) {
          const value = String(preparedByInstance.value);
          counts[value] = (counts[value] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .map(([value, count]) => ({
        name: value,
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [documents, preparedByField]);

  // Get distribution data based on type, limiting to top 5 for pie charts
  const getDistributionData = (type: DistributionType) => {
    let data: Array<{ name: string; value: number }>;
    switch (type) {
      case "type":
        data = typeDistribution;
        break;
      case "correspondent":
        data = correspondentDistribution;
        break;
      case "tags":
        data = tagDistribution;
        break;
      case "status":
        data = statusDistribution;
        break;
      case "prepared_by":
        data = preparedByDistribution;
        break;
      default:
        return [];
    }
    
    // If more than 5 items, aggregate the rest into "Other"
    if (data.length > 5) {
      const top5 = data.slice(0, 5);
      const others = data.slice(5);
      const otherSum = others.reduce((sum, item) => sum + item.value, 0);
      if (otherSum > 0) {
        return [...top5, { name: "Other", value: otherSum }];
      }
      return top5;
    }
    return data;
  };

  // Get distribution label
  const getDistributionLabel = (type: DistributionType) => {
    switch (type) {
      case "type":
        return "By Type";
      case "correspondent":
        return "By Correspondent";
      case "tags":
        return "By Tags";
      case "status":
        return "By Status";
      case "prepared_by":
        return "By Prepared By";
      default:
        return "By Type";
    }
  };

  // Format date for display
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Get document type name
  const getDocumentTypeName = (typeId: number | undefined): string => {
    if (!typeId) return "";
    const type = documentTypes.find(t => t.id === typeId);
    return type?.name || "";
  };

  // Get correspondent name
  const getCorrespondentName = (corrId: number | undefined): string => {
    if (!corrId) return "";
    const corr = correspondents.find(c => c.id === corrId);
    return corr?.name || "";
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDocumentTypes([]);
    setSelectedTags([]);
    setSelectedCorrespondent(null);
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  // Handle resize for documents panel
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = documentsPanelHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      // Reverse the direction: dragging down decreases height, dragging up increases height
      const newHeight = Math.max(200, Math.min(800, startHeight - deltaY));
      setDocumentsPanelHeight(newHeight);
      if (typeof window !== 'undefined') {
        localStorage.setItem('documentsPanelHeight', newHeight.toString());
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <DefaultPageLayout>
      <div className="flex w-full h-full flex-col items-start gap-4 bg-default-background px-6 py-4">
          <div className="flex w-full flex-col items-start gap-1 flex-shrink-0">
            <span className="text-heading-1 font-heading-1 text-default-font">
              Document Analytics
            </span>
            <span className="text-body font-body text-subtext-color">
              View distribution of documents by various categories and filter to
              find specific documents
            </span>
          </div>

          {/* Distribution Cards */}
          <div className="flex w-full flex-1 items-stretch gap-4 flex-nowrap mobile:flex-col mobile:flex-nowrap mobile:gap-4 min-h-0">
            {/* Chart 1 */}
            {[chart1Type, chart2Type, chart3Type].map((chartType, chartIndex) => {
              const distributionData = getDistributionData(chartType);
              const setChartType = chartIndex === 0 ? setChart1Type : chartIndex === 1 ? setChart2Type : setChart3Type;
              
              return (
                <div key={chartIndex} className="flex flex-1 min-w-0 flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4 shadow-sm h-full overflow-hidden relative">
                  <div className="flex w-full items-center justify-between flex-shrink-0">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      Documents by {getDistributionLabel(chartType).replace(/^By /, '')} ({distributionData.reduce((sum, item) => sum + item.value, 0)} documents)
                    </span>
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <Button
                          variant="neutral-secondary"
                          size="small"
                          iconRight={<FeatherChevronDown />}
                        >
                          {getDistributionLabel(chartType)}
                        </Button>
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={4}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem
                              icon={null}
                              onClick={() => setChartType("type")}
                            >
                              Type
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem
                              icon={null}
                              onClick={() => setChartType("correspondent")}
                            >
                              Correspondent
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem
                              icon={null}
                              onClick={() => setChartType("tags")}
                            >
                              Tags
                            </DropdownMenu.DropdownItem>
                            {statusField && (
                              <DropdownMenu.DropdownItem
                                icon={null}
                                onClick={() => setChartType("status")}
                              >
                                Status
                              </DropdownMenu.DropdownItem>
                            )}
                            {preparedByField && (
                              <DropdownMenu.DropdownItem
                                icon={null}
                                onClick={() => setChartType("prepared_by")}
                              >
                                Prepared By
                              </DropdownMenu.DropdownItem>
                            )}
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </div>
                  {distributionData.length > 0 ? (
                    <>
                      <div className="flex w-full flex-1 items-center justify-center min-h-0 overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center p-2" style={{ top: '48px' }}>
                          <PieChart
                            category={"value"}
                            data={distributionData}
                            index={"name"}
                            legend={false}
                            className="max-w-full max-h-full"
                          />
                        </div>
                      </div>
                      <div className="flex w-full flex-col items-start gap-2 flex-shrink-0 overflow-y-auto relative z-10" style={{ maxHeight: '120px' }}>
                        {distributionData.map((item, idx) => {
                          const colors = ["#3b82f6ff", "#8b5cf6ff", "#06b6d4ff", "#ec4899ff"];
                          return (
                            <div key={idx} className="flex w-full items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-3 w-3 flex-none items-start rounded-sm`} style={{ backgroundColor: colors[idx % colors.length] }} />
                                <span className="text-caption font-caption text-default-font">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-caption-bold font-caption-bold text-default-font">
                                {item.value}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="flex w-full flex-1 items-center justify-center min-h-0">
                      <span className="text-body font-body text-subtext-color">
                        {loading ? "Loading..." : chartType === "status" && !statusField ? "Status field not found" : chartType === "prepared_by" && !preparedByField ? "Prepared By field not found" : "No data"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex w-full flex-col items-start gap-2 rounded-md bg-default-background shadow-sm px-4 py-3 flex-shrink-0">
            <div className="flex w-full items-center gap-2 flex-wrap">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Filters
              </span>
              <FeatherFilter className="text-body font-body text-subtext-color" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body-bold font-body-bold text-default-font">
                  Document Type:
                </span>
                <ToggleGroup
                  value={selectedDocumentTypes.join(",")}
                  onValueChange={(value: string) => {
                    setSelectedDocumentTypes(value ? value.split(",") : []);
                  }}
                >
                  {documentTypes.slice(0, 4).map((type) => (
                    <ToggleGroup.Item key={type.id} icon={null} value={type.id.toString()}>
                      {type.name}
                    </ToggleGroup.Item>
                  ))}
                </ToggleGroup>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body-bold font-body-bold text-default-font">
                  Tags:
                </span>
                {tags.slice(0, 4).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "brand" : "neutral"}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    {tag.name}
                  </Badge>
                ))}
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherPlus />}
                  onClick={() => {}}
                >
                  Add Tag
                </Button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-body-bold font-body-bold text-default-font">
                  Correspondent:
                </span>
                <SubframeCore.DropdownMenu.Root>
                  <SubframeCore.DropdownMenu.Trigger asChild={true}>
                    <Button
                      variant="neutral-secondary"
                      size="small"
                      iconRight={<FeatherChevronDown />}
                    >
                      {selectedCorrespondent
                        ? correspondents.find(c => c.id === selectedCorrespondent)?.name || "Select Correspondent"
                        : "Select Correspondent"}
                    </Button>
                  </SubframeCore.DropdownMenu.Trigger>
                  <SubframeCore.DropdownMenu.Portal>
                    <SubframeCore.DropdownMenu.Content
                      side="bottom"
                      align="start"
                      sideOffset={4}
                      asChild={true}
                    >
                      <DropdownMenu>
                        <DropdownMenu.DropdownItem
                          icon={null}
                          onClick={() => setSelectedCorrespondent(null)}
                        >
                          None
                        </DropdownMenu.DropdownItem>
                        {correspondents.map((corr) => (
                          <DropdownMenu.DropdownItem
                            key={corr.id}
                            icon={null}
                            onClick={() => setSelectedCorrespondent(corr.id)}
                          >
                            {corr.name}
                          </DropdownMenu.DropdownItem>
                        ))}
                      </DropdownMenu>
                    </SubframeCore.DropdownMenu.Content>
                  </SubframeCore.DropdownMenu.Portal>
                </SubframeCore.DropdownMenu.Root>
              </div>
              <div className="flex grow items-center justify-end gap-2">
                <Button
                  variant="neutral-tertiary"
                  icon={<FeatherX />}
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
                <Button
                  icon={<FeatherSearch />}
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Resize handle */}
          <div
            className="flex w-full items-center justify-center h-2 cursor-ns-resize hover:bg-neutral-border group -my-2 relative z-10"
            onMouseDown={handleResizeStart}
          >
            <FeatherGripVertical className="w-5 h-5 text-subtext-color opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Documents Table */}
          <div className="flex w-full flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-4 shadow-sm flex-shrink-0" style={{ height: `${documentsPanelHeight}px` }}>
            <div className="flex w-full items-center justify-between flex-wrap flex-shrink-0">
              <span className="text-heading-2 font-heading-2 text-default-font">
                Documents
              </span>
              <div className="flex items-center gap-2">
                <TextField
                  variant="filled"
                  label=""
                  helpText=""
                  icon={<FeatherSearch />}
                >
                  <TextField.Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setSearchQuery(event.target.value);
                    }}
                  />
                </TextField>
                <Button
                  variant="neutral-secondary"
                  icon={<FeatherDownload />}
                  onClick={() => {}}
                >
                  Export
                </Button>
              </div>
            </div>
            <div className="flex w-full flex-1 flex-col items-start overflow-auto min-h-0">
              {loading ? (
                <div className="flex w-full items-center justify-center py-12">
                  <span className="text-body font-body text-subtext-color">Loading...</span>
                </div>
              ) : documents.length === 0 ? (
                <div className="flex w-full items-center justify-center py-12">
                  <span className="text-body font-body text-subtext-color">No documents found</span>
                </div>
              ) : (
                <Table
                  header={
                    <Table.HeaderRow>
                      <Table.HeaderCell>Title</Table.HeaderCell>
                      <Table.HeaderCell>Date</Table.HeaderCell>
                      <Table.HeaderCell>Correspondent</Table.HeaderCell>
                      <Table.HeaderCell>Type</Table.HeaderCell>
                      <Table.HeaderCell>Summary</Table.HeaderCell>
                      <Table.HeaderCell>Actions</Table.HeaderCell>
                    </Table.HeaderRow>
                  }
                >
                  {documents.map((doc) => (
                    <Table.Row key={doc.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <FeatherFileText className="text-body font-body text-default-font" />
                          <span className="text-body-bold font-body-bold text-default-font">
                            {doc.title || doc.original_file_name || `Document ${doc.id}`}
                          </span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-body font-body text-neutral-500">
                          {formatDate(doc.created)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-body font-body text-neutral-500">
                          {getCorrespondentName(doc.correspondent)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-body font-body text-neutral-500">
                          {getDocumentTypeName(doc.document_type)}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-body font-body text-neutral-500">
                          {doc.content?.substring(0, 50) || ""}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <SubframeCore.DropdownMenu.Root>
                          <SubframeCore.DropdownMenu.Trigger asChild={true}>
                            <IconButton
                              size="small"
                              icon={<FeatherMoreHorizontal />}
                            />
                          </SubframeCore.DropdownMenu.Trigger>
                          <SubframeCore.DropdownMenu.Portal>
                            <SubframeCore.DropdownMenu.Content
                              side="bottom"
                              align="end"
                              sideOffset={4}
                              asChild={true}
                            >
                              <DropdownMenu>
                                <DropdownMenu.DropdownItem icon={<FeatherEye />}>
                                  View
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem icon={<FeatherDownload />}>
                                  Download
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem icon={<FeatherEdit />}>
                                  Edit
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                                  Delete
                                </DropdownMenu.DropdownItem>
                              </DropdownMenu>
                            </SubframeCore.DropdownMenu.Content>
                          </SubframeCore.DropdownMenu.Portal>
                        </SubframeCore.DropdownMenu.Root>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table>
              )}
            </div>
            <div className="flex w-full items-center justify-center gap-4">
              <span className="grow shrink-0 basis-0 text-body font-body text-subtext-color">
                Showing {startIndex} – {endIndex} of {totalCount} documents
              </span>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="neutral-secondary"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="neutral-secondary"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
      </div>
    </DefaultPageLayout>
  );
}
