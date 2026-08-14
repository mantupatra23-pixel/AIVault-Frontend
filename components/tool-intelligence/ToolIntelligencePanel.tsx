"use client";

import type { ReactNode } from "react";

import {
  calculateToolQuality,
  getToolFeatures,
  getToolPlatforms,
  getToolUseCases,
  getToolWebsite,
  type ToolIntelligenceInput,
} from "@/lib/tool-intelligence";

interface Props {
  tool: ToolIntelligenceInput;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        {title}
      </h3>

      {children}
    </section>
  );
}

function Chip({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
      {children}
    </span>
  );
}

export default function ToolIntelligencePanel({
  tool,
}: Props) {
  const quality = calculateToolQuality(tool);

  const features = getToolFeatures(tool);
  const useCases = getToolUseCases(tool);
  const platforms = getToolPlatforms(tool);
  const website = getToolWebsite(tool);

  return (
    <div className="space-y-5">

      {/* =====================================================
          LAYER 1 — CONTENT QUALITY
      ====================================================== */}

      <Section title="AI Vault Content Quality">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {quality.score}
              </div>

              <div className="text-xs text-gray-500">
                / 100
              </div>
            </div>
          </div>

          <div className="min-w-0">

            <div className="mb-1 text-xl font-semibold text-gray-900">
              {quality.label}
            </div>

            <div className="mb-3 text-sm text-gray-500">
              Grade {quality.grade}
            </div>

            {quality.strengths.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quality.strengths
                  .slice(0, 5)
                  .map((item) => (
                    <Chip key={item}>
                      {item}
                    </Chip>
                  ))}
              </div>
            )}
          </div>
        </div>

        {quality.missing.length > 0 && (
          <div className="mt-5 rounded-xl bg-gray-50 p-4">

            <div className="mb-2 text-sm font-medium text-gray-900">
              Missing information
            </div>

            <div className="flex flex-wrap gap-2">
              {quality.missing.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-sm text-gray-500"
                >
                  {item}
                </span>
              ))}
            </div>

          </div>
        )}
      </Section>

      {/* =====================================================
          TOOL OVERVIEW
      ====================================================== */}

      {tool.description && (
        <Section title="Tool Overview">
          <p className="leading-7 text-gray-600">
            {tool.description}
          </p>
        </Section>
      )}

      {/* =====================================================
          FEATURES
      ====================================================== */}

      {features.length > 0 && (
        <Section title="Features">

          <div className="grid gap-3 sm:grid-cols-2">

            {features.map((feature, index) => (
              <div
                key={`${feature}-${index}`}
                className="rounded-xl bg-gray-50 p-4"
              >
                <div className="flex gap-3">

                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-black text-xs text-white">
                    ✓
                  </span>

                  <span className="text-sm leading-6 text-gray-700">
                    {feature}
                  </span>

                </div>
              </div>
            ))}

          </div>

        </Section>
      )}

      {/* =====================================================
          USE CASES
      ====================================================== */}

      {useCases.length > 0 && (
        <Section title="Use Cases">

          <div className="flex flex-wrap gap-2">

            {useCases.map((useCase, index) => (
              <Chip key={`${useCase}-${index}`}>
                {useCase}
              </Chip>
            ))}

          </div>

        </Section>
      )}

      {/* =====================================================
          PRICING
      ====================================================== */}

      {(tool.pricing ||
        tool.pricing_model ||
        tool.pricingModel) && (
        <Section title="Pricing">

          <p className="text-gray-700">
            {tool.pricing ||
              tool.pricing_model ||
              tool.pricingModel}
          </p>

        </Section>
      )}

      {/* =====================================================
          PLATFORMS
      ====================================================== */}

      {platforms.length > 0 && (
        <Section title="Platforms">

          <div className="flex flex-wrap gap-2">

            {platforms.map((platform) => (
              <Chip key={platform}>
                {platform}
              </Chip>
            ))}

          </div>

        </Section>
      )}

      {/* =====================================================
          OFFICIAL WEBSITE
      ====================================================== */}

      {website && (
        <Section title="Official Website">

          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-black px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Visit Official Website →
          </a>

        </Section>
      )}

    </div>
  );
}
