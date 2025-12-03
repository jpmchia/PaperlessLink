"use client";
/*
 * Documentation:
 * Badge — https://app.subframe.com/af1371ce7f26/library?component=Badge_97bdb082-1124-4dd7-a335-b14b822d0157
 * Button — https://app.subframe.com/af1371ce7f26/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 * Link Button — https://app.subframe.com/af1371ce7f26/library?component=Link+Button_a4ee726a-774c-4091-8c49-55b659356024
 * Metadata — https://app.subframe.com/af1371ce7f26/library?component=Metadata_d23e5f35-ec51-4cb2-b290-533de4f1ad3e
 * Tabs — https://app.subframe.com/af1371ce7f26/library?component=Tabs_e1ad5091-8ad8-4319-b1f7-3e47f0256c20
 */

import React from "react";
import { FeatherContact } from "@subframe/core";
import { FeatherGlobe } from "@subframe/core";
import { FeatherTag } from "@subframe/core";
import { FeatherText } from "@subframe/core";
import * as SubframeUtils from "../utils";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { LinkButton } from "./LinkButton";
import { Tabs } from "./Tabs";

interface MetadataRootProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const MetadataRoot = React.forwardRef<HTMLDivElement, MetadataRootProps>(
  function MetadataRoot({ className, ...otherProps }: MetadataRootProps, ref) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          "flex flex-col items-start gap-2",
          className
        )}
        ref={ref}
        {...otherProps}
      >
        <div className="flex w-96 flex-col items-start gap-6">
          <div className="flex w-full flex-col items-start gap-4">
            <Tabs>
              <Tabs.Item active={true}>Details</Tabs.Item>
              <Tabs.Item active={false}>Comments</Tabs.Item>
            </Tabs>
          </div>
          <div className="flex w-full flex-col items-start gap-4">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Profile Details
            </span>
            <div className="flex w-full flex-col items-start gap-3">
              <div className="flex w-full items-center gap-2">
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <FeatherGlobe className="text-body font-body text-subtext-color" />
                  <span className="text-body font-body text-subtext-color">
                    Domain
                  </span>
                </div>
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <LinkButton>sweetgreen.com</LinkButton>
                </div>
              </div>
              <div className="flex w-full items-center gap-2">
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <FeatherContact className="text-body font-body text-subtext-color" />
                  <span className="text-body font-body text-subtext-color">
                    Name
                  </span>
                </div>
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <span className="line-clamp-1 grow shrink-0 basis-0 text-body font-body text-default-font">
                    sweetgreen
                  </span>
                </div>
              </div>
              <div className="flex w-full items-center gap-2">
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <FeatherText className="text-body font-body text-subtext-color" />
                  <span className="text-body font-body text-subtext-color">
                    Description
                  </span>
                </div>
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <span className="line-clamp-1 grow shrink-0 basis-0 text-body font-body text-default-font">
                    sweetgreen offers simple, seasonal, and healthy salads.
                  </span>
                </div>
              </div>
              <div className="flex w-full items-center gap-2">
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <FeatherTag className="text-body font-body text-subtext-color" />
                  <span className="text-body font-body text-subtext-color">
                    Categories
                  </span>
                </div>
                <div className="flex grow shrink-0 basis-0 items-center gap-2">
                  <Badge>Retail</Badge>
                  <Badge>Food</Badge>
                  <Badge>B2C</Badge>
                </div>
              </div>
              <Button variant="neutral-secondary" size="small">
                Show all
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export const Metadata = MetadataRoot;
