"use client";

import {
  CSSProperties,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type Vault3DProps = {
  children: ReactNode;
  className?: string;
  intensity?: number;
};

export default function Vault3D({
  children,
  className = "",
  intensity = 10,
}: Vault3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const update = () => {
      setReducedMotion(media.matches);
    };

    update();

    media.addEventListener?.("change", update);

    return () => {
      media.removeEventListener?.("change", update);
    };
  }, []);

  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (reducedMotion || !ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const x =
      (event.clientX - rect.left) /
      rect.width;

    const y =
      (event.clientY - rect.top) /
      rect.height;

    const rotateY =
      (x - 0.5) * intensity;

    const rotateX =
      (0.5 - y) * intensity;

    ref.current.style.setProperty(
      "--vault-rx",
      `${rotateX}deg`
    );

    ref.current.style.setProperty(
      "--vault-ry",
      `${rotateY}deg`
    );

    ref.current.style.setProperty(
      "--vault-mx",
      `${x * 100}%`
    );

    ref.current.style.setProperty(
      "--vault-my",
      `${y * 100}%`
    );
  };

  const resetPointer = () => {
    if (!ref.current) return;

    ref.current.style.setProperty(
      "--vault-rx",
      "0deg"
    );

    ref.current.style.setProperty(
      "--vault-ry",
      "0deg"
    );

    ref.current.style.setProperty(
      "--vault-mx",
      "50%"
    );

    ref.current.style.setProperty(
      "--vault-my",
      "50%"
    );
  };

  const style = {
    "--vault-rx": "0deg",
    "--vault-ry": "0deg",
    "--vault-mx": "50%",
    "--vault-my": "50%",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className={`vault-3d-wrap ${className}`}
    >
      <div className="vault-3d-glow" />
      <div className="vault-3d-content">
        {children}
      </div>
    </div>
  );
}
