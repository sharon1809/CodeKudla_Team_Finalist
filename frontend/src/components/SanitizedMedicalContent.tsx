"use client";

import React from 'react';
import { sanitizeHealthcareOutput, SanitizedOutputResult, SanitizedBlock } from '../utils/sanitizeHealthcareOutput';
import { AlertCircle, CheckCircle2, Info, FileText, Activity } from 'lucide-react';

interface SanitizedMedicalContentProps {
  content: any;
  className?: string;
  badgeLabel?: string;
}

export const SanitizedMedicalContent: React.FC<SanitizedMedicalContentProps> = ({
  content,
  className = '',
  badgeLabel = 'Clinical Grade Output',
}) => {
  const result: SanitizedOutputResult = sanitizeHealthcareOutput(content);

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

  // 2. Render structured blocks
  return (
    <div className={`space-y-3 font-sans text-slate-800 text-sm leading-relaxed ${className}`}>
      {badgeLabel && (
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            {badgeLabel}
          </span>
          <span className="text-[11px] font-medium text-slate-400">Verified Clinical Format</span>
        </div>
      )}

      {result.blocks.map((block, idx) => (
        <RenderBlock key={idx} block={block} />
      ))}
    </div>
  );
};

// Helper renderer for individual block types
const RenderBlock: React.FC<{ block: SanitizedBlock }> = ({ block }) => {
  switch (block.type) {
    case 'header': {
      if (block.level === 1) {
        return (
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1 mt-4 first:mt-0">
            {block.title}
          </h2>
        );
      }
      return (
        <h3 className="text-sm font-semibold text-teal-900 flex items-center gap-2 mt-3 first:mt-0">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          {block.title}
        </h3>
      );
    }

    case 'list': {
      return (
        <ul className="space-y-1.5 my-2 pl-1">
          {block.items?.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-slate-700 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    }

    case 'kv': {
      return (
        <div className="flex items-baseline justify-between p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70 text-xs sm:text-sm my-1">
          <span className="font-medium text-slate-600 shrink-0 mr-3">{block.key}</span>
          <span className="font-semibold text-slate-900 text-right">{block.value}</span>
        </div>
      );
    }

    case 'callout': {
      const isWarn = block.variant === 'warning';
      const isSuccess = block.variant === 'success';

      return (
        <div
          className={`p-3 rounded-xl border flex items-start gap-3 my-2 text-xs sm:text-sm ${
            isWarn
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : isSuccess
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-teal-50/80 border-teal-200 text-teal-900'
          }`}
        >
          {isWarn ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] block mb-0.5">
              {block.title}
            </span>
            <p className="leading-snug">{block.text}</p>
          </div>
        </div>
      );
    }

    case 'divider': {
      return <hr className="border-t border-slate-200 my-3" />;
    }

    case 'paragraph':
    default: {
      return <p className="text-slate-700 text-xs sm:text-sm leading-relaxed">{block.text}</p>;
    }
  }
};

// Helper renderer for JSON payload into clean grid/cards
const RenderJsonPayload: React.FC<{ data: any }> = ({ data }) => {
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
              <pre className="text-xs bg-white p-2 rounded border border-slate-200 text-slate-700 overflow-x-auto font-mono">
                {JSON.stringify(val, null, 2)}
              </pre>
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
