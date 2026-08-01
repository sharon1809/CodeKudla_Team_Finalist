// =============================================================================
// DrugInteractionService
// -----------------------------------------------------------------------------
// N-way (polypharmacy) drug-drug interaction evaluation, driven ENTIRELY by live
// public APIs. No hardcoded interaction lists, no bundled mock databases, no
// static severity heuristics.
//
// ARCHITECTURAL NOTE: The U.S. National Library of Medicine (NLM) retired its
// dedicated drug-drug-interaction (DDI) API in January 2024. RxNorm itself
// remains active and is used here for drug-concept normalization (RxCUI), while
// interaction evidence is sourced live from the FDA's openFDA drug label API
// (the `drug_interactions` label section). This module therefore does not depend
// on any retired or defunct endpoint.
//
// Pipeline implemented by `evaluatePolypharmacy(drugNames)`:
//   1. NORMALIZATION — each provided name is resolved to an active RxCUI via the
//      RxNorm REST API (exact match first, then approximate-term matching).
//   2. COMBINATORICS — all unique pairwise combinations are generated using the
//      n(n-1)/2 combination matrix (every pair is evaluated; nothing is skipped).
//   3. QUERYING — an `InteractionProvider` implementation searches the FDA label
//      of drug A for explicit mentions of drug B inside the `drug_interactions`
//      section, then performs the reverse lookup (label of drug B vs drug A).
//   4. RESILIENCE — bounded concurrency, exponential backoff on HTTP 429, and a
//      hard timeout via AbortController so no promise can hang indefinitely.
//   5. SYNTHESIS — findings are aggregated into a structured `InteractionReport`
//      that a physician (or an AI adjudicator) can review pair by pair.
//
// The module is framework-agnostic ESM and only relies on the global `fetch`,
// so it can be imported into an Express or NestJS application as-is.
//
// @typedef annotations provide full typing for editors and for any downstream
// TS tooling (e.g. `checkJs`) without requiring a compile step.
// =============================================================================

/** @typedef {'RxNorm exact match' | 'RxNorm approximate match'} ResolveSource */

/**
 * A drug name that has been normalized to an active RxNorm concept.
 * @typedef {Object} ResolvedDrug
 * @property {string} providedName Original name supplied by the caller.
 * @property {string} rxcui Active RxNorm concept unique identifier.
 * @property {string} resolvedName Canonical name returned by RxNorm (when available).
 * @property {string[]} searchNames Names used to search FDA labels (deduped).
 * @property {ResolveSource} source Which RxNorm strategy produced the RxCUI.
 */

/**
 * A single interaction pair record.
 * @typedef {Object} InteractionPair
 * @property {string} drugA Provided name of drug A.
 * @property {string} drugB Provided name of drug B.
 * @property {string} rxcuiA RxCUI of drug A.
 * @property {string} rxcuiB RxCUI of drug B.
 * @property {boolean} interactionFound Whether a label mention was found.
 * @property {string|null} source Data source of the finding (e.g. OpenFDA label).
 * @property {string|null} description Excerpt of the interaction text.
 * @property {string|null} direction Which label was searched for which drug.
 * @property {string[]} matchedDrugNames Names that matched inside the label text.
 */

/**
 * Final aggregated output of a polypharmacy evaluation.
 * @typedef {Object} InteractionReport
 * @property {Array<{providedName: string, resolvedRxcui: string|null, resolvedName: string|null, source: string}>} analyzedDrugs
 * @property {InteractionPair[]} interactionPairs
 * @property {{totalPairsEvaluated: number, totalInteractionsFound: number, errors: string[]}} metadata
 */

const RXNORM_BASE = 'https://rxnav.nlm.nih.gov/REST';
const OPENFDA_LABEL_URL = 'https://api.fda.gov/drug/label.json';
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 3;
const DEFAULT_CONCURRENCY = 5;

/** @param {number} ms */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** @param {string} str */
const truncate = (str, max = 1500) => {
  if (!str) return str;
  return str.length > max ? `${str.slice(0, max)}…` : str;
};

/** @param {string[]} names */
const dedupeCaseInsensitive = (names) => {
  const seen = new Set();
  const out = [];
  for (const n of names) {
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
};

/**
 * Issues a GET request with a hard timeout (AbortController), bounded retries,
 * and exponential backoff on HTTP 429 / transient network failures.
 * @param {string} url Base URL.
 * @param {Record<string, string>} [params] Query params.
 * @param {{timeout?: number, maxRetries?: number, baseDelay?: number}} [options]
 * @returns {Promise<{ok: boolean, status: number, data: unknown}>}
 */
async function httpGetJson(url, params = {}, options = {}) {
  const { timeout = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_RETRIES, baseDelay = 500 } = options;
  const fullUrl = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    fullUrl.searchParams.set(key, String(value));
  }

  let attempt = 0;
  let lastError;
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(fullUrl.toString(), {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      if (res.status === 429) {
        const retryAfter = Number.parseInt(res.headers.get('retry-after') || '', 10);
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : baseDelay * Math.pow(2, attempt);
        await sleep(delay);
        attempt += 1;
        continue;
      }

      if (!res.ok) {
        return { ok: false, status: res.status, data: null };
      }

      return { ok: true, status: res.status, data: await res.json() };
    } catch (err) {
      lastError = err;
      await sleep(baseDelay * Math.pow(2, attempt));
      attempt += 1;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error(`Request to ${url} failed after ${maxRetries + 1} attempts`);
}

/**
 * Runs `worker` over `items` with a bounded number of in-flight promises,
 * preserving result order. Prevents firing unlimited HTTP requests when the
 * caller submits a large polypharmacy set (e.g. 20 drugs -> 190 pairs).
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T, index: number) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;

  const runner = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) break;
      results[index] = await worker(items[index], index);
    }
  };

  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, runner));
  return results;
}

/**
 * Returns all unique pairwise combinations using the n(n-1)/2 combination
 * matrix. Each unordered pair appears exactly once.
 * @template T
 * @param {T[]} items
 * @returns {Array<[T, T]>}
 */
function getPairwiseCombinations(items) {
  const pairs = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

/**
 * Normalizes user-supplied drug names to active RxNorm concepts (RxCUI).
 * Exact match first; if the exact match fails, the RxNorm approximate-term
 * matcher is used. Both endpoints are live FDA APIs — no local drug database.
 */
class RxNormResolver {
  /**
   * @param {{timeout?: number, maxRetries?: number, baseDelay?: number}} [options]
   */
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * Resolves a single drug name to a ResolvedDrug.
   * @param {string} name
   * @returns {Promise<ResolvedDrug>}
   */
  async resolveName(name) {
    const cleaned = String(name).trim();
    if (!cleaned) throw new Error('Empty drug name provided');

    const exact = await httpGetJson(`${RXNORM_BASE}/rxcui.json`, { name: cleaned }, this.options);
    let rxcui = null;
    let resolvedName = cleaned;
    let source = /** @type {ResolveSource} */ ('RxNorm exact match');
    const names = [cleaned];

    if (exact.ok && Array.isArray(exact.data?.idGroup?.rxnormId) && exact.data.idGroup.rxnormId.length > 0) {
      rxcui = exact.data.idGroup.rxnormId[0];
    }

    if (!rxcui) {
      const approx = await httpGetJson(
        `${RXNORM_BASE}/approximateTerm.json`,
        { term: cleaned, maxEntries: 3 },
        this.options
      );
      const candidates = approx.ok ? approx.data?.approximateGroup?.candidate : null;
      if (Array.isArray(candidates) && candidates.length > 0) {
        const named = candidates.filter((c) => c && c.rxcui && c.name);
        const best = named.find((c) => String(c.rxcui).length > 0) || named[0] || candidates[0];
        if (best && best.rxcui) {
          rxcui = String(best.rxcui);
          source = 'RxNorm approximate match';
          names.push(...named.map((c) => c.name));
          if (best.name) resolvedName = best.name;
        }
      }
    }

    if (!rxcui) {
      throw new Error(`Unable to resolve "${cleaned}" to an RxNorm concept (RxCUI)`);
    }

    return {
      providedName: cleaned,
      rxcui,
      resolvedName,
      searchNames: dedupeCaseInsensitive(names).slice(0, 4),
      source
    };
  }

  /**
   * Resolves many names with bounded concurrency.
   * @param {string[]} names
   * @param {number} concurrency
   * @returns {Promise<(ResolvedDrug|null)[]>} Null entries paired with errors.
   * @param {(message: string) => void} [onError]
   */
  async resolveMany(names, concurrency, onError) {
    return mapWithConcurrency(names, concurrency, async (name) => {
      try {
        return await this.resolveName(name);
      } catch (err) {
        if (onError) onError(err.message);
        return null;
      }
    });
  }
}

/**
 * Contract for anything that can produce pairwise interaction evidence.
 * Swappable so a different live source can be plugged in later.
 */
class InteractionProvider {
  /**
   * @param {ResolvedDrug} _drugA
   * @param {ResolvedDrug} _drugB
   * @returns {Promise<{interactionFound: boolean, source: string|null, description: string|null, direction: string|null, matchedDrugNames: string[]}|null>}
   */
  // eslint-disable-next-line no-unused-vars
  async getPairwiseInteraction(_drugA, _drugB) {
    throw new Error('getPairwiseInteraction() must be implemented by a subclass');
  }
}

/** @param {string} field @param {string} value */
const quoteField = (field, value) => `${field}:"${String(value).replace(/["\\]/g, '')}"`;

/**
 * Builds the openFDA `search` expression. It matches labels of `labelDrug`
 * (by generic OR brand name) whose `drug_interactions` section explicitly
 * mentions any of `mentionedNames`.
 * @param {string[]} mentionedNames
 * @param {string[]} labelDrugNames
 * @returns {string}
 */
function buildOpenFDASearch(mentionedNames, labelDrugNames) {
  const interactionClauses = mentionedNames.map((n) => quoteField('drug_interactions', n));
  const labelClauses = labelDrugNames.flatMap((n) => [
    quoteField('openfda.generic_name', n.toUpperCase()),
    quoteField('openfda.brand_name', n)
  ]);
  return `(${interactionClauses.join(' OR ')}) AND (${labelClauses.join(' OR ')})`;
}

/**
 * openFDA-backed InteractionProvider.
 *
 * Strategy: query `drug_interactions:"<drug B>" AND (openfda.generic_name:"<A>"
 * OR openfda.brand_name:"<A>")` against the FDA label endpoint. A hit means A's
 * FDA label explicitly discusses B in its drug-interaction section. The reverse
 * lookup is then performed (B's label mentioning A) and the first positive
 * direction wins.
 */
class OpenFDAInteractionProvider extends InteractionProvider {
  /**
   * @param {{timeout?: number, maxRetries?: number, baseDelay?: number}} [options]
   */
  constructor(options = {}) {
    super();
    this.options = options;
  }

  /**
   * Searches the label of `labelDrug` for mentions of `mentionedDrug`.
   * @param {ResolvedDrug} labelDrug
   * @param {ResolvedDrug} mentionedDrug
   * @returns {Promise<{interactionFound: true, source: string, description: string, direction: string, matchedDrugNames: string[], setid: string|null}|null>}
   */
  async queryLabelMentions(labelDrug, mentionedDrug) {
    const search = buildOpenFDASearch(mentionedDrug.searchNames, labelDrug.searchNames);
    const res = await httpGetJson(OPENFDA_LABEL_URL, { search, limit: 1 }, this.options);

    if (!res.ok || !Array.isArray(res.data?.results) || res.data.results.length === 0) {
      return null;
    }

    const label = res.data.results[0];
    const interactions = Array.isArray(label.drug_interactions) ? label.drug_interactions : [];
    if (interactions.length === 0) return null;

    const matchedNames = mentionedDrug.searchNames.filter((n) =>
      interactions.some((entry) => String(entry).toLowerCase().includes(n.toLowerCase()))
    );

    const selected = matchedNames.length > 0
      ? interactions.filter((entry) =>
          matchedNames.some((n) => String(entry).toLowerCase().includes(n.toLowerCase()))
        )
      : interactions;

    return {
      interactionFound: true,
      source: 'OpenFDA Drug Label (drug_interactions)',
      description: truncate(selected.slice(0, 3).join(' ').trim(), 1500),
      direction: `Label of ${labelDrug.providedName} mentions ${mentionedDrug.providedName}`,
      matchedDrugNames: matchedNames.length > 0 ? matchedNames : [...mentionedDrug.searchNames],
      setid: label.set_id || null
    };
  }

  /**
   * @inheritdoc
   * @param {ResolvedDrug} drugA
   * @param {ResolvedDrug} drugB
   */
  async getPairwiseInteraction(drugA, drugB) {
    const forward = await this.queryLabelMentions(drugA, drugB);
    if (forward) return forward;
    const reverse = await this.queryLabelMentions(drugB, drugA);
    return reverse;
  }
}

/**
 * Primary entry point for n-way polypharmacy evaluation.
 *
 * ```
 * const report = await drugInteractionService.evaluatePolypharmacy(['Warfarin', 'Aspirin', 'Ibuprofen']);
 * ```
 */
class DrugInteractionService {
  /**
   * @param {{concurrency?: number, timeout?: number, maxRetries?: number, baseDelay?: number}} [options]
   */
  constructor(options = {}) {
    /** @type {number} */
    this.concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    /** @type {{timeout: number, maxRetries: number, baseDelay: number}} */
    this.httpOptions = {
      timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      maxRetries: options.maxRetries ?? DEFAULT_RETRIES,
      baseDelay: options.baseDelay ?? 500
    };
    this.resolver = new RxNormResolver(this.httpOptions);
    /** @type {InteractionProvider} */
    this.provider = new OpenFDAInteractionProvider(this.httpOptions);
  }

  /**
   * Evaluates all pairwise drug interactions across the given drug list.
   * @param {string[]} drugNames
   * @returns {Promise<InteractionReport>}
   */
  async evaluatePolypharmacy(drugNames) {
    if (!Array.isArray(drugNames) || drugNames.length === 0) {
      throw new Error('drugNames must be a non-empty array of drug names');
    }

    /** @type {string[]} */
    const errors = [];

    const uniqueNames = [];
    for (const raw of drugNames) {
      const name = String(raw || '').trim();
      if (!name) {
        errors.push('Empty drug name provided');
        continue;
      }
      if (!uniqueNames.some((u) => u.toLowerCase() === name.toLowerCase())) {
        uniqueNames.push(name);
      }
    }

    // Step 1 — Normalization (RxNorm). Bounded concurrency.
    const resolved = await this.resolver.resolveMany(
      uniqueNames,
      this.concurrency,
      (message) => errors.push(message)
    );

    const analyzedDrugs = uniqueNames.map((name, index) => {
      const r = resolved[index];
      return {
        providedName: name,
        resolvedRxcui: r ? r.rxcui : null,
        resolvedName: r ? r.resolvedName : null,
        source: r ? r.source : 'UNRESOLVED'
      };
    });

    // Step 2 — Combinatorics: n(n-1)/2 unique pairs.
    const resolvable = /** @type {ResolvedDrug[]} */ (resolved.filter(Boolean));
    const pairs = getPairwiseCombinations(resolvable);

    // Steps 3 + 4 — Query each pair with bounded concurrency and resilience.
    const pairResults = await mapWithConcurrency(pairs, this.concurrency, async ([drugA, drugB]) => {
      try {
        return { drugA, drugB, match: await this.provider.getPairwiseInteraction(drugA, drugB) };
      } catch (err) {
        errors.push(`Interaction lookup failed for ${drugA.providedName} ↔ ${drugB.providedName}: ${err.message}`);
        return { drugA, drugB, match: null };
      }
    });

    // Step 5 — Synthesis.
    /** @type {InteractionPair[]} */
    const interactionPairs = pairResults.map(({ drugA, drugB, match }) => ({
      drugA: drugA.providedName,
      drugB: drugB.providedName,
      rxcuiA: drugA.rxcui,
      rxcuiB: drugB.rxcui,
      interactionFound: Boolean(match),
      source: match ? match.source : null,
      description: match ? match.description : null,
      direction: match ? match.direction : null,
      matchedDrugNames: match ? match.matchedDrugNames : []
    }));

    return {
      analyzedDrugs,
      interactionPairs,
      metadata: {
        totalPairsEvaluated: pairs.length,
        totalInteractionsFound: interactionPairs.filter((p) => p.interactionFound).length,
        errors
      }
    };
  }
}

export {
  DrugInteractionService,
  RxNormResolver,
  InteractionProvider,
  OpenFDAInteractionProvider,
  getPairwiseCombinations,
  mapWithConcurrency
};

export default new DrugInteractionService();
