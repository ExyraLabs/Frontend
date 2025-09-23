"use client";
import React from "react";
import Image from "next/image";
import Modal from "./Modal";
import { getToolIcon } from "@/utils/constants";

export type AgentToolParam = {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
};

export type AgentTool = {
  name: string;
  description?: string;
  params?: AgentToolParam[];
};

export interface AgentInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  icon: string;
  title: string;
  subtitle?: string;
  tools?: AgentTool[];
  prompts?: string[];
}

const AgentInfoModal: React.FC<AgentInfoModalProps> = ({
  isOpen,
  onClose,
  icon,
  title,
  subtitle,
  tools = [],
  prompts = [],
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-[92vw] max-w-[800px] bg-[#1c1c1c] border border-[#2a2a2a] rounded-2xl p-5 md:p-6 text-white">
        {/* Header */}
        <div className="flex items-start gap-3 md:gap-4">
          <div className="relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full overflow-hidden">
            <Image src={icon} alt={title} fill className="object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer text-[#aaa] hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {subtitle && (
              <p className="text-xs md:text-sm text-[#B5B5B5] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-[#9B9D9D] mb-2">
              Available Tools
            </h3>
            {tools.length === 0 ? (
              <div className="text-[#B5B5B5] text-sm">
                No tools documented for this agent yet.
              </div>
            ) : (
              <ul className="space-y-3 max-h-[280px] md:max-h-[360px] overflow-y-auto scrollbar-hide pr-1">
                {tools.map((tool) => {
                  const iconSrc = getToolIcon(tool.name);
                  return (
                    <li
                      key={tool.name}
                      className="bg-[#232323] rounded-xl p-3 border border-[#2f2f2f]"
                    >
                      <div className="flex items-start gap-2">
                        {iconSrc ? (
                          <Image
                            src={iconSrc}
                            alt={tool.name}
                            width={20}
                            height={20}
                            className="rounded"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-[#333] flex items-center justify-center text-[10px] text-[#bbb]">
                            {tool.name.at(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {tool.name}
                            </span>
                          </div>
                          {tool.description && (
                            <p className="text-xs text-[#B5B5B5] mt-0.5">
                              {tool.description}
                            </p>
                          )}
                          {tool.params && tool.params.length > 0 && (
                            <div className="mt-2">
                              <div className="text-[11px] text-[#9B9D9D] font-semibold mb-1">
                                Parameters
                              </div>
                              <ul className="space-y-1">
                                {tool.params.map((p) => (
                                  <li
                                    key={`${tool.name}-${p.name}`}
                                    className="text-[12px] leading-snug"
                                  >
                                    <span className="text-[#E5E7EB] font-medium">
                                      {p.name}
                                    </span>
                                    <span className="text-[#9CA3AF]">
                                      : {p.type}
                                    </span>
                                    {p.required ? (
                                      <span className="ml-1 inline-block px-1.5 py-[2px] rounded bg-[#3a3a3a] text-[10px] text-[#f1f1f1]">
                                        required
                                      </span>
                                    ) : (
                                      <span className="ml-1 inline-block px-1.5 py-[2px] rounded bg-[#2b2b2b] text-[10px] text-[#9CA3AF]">
                                        optional
                                      </span>
                                    )}
                                    {p.description && (
                                      <div className="text-[#B5B5B5] text-[11px] mt-0.5">
                                        {p.description}
                                      </div>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Suggested Prompts */}
          <div>
            <h3 className="text-sm font-semibold text-[#9B9D9D] mb-2">
              Example Prompts
            </h3>
            {prompts.length === 0 ? (
              <div className="text-[#B5B5B5] text-sm">
                No example prompts available.
              </div>
            ) : (
              <ul className="space-y-2 max-h-[280px] md:max-h-[360px] overflow-y-auto pr-1">
                {prompts.map((p, idx) => (
                  <li
                    key={`${idx}-${p.slice(0, 12)}`}
                    className="text-sm text-[#EDEDED] bg-[#232323] border border-[#2f2f2f] rounded-xl px-3 py-2"
                    title={p}
                  >
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-lg bg-[#2b2b2b] hover:bg-[#3a3a3a] text-sm text-white"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AgentInfoModal;
