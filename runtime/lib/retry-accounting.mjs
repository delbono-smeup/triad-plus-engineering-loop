export const resolutionKinds = new Set([
  "runtime_recovery",
  "verifier_infrastructure_failure",
  "verifier_candidate_failure",
  "reviewer_rework",
  "scope_cleanup",
  "blocked"
]);

const runtimeKinds = new Set(["runtime_recovery", "verifier_infrastructure_failure"]);
const candidateKinds = new Set(["verifier_candidate_failure", "reviewer_rework", "scope_cleanup"]);

export function budgetFamily(kind) {
  if (runtimeKinds.has(kind)) return "runtime";
  if (candidateKinds.has(kind)) return "candidate_remediation";
  if (kind === "blocked") return null;
  throw new Error(`Unknown retry resolution kind: ${kind}`);
}

export function retryPolicyMode(policy = {}) {
  const runtime = policy.max_runtime_recoveries_per_item;
  const candidate = policy.max_candidate_remediations_per_item;
  if (Number.isInteger(runtime) && runtime >= 0 && Number.isInteger(candidate) && candidate >= 0) return "cause_coded";
  return "legacy";
}

export function classifyVerifierResolution(evidence = {}) {
  if (evidence.status === "infrastructure_error" || evidence?.failure?.code === "verified_infrastructure_failure") {
    return "verifier_infrastructure_failure";
  }
  return "verifier_candidate_failure";
}

function automaticResolution(attempt) {
  return attempt?.resolution?.automatic === true ? attempt.resolution : null;
}

function legacyReworkCount(attempts) {
  return attempts.filter((attempt) => attempt?.state === "rework").length;
}

function causeCount(attempts, family) {
  return attempts
    .map(automaticResolution)
    .filter(Boolean)
    .filter((resolution) => budgetFamily(resolution.kind) === family)
    .length;
}

export function evaluateAutomaticRetry({ policy = {}, attempts = [], kind }) {
  if (!resolutionKinds.has(kind)) throw new Error(`Unsupported retry resolution kind: ${kind}`);
  const mode = retryPolicyMode(policy);
  if (kind === "blocked") {
    return {
      mode,
      allowed: false,
      reason: "blocked_never_retries_automatically",
      family: null,
      previous_automatic_transitions: 0,
      maximum: 0
    };
  }

  if (mode === "legacy") {
    const maximum = policy.max_rework_attempts_per_item;
    if (!Number.isInteger(maximum) || maximum < 0) throw new Error("Legacy retry policy requires max_rework_attempts_per_item");
    const previous = legacyReworkCount(attempts);
    return {
      mode,
      allowed: previous < maximum,
      reason: previous < maximum ? "legacy_rework_budget_available" : "legacy_rework_budget_exhausted",
      family: "legacy_rework",
      previous_automatic_transitions: previous,
      maximum
    };
  }

  const family = budgetFamily(kind);
  const policyKey = family === "runtime" ? "max_runtime_recoveries_per_item" : "max_candidate_remediations_per_item";
  const maximum = policy[policyKey];
  const previous = causeCount(attempts, family);
  return {
    mode,
    allowed: previous < maximum,
    reason: previous < maximum ? `${family}_budget_available` : `${family}_budget_exhausted`,
    family,
    previous_automatic_transitions: previous,
    maximum
  };
}

export function resolutionRecord(kind, evidenceRefs = [], automatic = true) {
  if (!resolutionKinds.has(kind)) throw new Error(`Unsupported retry resolution kind: ${kind}`);
  if (!Array.isArray(evidenceRefs)) throw new Error("resolution evidence_refs must be an array");
  return { kind, evidence_refs: evidenceRefs, automatic };
}
