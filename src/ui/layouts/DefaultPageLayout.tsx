"use client";
/*
 * Documentation:
 * Avatar — https://app.subframe.com/af1371ce7f26/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 * Button — https://app.subframe.com/af1371ce7f26/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 * Default Page Layout — https://app.subframe.com/af1371ce7f26/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Dropdown Menu — https://app.subframe.com/af1371ce7f26/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Icon Button — https://app.subframe.com/af1371ce7f26/library?component=Icon+Button_af9405b1-8c54-4e01-9786-5aad308224f6
 * Sidebar with sections — https://app.subframe.com/af1371ce7f26/library?component=Sidebar+with+sections_f4047c8b-cfb4-4761-b9cf-fbcae8a9b9b5
 */

import React from "react";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherBuilding } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherColumns } from "@subframe/core";
import { FeatherDollarSign } from "@subframe/core";
import { FeatherEye } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherGauge } from "@subframe/core";
import { FeatherHome } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherLogOut } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherRocket } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherTag } from "@subframe/core";
import { FeatherTent } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherWebhook } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { DropdownMenu } from "../components/DropdownMenu";
import { IconButton } from "../components/IconButton";
import { SidebarWithSections } from "../components/SidebarWithSections";
import * as SubframeUtils from "../utils";

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const DefaultPageLayoutRoot = React.forwardRef<
  HTMLDivElement,
  DefaultPageLayoutRootProps
>(function DefaultPageLayoutRoot(
  { children, className, ...otherProps }: DefaultPageLayoutRootProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full items-start",
        className
      )}
      ref={ref}
      {...otherProps}
    >
      <SidebarWithSections
        className="mobile:hidden"
        header={
          <img
            className="h-6 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/y2rsnhq3mex4auk54aye.png"
          />
        }
        footer={
          <>
            <div className="flex grow shrink-0 basis-0 items-start gap-2">
              <Avatar image="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg">
                A
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-caption-bold font-caption-bold text-default-font">
                  Irvin
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Founder
                </span>
              </div>
            </div>
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <IconButton size="small" icon={<FeatherMoreHorizontal />} />
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                >
                  <DropdownMenu>
                    <DropdownMenu.DropdownItem icon={<FeatherUser />}>
                      Profile
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem icon={<FeatherSettings />}>
                      Settings
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem icon={<FeatherLogOut />}>
                      Log out
                    </DropdownMenu.DropdownItem>
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </>
        }
      >
        <div className="flex w-full flex-col items-start gap-2 py-4">
          <span className="text-caption-bold font-caption-bold text-subtext-color uppercase">
            Saved Views
          </span>
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                className="h-8 w-full flex-none"
                variant="neutral-secondary"
                iconRight={<FeatherChevronDown />}
              >
                All Documents
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
                  <DropdownMenu.DropdownItem icon={null}>
                    All Documents
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>
                    Recent
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>
                    Pending Review
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>
                    Archived
                  </DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
        </div>
        <div className="flex w-full flex-col items-start gap-2 py-4">
          <span className="text-caption-bold font-caption-bold text-subtext-color uppercase">
            Instance
          </span>
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                className="h-8 w-full flex-none"
                variant="neutral-secondary"
                iconRight={<FeatherChevronDown />}
              >
                Production
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
                  <DropdownMenu.DropdownItem icon={null}>
                    Production
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>
                    Staging
                  </DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>
                    Development
                  </DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
        </div>
        <SidebarWithSections.NavItem icon={<FeatherHome />} selected={true}>
          Home
        </SidebarWithSections.NavItem>
        <SidebarWithSections.NavItem icon={<FeatherInbox />}>
          Inbox
        </SidebarWithSections.NavItem>
        <SidebarWithSections.NavItem icon={<FeatherBarChart2 />}>
          Reports
        </SidebarWithSections.NavItem>
        <SidebarWithSections.NavSection label="Analytics">
          <SidebarWithSections.NavItem icon={<FeatherGauge />}>
            Dashboard
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem icon={<FeatherRocket />}>
            Trends
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem icon={<FeatherTent />}>
            Campaigns
          </SidebarWithSections.NavItem>
        </SidebarWithSections.NavSection>
        <div className="flex w-full flex-col items-start gap-2 py-6">
          <span className="text-caption-bold font-caption-bold text-subtext-color uppercase">
            Open Documents
          </span>
          <div className="flex w-full flex-col items-start gap-1">
            <Button
              className="h-6 w-full flex-none justify-start"
              variant="neutral-tertiary"
              size="small"
            >
              Q3_Financial_Report_2024.pdf
            </Button>
            <Button
              className="h-6 w-full flex-none justify-start"
              variant="neutral-tertiary"
              size="small"
            >
              Service_Agreement_2024.pdf
            </Button>
            <Button
              className="h-6 w-full flex-none justify-start"
              variant="neutral-tertiary"
              size="small"
            >
              Invoice_INV-2024-1847.pdf
            </Button>
          </div>
        </div>
        <SidebarWithSections.NavSection label="Settings">
          <SidebarWithSections.NavItem icon={<FeatherBuilding />}>
            Company
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem icon={<FeatherDollarSign />}>
            Payments
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem icon={<FeatherWebhook />}>
            Integrations
          </SidebarWithSections.NavItem>
          <div className="flex w-full flex-col items-start gap-2 px-4 py-4">
            <span className="text-caption-bold font-caption-bold text-subtext-color uppercase">
              Manage
            </span>
            <div className="flex w-full flex-col items-start gap-1">
              <Button
                className="h-6 w-full flex-none justify-start"
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherUsers />}
              >
                Correspondents
              </Button>
              <Button
                className="h-6 w-full flex-none justify-start"
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherTag />}
              >
                Tags
              </Button>
              <Button
                className="h-6 w-full flex-none justify-start"
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherFileText />}
              >
                Document Types
              </Button>
              <Button
                className="h-6 w-full flex-none justify-start"
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherColumns />}
              >
                Fields
              </Button>
              <Button
                className="h-6 w-full flex-none justify-start"
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherEye />}
              >
                Views
              </Button>
            </div>
          </div>
        </SidebarWithSections.NavSection>
      </SidebarWithSections>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
