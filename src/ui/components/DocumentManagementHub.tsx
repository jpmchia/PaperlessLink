"use client";

import React from "react";
import { Accordion } from "@/ui/components/Accordion";
import { Avatar } from "@/ui/components/Avatar";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { CheckboxCard } from "@/ui/components/CheckboxCard";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { IconButton } from "@/ui/components/IconButton";
import { Select } from "@/ui/components/Select";
import { Table } from "@/ui/components/Table";
import { TextArea } from "@/ui/components/TextArea";
import { TextField } from "@/ui/components/TextField";
import { FeatherCheck } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherColumns } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { FeatherEdit2 } from "@subframe/core";
import { FeatherEye } from "@subframe/core";
import { FeatherFile } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherShare2 } from "@subframe/core";
import { FeatherTrash } from "@subframe/core";
import { FeatherUpload } from "@subframe/core";
import { FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

function DocumentManagementHub() {
  return (
    <div className="flex w-full items-start bg-default-background h-screen">
      <div className="flex w-64 flex-none flex-col items-start gap-4 self-stretch border-r border-solid border-neutral-border bg-default-background px-4 py-6 overflow-auto">
        <div className="flex w-full flex-col items-start gap-2">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Filters
          </span>
          <TextField
            className="h-auto w-full flex-none"
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search documents..."
              value=""
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
            />
          </TextField>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <Select
            className="h-auto w-full flex-none"
            variant="filled"
            label="File Type"
            placeholder="All types"
            helpText=""
            value={undefined}
            onValueChange={(value: string) => {}}
          >
            <Select.Item value="All types">All types</Select.Item>
            <Select.Item value="PDF">PDF</Select.Item>
            <Select.Item value="DOC">DOC</Select.Item>
            <Select.Item value="XLS">XLS</Select.Item>
          </Select>
          <Select
            className="h-auto w-full flex-none"
            variant="filled"
            label="Date Range"
            placeholder="All time"
            helpText=""
            value={undefined}
            onValueChange={(value: string) => {}}
          >
            <Select.Item value="All time">All time</Select.Item>
            <Select.Item value="Today">Today</Select.Item>
            <Select.Item value="This week">This week</Select.Item>
            <Select.Item value="This month">This month</Select.Item>
          </Select>
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-body-bold font-body-bold text-default-font">
              Status
            </span>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Published
              </span>
            </CheckboxCard>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Draft
              </span>
            </CheckboxCard>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Archived
              </span>
            </CheckboxCard>
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <span className="text-body-bold font-body-bold text-default-font">
              Tags
            </span>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Finance
              </span>
            </CheckboxCard>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Legal
              </span>
            </CheckboxCard>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">HR</span>
            </CheckboxCard>
            <CheckboxCard
              className="h-auto w-full flex-none"
              checked={false}
              onCheckedChange={(checked: boolean) => {}}
            >
              <span className="text-body font-body text-default-font">
                Marketing
              </span>
            </CheckboxCard>
          </div>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-start self-stretch overflow-auto">
        <div className="flex w-full flex-col items-start gap-4 border-b border-solid border-neutral-border px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <FeatherFile className="text-heading-2 font-heading-2 text-default-font" />
              <span className="text-heading-2 font-heading-2 text-default-font">
                Documents
              </span>
              <Badge variant="neutral">248</Badge>
            </div>
            <div className="flex items-center gap-2">
              <SubframeCore.DropdownMenu.Root>
                <SubframeCore.DropdownMenu.Trigger asChild={true}>
                  <Button
                    variant="neutral-tertiary"
                    icon={<FeatherColumns />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Columns
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
                      <DropdownMenu.DropdownItem icon={<FeatherCheck />}>
                        Name
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherCheck />}>
                        Modified
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherCheck />}>
                        Owner
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={<FeatherCheck />}>
                        Size
                      </DropdownMenu.DropdownItem>
                      <DropdownMenu.DropdownItem icon={null}>
                        Status
                      </DropdownMenu.DropdownItem>
                    </DropdownMenu>
                  </SubframeCore.DropdownMenu.Content>
                </SubframeCore.DropdownMenu.Portal>
              </SubframeCore.DropdownMenu.Root>
              <Button
                icon={<FeatherUpload />}
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Upload
              </Button>
            </div>
          </div>
        </div>
        <div className="flex w-full flex-col items-start px-6 py-4">
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Name</Table.HeaderCell>
                <Table.HeaderCell icon={<FeatherChevronDown />}>
                  Modified
                </Table.HeaderCell>
                <Table.HeaderCell>Owner</Table.HeaderCell>
                <Table.HeaderCell>Size</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            <Table.Row clickable={true}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <FeatherFileText className="text-body font-body text-error-600" />
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    Q4_Financial_Report.pdf
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  2 hours ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="x-small"
                    image="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
                  >
                    J
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-default-font">
                    John Smith
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  2.4 MB
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <IconButton
                    size="small"
                    icon={<FeatherDownload />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="small"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                            Preview
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                            Share
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row clickable={true}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <FeatherFileText className="text-body font-body text-error-600" />
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    Employee_Handbook_2024.pdf
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  Yesterday
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="x-small"
                    image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop"
                  >
                    S
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-default-font">
                    Sarah Chen
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  1.8 MB
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <IconButton
                    size="small"
                    icon={<FeatherDownload />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="small"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                            Preview
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                            Share
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row clickable={true}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <FeatherFileText className="text-body font-body text-error-600" />
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    Marketing_Strategy_2024.pdf
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  3 days ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="x-small"
                    image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                  >
                    M
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-default-font">
                    Mike Johnson
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  3.2 MB
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <IconButton
                    size="small"
                    icon={<FeatherDownload />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="small"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                            Preview
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                            Share
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row clickable={true}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <FeatherFileText className="text-body font-body text-error-600" />
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    Legal_Contract_Draft.pdf
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  1 week ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="x-small"
                    image="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
                  >
                    E
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-default-font">
                    Emily Davis
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  892 KB
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <IconButton
                    size="small"
                    icon={<FeatherDownload />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="small"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                            Preview
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                            Share
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
            <Table.Row clickable={true}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  <FeatherFileText className="text-body font-body text-error-600" />
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    Product_Roadmap_Q1.pdf
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  2 weeks ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center gap-2">
                  <Avatar
                    size="x-small"
                    image="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                  >
                    D
                  </Avatar>
                  <span className="whitespace-nowrap text-body font-body text-default-font">
                    David Lee
                  </span>
                </div>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-subtext-color">
                  1.5 MB
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-end gap-2">
                  <IconButton
                    size="small"
                    icon={<FeatherDownload />}
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  />
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        size="small"
                        icon={<FeatherMoreHorizontal />}
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                            Preview
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                            Share
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherEdit2 />}>
                            Edit
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </Table.Cell>
            </Table.Row>
          </Table>
        </div>
      </div>
      <div className="flex w-96 flex-none flex-col items-start gap-6 self-stretch border-l border-solid border-neutral-border bg-default-background px-6 py-6 overflow-auto">
        <div className="flex w-full items-center justify-between">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Document Details
          </span>
          <IconButton
            size="small"
            icon={<FeatherX />}
            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
          />
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full flex-col items-center gap-2 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-8">
            <img
              className="h-48 w-full flex-none rounded-md object-cover shadow-md"
              src="https://images.unsplash.com/photo-1568667256549-094345857637?w=400&h=600&fit=crop"
            />
            <span className="text-caption font-caption text-subtext-color">
              Q4_Financial_Report.pdf
            </span>
          </div>
          <div className="flex w-full flex-col items-start border-b border-solid border-neutral-border bg-default-background">
            <Accordion
              trigger={
                <div className="flex w-full items-center gap-2 px-2 py-3">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Basic Information
                  </span>
                  <Accordion.Chevron />
                </div>
              }
              defaultOpen={true}
            >
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 px-2 pb-4">
                <TextField
                  className="h-auto w-full flex-none"
                  label="Title"
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Q4_Financial_Report"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
                <TextArea
                  className="h-auto w-full flex-none"
                  label="Description"
                  helpText=""
                >
                  <TextArea.Input
                    placeholder="Financial report for Q4 2024 including revenue, expenses, and projections"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLTextAreaElement>
                    ) => {}}
                  />
                </TextArea>
              </div>
            </Accordion>
          </div>
          <div className="flex w-full flex-col items-start border-b border-solid border-neutral-border bg-default-background">
            <Accordion
              trigger={
                <div className="flex w-full items-center gap-2 px-2 py-3">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Classification
                  </span>
                  <Accordion.Chevron />
                </div>
              }
              defaultOpen={true}
            >
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 px-2 pb-4">
                <Select
                  className="h-auto w-full flex-none"
                  label="Category"
                  placeholder="Finance"
                  helpText=""
                  value={undefined}
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="Finance">Finance</Select.Item>
                  <Select.Item value="Legal">Legal</Select.Item>
                  <Select.Item value="HR">HR</Select.Item>
                  <Select.Item value="Marketing">Marketing</Select.Item>
                </Select>
                <TextField
                  className="h-auto w-full flex-none"
                  label="Tags"
                  helpText=""
                >
                  <TextField.Input
                    placeholder="quarterly, finance, report"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
                <Select
                  className="h-auto w-full flex-none"
                  label="Status"
                  placeholder="Published"
                  helpText=""
                  value={undefined}
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="Published">Published</Select.Item>
                  <Select.Item value="Draft">Draft</Select.Item>
                  <Select.Item value="Archived">Archived</Select.Item>
                </Select>
              </div>
            </Accordion>
          </div>
          <div className="flex w-full flex-col items-start border-b border-solid border-neutral-border bg-default-background">
            <Accordion
              trigger={
                <div className="flex w-full items-center gap-2 px-2 py-3">
                  <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                    Ownership
                  </span>
                  <Accordion.Chevron />
                </div>
              }
              defaultOpen={true}
            >
              <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-4 px-2 pb-4">
                <Select
                  className="h-auto w-full flex-none"
                  label="Owner"
                  placeholder="John Smith"
                  helpText=""
                  value={undefined}
                  onValueChange={(value: string) => {}}
                >
                  <Select.Item value="John Smith">John Smith</Select.Item>
                  <Select.Item value="Sarah Chen">Sarah Chen</Select.Item>
                  <Select.Item value="Mike Johnson">Mike Johnson</Select.Item>
                </Select>
                <TextField
                  className="h-auto w-full flex-none"
                  label="Created"
                  helpText=""
                >
                  <TextField.Input
                    placeholder="Dec 15, 2024 at 2:30 PM"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
                <TextField
                  className="h-auto w-full flex-none"
                  label="Modified"
                  helpText=""
                >
                  <TextField.Input
                    placeholder="2 hours ago"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
              </div>
            </Accordion>
          </div>
          <div className="flex w-full items-center gap-2">
            <Button
              className="h-8 grow shrink-0 basis-0"
              variant="neutral-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Cancel
            </Button>
            <Button
              className="h-8 grow shrink-0 basis-0"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DocumentManagementHub;

