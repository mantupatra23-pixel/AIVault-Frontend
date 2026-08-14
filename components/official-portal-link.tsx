"use client";

import { trackToolClick } from "@/lib/traffic-tracker";

type Props = {
  href: string;
  slug: string;
  name: string;
  category?: string | null;
  children: React.ReactNode;
  className?: string;
};

export default function OfficialPortalLink({
  href,
  slug,
  name,
  category,
  children,
  className,
}: Props) {
  const handleClick = () => {
    try {
      trackToolClick(
        slug,
        name,
        category || "General AI"
      );
    } catch (error) {
      console.error(
        "[OFFICIAL_PORTAL_CLICK_ERR]",
        error
      );
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={className}
    >
      {children}
    </a>
  );
}
