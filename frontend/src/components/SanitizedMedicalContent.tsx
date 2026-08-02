"use client";

import React from 'react';
import { sanitizeHealthcareOutput, SanitizedOutputResult, SanitizedBlock } from '../utils/sanitizeHealthcareOutput';
import { AlertCircle, CheckCircle2, Info, FileText, Activity, Copy, Check } from 'lucide-react';

interface SanitizedMedicalContentProps {
  content: any;
  className?: string;
  badgeLabel?: string;
}

interface GroupedBlock {
  type: 'kv-group' | 'single';
  block?: SanitizedBlock;
  items?: SanitizedBlock[];
}

function processBlocks(blocks: SanitizedBlock[]): GroupedBlock[] {
  const result: GroupedBlock[] = [];
  let currentKv: SanitizedBlock[] = [];

  const flushKv = () => {
    if (currentKv.length > 0) {
      result.push({ type: 'kv-group', items: [...currentKv] });
      currentKv = [];
    }
  };

  for (const b of blocks) {
    if (b.type === 'kv') {
      currentKv.push(b);
    } else {
      flushKv();
      result.push({ type: 'single', block: b });
    }
  }
  flushKv();

  return result;
}

export const SanitizedMedicalContent: React.FC<SanitizedMedicalContentProps> = ({
  content,
  className = '',
  badgeLabel = 'Clinical Grade Output',
}) => {
  const result: SanitizedOutputResult = sanitizeHealthcareOutput(content);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!result.cleanText) return;
    navigator.clipboard.writeText(result.cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result.cleanText && !result.isJson) {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs italic ${className}`}>
        No clinical output recorded.
      </div>
    );
  }

  // 1. If output is raw stringified JSON, render as a structured JSON visual card / table
  if (result.isJson && result.jsonData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Structured Clinical Data
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            {badgeLabel}
          </span>
        </div>

        <RenderJsonPayload data={result.jsonData} />
      </div>
    );
  }

  const groupedBlocks = processBlocks(result.blocks);

  // 2. Render structured blocks
  return (
    <div className={`space-y-3 font-sans text-slate-800 text-sm leading-relaxed ${className}`}>
      {badgeLabel && (
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            {badgeLabel}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-teal-700 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-md transition-colors shadow-2xs"
            title="Copy Cleaned Summary"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      )}

      {groupedBlocks.map((gb, idx) => {
        if (gb.type === 'kv-group' && gb.items) {
          return (
            <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/60 overflow-hidden divide-y divide-slate-200/70 my-2 shadow-2xs">
              {gb.items.map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-100/40 transition-colors">
                  <span className="font-bold text-slate-700 sm:w-48 sm:shrink-0">
                    {renderTextWithBold(item.key)}
                  </span>
                  <span className="text-slate-900 font-medium leading-relaxed flex-1">
                    {renderTextWithBold(item.value)}
                  </span>
                </div>
              ))}
            </div>
          );
        }
        if (gb.block) {
          return <RenderBlock key={idx} block={gb.block} />;
        }
        return null;
      })}
    </div>
  );
};

// Helper to render bold markdown text
const renderTextWithBold = (text: string | undefined) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

// Helper renderer for individual block types
const RenderBlock: React.FC<{ block: SanitizedBlock }> = ({ block }) => {
  switch (block.type) {
    case 'header': {
      if (block.level === 1) {
        return (
          <h2 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mt-5 mb-2 first:mt-0 tracking-tight">
            {renderTextWithBold(block.title)}
          </h2>
        );
      }
      if (block.level === 2) {
        return (
          <h3 className="text-sm sm:text-base font-bold text-slate-800 mt-4 mb-1.5 first:mt-0 tracking-tight">
            {renderTextWithBold(block.title)}
          </h3>
        );
      }
      return (
        <h4 className="text-xs sm:text-sm font-bold text-teal-800 uppercase tracking-wider mt-4 mb-1.5 first:mt-0 pb-1 border-b border-teal-100/80">
          {renderTextWithBold(block.title)}
        </h4>
      );
    }

    case 'list': {
      return (
        <ul className="space-y-1.5 my-2 pl-1">
          {block.items?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
              <span className="leading-relaxed">{renderTextWithBold(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    case 'kv': {
      return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 my-2 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 text-xs sm:text-sm">
          <span className="font-bold text-slate-700 sm:w-48 sm:shrink-0">
            {renderTextWithBold(block.key)}
          </span>
          <span className="text-slate-900 font-medium leading-relaxed flex-1">
            {renderTextWithBold(block.value)}
          </span>
        </div>
      );
    }

    case 'callout': {
      const isWarn = block.variant === 'warning';
      const isSuccess = block.variant === 'success';

      return (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-3 my-2 text-xs sm:text-sm ${
            isWarn
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : isSuccess
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-teal-50/80 border-teal-200 text-teal-900'
          }`}
        >
          {isWarn ? (
            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4.5 h-4.5 text-teal-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider text-[10px] sm:text-[11px] block mb-0.5">
              {block.title}
            </span>
            <p className="leading-relaxed">{renderTextWithBold(block.text)}</p>
          </div>
        </div>
      );
    }

    case 'divider': {
      return <hr className="border-t border-slate-200 my-3" />;
    }

    case 'paragraph':
    default: {
      return (
        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed my-1.5">
          {renderTextWithBold(block.text)}
        </p>
      );
    }
  }
};

// Helper renderer for JSON payload into clean clinical cards
const RenderJsonPayload: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;

  // 1. If text string exists inside object, sanitize and render blocks directly
  const embeddedText = data.responseText || data.generatedReport || data.message || data.report || data.aiReport;
  if (typeof embeddedText === 'string') {
    const subResult = sanitizeHealthcareOutput(embeddedText);
    if (subResult.blocks.length > 0) {
      const grouped = processBlocks(subResult.blocks);
      return (
        <div className="space-y-3 font-sans text-slate-800 text-sm leading-relaxed">
          {grouped.map((gb, idx) => {
            if (gb.type === 'kv-group' && gb.items) {
              return (
                <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/60 overflow-hidden divide-y divide-slate-200/70 my-2 shadow-2xs">
                  {gb.items.map((item, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-100/40 transition-colors">
                      <span className="font-bold text-slate-700 sm:w-48 sm:shrink-0">
                        {renderTextWithBold(item.key)}
                      </span>
                      <span className="text-slate-900 font-medium leading-relaxed flex-1">
                        {renderTextWithBold(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            }
            if (gb.block) return <RenderBlock key={idx} block={gb.block} />;
            return null;
          })}
        </div>
      );
    }
  }

  // 2. If payload has structured OPD fields (differentialDiagnoses, treatmentOptions, safetyFlags, etc.)
  const differentials = data.differentialDiagnoses || data.differentials;
  const treatments = data.treatmentOptions || data.treatments;
  const safetyFlags = data.safetyFlags || data.flags;
  const nextSteps = data.diagnosticNextSteps || data.nextSteps;
  const clinicalPearl = data.clinicalPearl;

  const hasStructuredOpd = differentials || treatments || safetyFlags || nextSteps || clinicalPearl;

  if (hasStructuredOpd) {
    return (
      <div className="space-y-5">
        {/* Safety Flags */}
        {Array.isArray(safetyFlags) && safetyFlags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" /> Clinical Safety Guardrails
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {safetyFlags.map((flag: any, fIdx: number) => {
                const isCrit = flag.severity === 'critical';
                const isMod = flag.severity === 'moderate';
                return (
                  <div
                    key={fIdx}
                    className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                      isCrit
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : isMod
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-teal-50 border-teal-200 text-teal-900'
                    }`}
                  >
                    <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-white/80 border shrink-0">
                      {flag.severity || 'Caution'}
                    </span>
                    <p className="leading-relaxed font-medium">{flag.message || String(flag)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Differential Diagnoses */}
        {Array.isArray(differentials) && differentials.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" /> Differential Diagnoses & Likelihood
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {differentials.map((diff: any, dIdx: number) => {
                const isHigh = diff.likelihood === 'high' || (diff.likelihood_percentage && diff.likelihood_percentage >= 70);
                return (
                  <div key={dIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">{diff.condition}</span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          isHigh
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {diff.likelihood_percentage ? `${diff.likelihood_percentage}%` : diff.likelihood}
                      </span>
                    </div>
                    {diff.icdCode && (
                      <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 inline-block">
                        ICD-10: {diff.icdCode}
                      </span>
                    )}
                    {diff.reasoning && (
                      <p className="text-xs text-slate-600 leading-relaxed">{diff.reasoning}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Treatment Options */}
        {Array.isArray(treatments) && treatments.length > 0 && (
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-600" /> ICMR Prescribed Treatment Protocol
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3">Medication</th>
                    <th className="p-3">Dosage & Route</th>
                    <th className="p-3">Frequency</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Clinical Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {treatments.map((rx: any, rxIdx: number) => (
                    <tr key={rxIdx} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-teal-900">
                        {rx.drugName}
                        {rx.indianBrandNames && (
                          <span className="text-[10px] block text-slate-400 font-normal">
                            Brands: {Array.isArray(rx.indianBrandNames) ? rx.indianBrandNames.join(', ') : rx.indianBrandNames}
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-medium">{rx.dosage} ({rx.route || 'Oral'})</td>
                      <td className="p-3 font-medium">{rx.frequency}</td>
                      <td className="p-3 font-medium">{rx.duration}</td>
                      <td className="p-3 text-slate-600 leading-normal">{rx.notes || rx.contraindications?.join(', ') || 'Standard protocol'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Diagnostic Next Steps */}
        {Array.isArray(nextSteps) && nextSteps.length > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Recommended Next Steps & Labs</h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {nextSteps.map((step: any, sIdx: number) => (
                <li key={sIdx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
                  <span>{String(step)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clinical Pearl */}
        {clinicalPearl && (
          <div className="p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 text-teal-900 text-xs space-y-1">
            <span className="font-bold uppercase tracking-wider text-[10px] text-teal-800 block">💡 Clinical Insight Pearl</span>
            <p className="leading-relaxed font-medium">{clinicalPearl}</p>
          </div>
        )}
      </div>
    );
  }

  // 3. Fallback array / object table
  if (Array.isArray(data)) {
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              {Object.keys(data[0] || {}).map((key) => (
                <th key={key} className="p-3">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50">
                {Object.values(row).map((val: any, i) => (
                  <td key={i} className="p-3">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
              {key.replace(/_/g, ' ')}
            </span>
            {typeof val === 'object' && val !== null ? (
              <RenderJsonPayload data={val} />
            ) : (
              <span className="text-sm font-semibold text-slate-900">{String(val)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-slate-700 text-xs">{String(data)}</p>;
};

export default SanitizedMedicalContent;
