const packagePaths = /(?:^|\/)(?:package\.json|package-lock\.json|npm-shrinkwrap\.json|pnpm-lock\.yaml|yarn\.lock)$/;

function normalized(value) {
  if (typeof value !== "string" || !value || value.startsWith("/") || value.split("/").includes("..")) {
    throw new Error("scope paths and patterns must be non-empty repository-relative paths");
  }
  return value.replaceAll("\\", "/");
}

function patternExpression(pattern) {
  let expression = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    const next = pattern[index + 1];
    if (character === "*" && next === "*") {
      if (pattern[index + 2] === "/") {
        expression += "(?:.*/)?";
        index += 2;
      } else {
        expression += ".*";
        index += 1;
      }
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += character.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`^${expression}$`);
}

function validatePatterns(patterns, label) {
  if (patterns === undefined) return [];
  if (!Array.isArray(patterns)) throw new Error(`${label} must be an array`);
  return patterns.map((pattern) => {
    const value = normalized(pattern);
    if ((value.includes("/snapshots/") || value.startsWith("snapshots/")) && (value.startsWith("**/") || value.includes("/snapshots/**") || value.startsWith("snapshots/**") || value.endsWith("/**"))) {
      throw new Error(`snapshot pattern is too broad: ${value}`);
    }
    patternExpression(value);
    return value;
  });
}

export function validateScopeContract(contract) {
  if (!contract || contract.schema_version !== 1 || contract.mode !== "enforce" || !contract.repositories || typeof contract.repositories !== "object" || Array.isArray(contract.repositories)) {
    throw new Error("scope contract requires schema_version 1, mode enforce, and repositories");
  }
  const repositories = {};
  for (const [repository, value] of Object.entries(contract.repositories)) {
    if (!repository || !value || typeof value !== "object" || Array.isArray(value)) throw new Error("scope contract repository entries must be objects");
    const allowed = validatePatterns(value.allowed_paths, `allowed_paths for ${repository}`);
    if (allowed.length === 0) throw new Error(`allowed_paths for ${repository} must not be empty`);
    repositories[repository] = {
      allowed_paths: allowed,
      allowed_incidental_paths: validatePatterns(value.allowed_incidental_paths, `allowed_incidental_paths for ${repository}`),
      forbidden_paths: validatePatterns(value.forbidden_paths, `forbidden_paths for ${repository}`)
    };
  }
  return { schema_version: 1, mode: "enforce", repositories };
}

function matches(pathname, patterns) {
  return patterns.some((pattern) => patternExpression(pattern).test(pathname));
}

function pathChecks(change) {
  if (change.status === "renamed") {
    return [
      { path: change.source, side: "source" },
      { path: change.destination, side: "destination" }
    ];
  }
  return [{ path: change.path, side: null }];
}

export function evaluateScopeContract({ contract, repository, changes }) {
  const validated = validateScopeContract(contract);
  const surface = validated.repositories[repository];
  if (!surface) throw new Error(`scope contract has no surface for repository: ${repository}`);
  const offending_paths = [];
  for (const change of changes) {
    for (const check of pathChecks(change)) {
      const pathname = normalized(check.path);
      let reason = null;
      if (matches(pathname, surface.forbidden_paths)) reason = "forbidden_path";
      else if (packagePaths.test(pathname) && !matches(pathname, surface.allowed_incidental_paths)) reason = "package_or_lock_requires_explicit_incidental_allowance";
      else if (!matches(pathname, surface.allowed_paths) && !matches(pathname, surface.allowed_incidental_paths)) reason = "outside_allowed_surface";
      if (reason) offending_paths.push({ path: pathname, status: change.status, ...(check.side ? { side: check.side } : {}), reason });
    }
  }
  return {
    configured: true,
    status: offending_paths.length === 0 ? "pass" : "fail",
    repository,
    changed_paths: changes,
    offending_paths
  };
}

export function parseScopeContract(source) {
  try {
    return validateScopeContract(JSON.parse(source));
  } catch (error) {
    throw new Error(`invalid scope contract: ${error.message}`);
  }
}
