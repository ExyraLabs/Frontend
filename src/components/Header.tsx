"use client";
import React, { useState } from "react";
import Logo from "./Logo";
import WalletConnector from "./WalletConnector";
import Sidebar from "./Sidebar";
import APIKeysModal from "./APIKeysModal";
import { Icon } from "@iconify/react";

const Header = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [keysOpen, setKeysOpen] = useState(false);

  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev);
  const handleSidebarClose = () => setSidebarOpen(false);

  return (
    <>
      <div className="flex  min-h-[10vh] justify-start items-center px-4 py-3 ">
        {/* Hamburger menu for mobile */}
        <button
          className="md:hidden text-primary mr-3 focus:outline-none"
          aria-label="Toggle sidebar"
          onClick={handleSidebarToggle}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Logo />
        <div className="ml-auto  flex items-center gap-2">
          <button
            type="button"
            aria-label="Open API keys modal"
            onClick={() => setKeysOpen(true)}
            className="rounded-md lg:flex hidden text-sm  items-center cursor-pointer border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
          >
            <Icon icon="game-icons:house-keys" width={18} height={18} />
            API Keys
          </button>
          <button
            type="button"
            aria-label="Open API keys modal"
            onClick={() => setKeysOpen(true)}
            className="rounded-md lg:hidden text-sm flex items-center cursor-pointer border border-white/10 bg-white/5 p-2 text-white hover:bg-white/10"
          >
            <Icon icon="game-icons:house-keys" width={18} height={18} />
          </button>
          <WalletConnector />
        </div>
      </div>
      {/* Sidebar for mobile */}
      <div className="flex lg:hidden">
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      </div>
      <APIKeysModal isOpen={keysOpen} onClose={() => setKeysOpen(false)} />
    </>
  );
};

export default Header;
