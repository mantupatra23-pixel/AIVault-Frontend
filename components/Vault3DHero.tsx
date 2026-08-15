"use client";

import {
  Canvas,
  useFrame,
  useThree,
} from "@react-three/fiber";

import {
  Float,
  OrbitControls,
  Sparkles,
  Text,
  Environment,
} from "@react-three/drei";

import {
  Suspense,
  useMemo,
  useRef,
  useState,
} from "react";

import * as THREE from "three";

/* =========================================================
   TYPES
========================================================= */

type CoreProps = {
  count?: number;
};

type FloatingLabelProps = {
  position: [number, number, number];
  children: string;
};

/* =========================================================
   AI CORE
========================================================= */

function AICore() {
  const group =
    useRef<THREE.Group>(null);

  const inner =
    useRef<THREE.Mesh>(null);

  const outer =
    useRef<THREE.Mesh>(null);

  const ring1 =
    useRef<THREE.Mesh>(null);

  const ring2 =
    useRef<THREE.Mesh>(null);

  const energyRing =
    useRef<THREE.Mesh>(null);

  useFrame(
    (
      state,
      delta
    ) => {
      if (!group.current) {
        return;
      }

      const time =
        state.clock.elapsedTime;

      /* Main core movement */

      group.current.rotation.y +=
        delta * 0.16;

      group.current.rotation.x =
        Math.sin(time * 0.45) *
        0.08;

      /* Inner crystal */

      if (inner.current) {
        inner.current.rotation.x +=
          delta * 0.45;

        inner.current.rotation.y +=
          delta * 0.7;

        const pulse =
          1 +
          Math.sin(time * 2.2) *
            0.025;

        inner.current.scale.setScalar(
          0.72 * pulse
        );
      }

      /* Outer shell */

      if (outer.current) {
        outer.current.rotation.y -=
          delta * 0.18;

        outer.current.rotation.z +=
          delta * 0.05;
      }

      /* Orbit ring */

      if (ring1.current) {
        ring1.current.rotation.x +=
          delta * 0.5;

        ring1.current.rotation.z +=
          delta * 0.18;
      }

      if (ring2.current) {
        ring2.current.rotation.y -=
          delta * 0.42;

        ring2.current.rotation.z +=
          delta * 0.12;
      }

      /* Energy ring */

      if (energyRing.current) {
        energyRing.current.rotation.y +=
          delta * 0.9;

        energyRing.current.scale.setScalar(
          1 +
            Math.sin(time * 2.8) *
              0.035
        );
      }
    }
  );

  return (
    <group
      ref={group}
      scale={1.25}
    >
      {/* =====================================================
          CORE GLOW
      ====================================================== */}

      <mesh ref={inner}>
        <icosahedronGeometry
          args={[
            1.15,
            3,
          ]}
        />

        <meshPhysicalMaterial
          color="#3157ff"
          emissive="#183bff"
          emissiveIntensity={2.5}
          roughness={0.12}
          metalness={0.65}
          transmission={0.15}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* =====================================================
          INNER GLASS
      ====================================================== */}

      <mesh scale={0.72}>
        <icosahedronGeometry
          args={[
            1,
            3,
          ]}
        />

        <meshPhysicalMaterial
          color="#8ea2ff"
          emissive="#536dff"
          emissiveIntensity={3}
          roughness={0.04}
          metalness={0.2}
          transmission={0.75}
          thickness={0.5}
          transparent
          opacity={0.72}
        />
      </mesh>

      {/* =====================================================
          OUTER WIREFRAME SHELL
      ====================================================== */}

      <mesh
        ref={outer}
        scale={1.45}
      >
        <icosahedronGeometry
          args={[
            1,
            2,
          ]}
        />

        <meshBasicMaterial
          color="#5270ff"
          wireframe
          transparent
          opacity={0.28}
        />
      </mesh>

      {/* =====================================================
          ORBIT RING 1
      ====================================================== */}

      <mesh
        ref={ring1}
        rotation={[
          Math.PI / 2.5,
          0,
          0,
        ]}
      >
        <torusGeometry
          args={[
            1.75,
            0.025,
            16,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#4f7cff"
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* =====================================================
          ORBIT RING 2
      ====================================================== */}

      <mesh
        ref={ring2}
        rotation={[
          0,
          Math.PI / 3,
          0,
        ]}
      >
        <torusGeometry
          args={[
            2.05,
            0.018,
            16,
            160,
          ]}
        />

        <meshBasicMaterial
          color="#9c6cff"
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* =====================================================
          ENERGY RING
      ====================================================== */}

      <mesh
        ref={energyRing}
        rotation={[
          Math.PI / 2,
          0,
          0,
        ]}
      >
        <torusGeometry
          args={[
            1.42,
            0.012,
            12,
            120,
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* =====================================================
          CORE LIGHT
      ====================================================== */}

      <pointLight
        color="#3d68ff"
        intensity={8}
        distance={8}
      />

      <pointLight
        color="#9c6cff"
        intensity={3}
        distance={5}
        position={[
          -1.5,
          1.5,
          1,
        ]}
      />
    </group>
  );
}

/* =========================================================
   ORBIT PARTICLES
========================================================= */

function OrbitParticles({
  count = 100,
}: CoreProps) {
  const points =
    useMemo(() => {
      const positions =
        new Float32Array(
          count * 3
        );

      for (
        let i = 0;
        i < count;
        i++
      ) {
        const radius =
          2.2 +
          Math.random() *
            3.5;

        const angle =
          Math.random() *
          Math.PI *
          2;

        const y =
          (Math.random() -
            0.5) *
          4;

        positions[i * 3] =
          Math.cos(angle) *
          radius;

        positions[
          i * 3 + 1
        ] = y;

        positions[
          i * 3 + 2
        ] =
          Math.sin(angle) *
          radius;
      }

      return positions;
    }, [count]);

  const ref =
    useRef<THREE.Points>(null);

  useFrame(
    (
      _state,
      delta
    ) => {
      if (!ref.current) {
        return;
      }

      ref.current.rotation.y +=
        delta * 0.025;

      ref.current.rotation.x +=
        delta * 0.008;
    }
  );

  return (
    <points ref={ref}>
      <bufferGeometry>
        {/*
         * IMPORTANT:
         * React Three Fiber expects the
         * BufferAttribute constructor
         * arguments through `args`.
         *
         * This fixes the production
         * TypeScript error.
         */}
        <bufferAttribute
          attach="attributes-position"
          args={[
            points,
            3,
          ]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#6685ff"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
      />
    </points>
  );
}

/* =========================================================
   FLOATING LABEL
========================================================= */

function FloatingLabel({
  position,
  children,
}: FloatingLabelProps) {
  return (
    <Float
      speed={1.4}
      rotationIntensity={0.2}
      floatIntensity={0.4}
    >
      <Text
        position={position}
        fontSize={0.15}
        color="#9caeff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#111936"
      >
        {children}
      </Text>
    </Float>
  );
}

/* =========================================================
   SCENE
========================================================= */

function Scene() {
  const {
    viewport,
  } = useThree();

  const scale =
    Math.min(
      1,
      viewport.width / 5.8
    );

  return (
    <>
      {/* ===================================================
          LIGHTING
      ==================================================== */}

      <ambientLight
        intensity={0.35}
      />

      <directionalLight
        position={[
          4,
          5,
          5,
        ]}
        intensity={2.2}
      />

      <pointLight
        position={[
          -4,
          -2,
          3,
        ]}
        color="#684cff"
        intensity={6}
      />

      <pointLight
        position={[
          3,
          1,
          -2,
        ]}
        color="#2f65ff"
        intensity={4}
      />

      {/* ===================================================
          ENVIRONMENT
      ==================================================== */}

      <Environment
        preset="city"
      />

      {/* ===================================================
          MAIN AI WORLD
      ==================================================== */}

      <group scale={scale}>
        <AICore />

        <OrbitParticles
          count={100}
        />

        <FloatingLabel
          position={[
            -2.5,
            1.3,
            0,
          ]}
        >
          SEARCH
        </FloatingLabel>

        <FloatingLabel
          position={[
            2.4,
            1.1,
            0,
          ]}
        >
          DISCOVER
        </FloatingLabel>

        <FloatingLabel
          position={[
            2.4,
            -1.35,
            0,
          ]}
        >
          COMPARE
        </FloatingLabel>

        <FloatingLabel
          position={[
            -2.5,
            -1.3,
            0,
          ]}
        >
          INTELLIGENCE
        </FloatingLabel>
      </group>

      {/* ===================================================
          ATMOSPHERIC PARTICLES
      ==================================================== */}

      <Sparkles
        count={70}
        scale={8}
        size={1.4}
        speed={0.25}
        opacity={0.45}
      />

      {/* ===================================================
          INTERACTION
      ==================================================== */}

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.28}
        minPolarAngle={
          Math.PI / 2.5
        }
        maxPolarAngle={
          Math.PI / 1.7
        }
      />
    </>
  );
}

/* =========================================================
   HERO
========================================================= */

export default function Vault3DHero({
  toolCount = 740,
}: {
  toolCount?: number;
}) {
  const [
    interactive,
    setInteractive,
  ] = useState(true);

  return (
    <section className="relative overflow-hidden bg-[#050714] text-white">

      {/* ===================================================
          PREMIUM BACKGROUND
      ==================================================== */}

      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Main blue aura */}

        <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[130px]" />

        {/* Top-left aura */}

        <div className="absolute left-[15%] top-[15%] h-40 w-40 rounded-full bg-indigo-500/10 blur-[90px]" />

        {/* Bottom-right aura */}

        <div className="absolute bottom-[10%] right-[10%] h-52 w-52 rounded-full bg-violet-500/10 blur-[110px]" />

        {/* Grid */}

        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)",
            backgroundSize:
              "48px 48px",
          }}
        />

        {/* Top vignette */}

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/30 to-transparent" />

        {/* Bottom vignette */}

        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* ===================================================
          HERO CONTENT
      ==================================================== */}

      <div className="relative mx-auto grid min-h-[700px] max-w-7xl items-center gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-20">

        {/* =================================================
            LEFT CONTENT
        ================================================== */}

        <div className="relative z-10 text-center lg:text-left">

          {/* Badge */}

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-blue-200 shadow-[0_0_40px_rgba(59,130,246,.08)] backdrop-blur-xl">

            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,.9)]" />

            AI INTELLIGENCE VAULT

          </div>

          {/* Main heading */}

          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">

            Discover

            <br />

            <span className="bg-gradient-to-r from-blue-300 via-white to-violet-300 bg-clip-text text-transparent">
              Intelligence.
            </span>

          </h1>

          {/* Description */}

          <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg lg:text-xl">

            Explore, compare and
            discover{" "}

            <strong className="text-white">
              {toolCount.toLocaleString()}+
            </strong>{" "}

            AI tools through the
            world&apos;s intelligent
            software vault.

          </p>

          {/* =================================================
              STATS
          ================================================== */}

          <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">

            {/* AI Tools */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 shadow-[0_10px_40px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]">

              <div className="text-xl font-black">
                {toolCount.toLocaleString()}+
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                AI Tools
              </div>

            </div>

            {/* Discoverable */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 shadow-[0_10px_40px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]">

              <div className="text-xl font-black">
                100%
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Discoverable
              </div>

            </div>

            {/* Intelligence */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 shadow-[0_10px_40px_rgba(0,0,0,.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.09]">

              <div className="text-xl font-black">
                AI
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Intelligence
              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            3D EXPERIENCE
        ================================================== */}

        <div className="relative h-[420px] w-full sm:h-[520px] lg:h-[600px]">

          {/* 3D background glow */}

          <div
            className="pointer-events-none absolute inset-0 rounded-full bg-blue-600/5 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.04] blur-[90px]"
            aria-hidden="true"
          />

          {/* =================================================
              CANVAS
          ================================================== */}

          {interactive ? (
            <Canvas
              dpr={[
                1,
                1.6,
              ]}
              camera={{
                position: [
                  0,
                  0,
                  7,
                ],
                fov: 45,
              }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference:
                  "high-performance",
              }}
              style={{
                width: "100%",
                height: "100%",
              }}
            >
              <Suspense
                fallback={
                  <mesh>
                    <sphereGeometry
                      args={[
                        1,
                        32,
                        32,
                      ]}
                    />

                    <meshBasicMaterial
                      color="#3157ff"
                      wireframe
                    />
                  </mesh>
                }
              >
                <Scene />
              </Suspense>
            </Canvas>
          ) : (
            /* =================================================
               STATIC FALLBACK
            ================================================== */

            <div className="flex h-full items-center justify-center">

              <div className="relative">

                <div className="absolute inset-[-45px] rounded-full bg-blue-500/10 blur-3xl" />

                <div className="h-40 w-40 rounded-full border border-blue-400/30 bg-blue-500/10 shadow-[0_0_100px_rgba(59,130,246,.25)]" />

              </div>

            </div>
          )}

          {/* =================================================
              3D TOGGLE
          ================================================== */}

          <button
            type="button"
            onClick={() =>
              setInteractive(
                (value) =>
                  !value
              )
            }
            aria-label={
              interactive
                ? "Disable 3D experience"
                : "Enable 3D experience"
            }
            className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-300 shadow-lg backdrop-blur-xl transition duration-300 hover:border-blue-400/30 hover:bg-white/10 hover:text-white"
          >
            {interactive
              ? "3D ON"
              : "3D OFF"}
          </button>

        </div>
      </div>

      {/* ===================================================
          BOTTOM GLOW
      ==================================================== */}

      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        aria-hidden="true"
      />

    </section>
  );
}
