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
import { usePathname, useRouter } from "next/navigation";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherColumns } from "@subframe/core";
import { FeatherEye } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherGauge } from "@subframe/core";
import { FeatherLogOut } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { FeatherTag } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { DropdownMenu } from "../components/DropdownMenu";
import { IconButton } from "../components/IconButton";
import { SidebarWithSections } from "../components/SidebarWithSections";
import { useAuth } from "@/lib/api/hooks/use-auth";
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
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

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
          <span className="text-heading-2 font-heading-2 text-default-font">
            Paperless-Link
          </span>
        }
        footer={
          <>
            <div className="flex grow shrink-0 basis-0 items-start gap-2">
              <Avatar>
                U
              </Avatar>
              <div className="flex flex-col items-start">
                <span className="text-caption-bold font-caption-bold text-default-font">
                  User
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  Paperless-NGX
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
                    <DropdownMenu.DropdownItem 
                      icon={<FeatherSettings />}
                      onClick={() => router.push("/settings")}
                    >
                      Settings
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem 
                      icon={<FeatherLogOut />}
                      onClick={handleLogout}
                    >
                      Log out
                    </DropdownMenu.DropdownItem>
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </>
        }
      >
        <SidebarWithSections.NavItem 
          icon={<FeatherGauge />} 
          selected={pathname === "/dashboard"}
          onClick={() => router.push("/dashboard")}
        >
          Dashboard
        </SidebarWithSections.NavItem>
        <SidebarWithSections.NavItem 
          icon={<FeatherFileText />} 
          selected={pathname === "/documents" || pathname?.startsWith("/documents/")}
          onClick={() => router.push("/documents")}
        >
          Documents
        </SidebarWithSections.NavItem>
        <SidebarWithSections.NavSection label="Manage">
          <SidebarWithSections.NavItem 
            icon={<FeatherUsers />}
            onClick={() => router.push("/correspondents")}
          >
            Correspondents
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon={<FeatherTag />}
            onClick={() => router.push("/tags")}
          >
            Tags
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon={<FeatherFileText />}
            onClick={() => router.push("/document-types")}
          >
            Document Types
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon={<FeatherColumns />}
            onClick={() => router.push("/custom-fields")}
          >
            Custom Fields
          </SidebarWithSections.NavItem>
          <SidebarWithSections.NavItem 
            icon={<FeatherEye />}
            onClick={() => router.push("/saved-views")}
          >
            Saved Views
          </SidebarWithSections.NavItem>
        </SidebarWithSections.NavSection>
        <SidebarWithSections.NavSection label="Settings">
          <SidebarWithSections.NavItem 
            icon={<FeatherSettings />}
            selected={pathname === "/settings"}
            onClick={() => router.push("/settings")}
          >
            Settings
          </SidebarWithSections.NavItem>
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
