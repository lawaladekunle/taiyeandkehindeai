#!/usr/bin/env bash
# Setup branch protection rules for main branch
# Uses GitHub CLI - requires `gh` to be authenticated
set -euo pipefail

REPO="${1:-lawaladekunle/taiyeandkehindeai}"

echo "Setting up branch protection for main on $REPO..."

# Require pull request review before merging
gh api "repos/$REPO/branches/main/protection" \
  --method PUT \
  --silent \
  --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Backend (lint + test)",
      "Frontend (lint + test + build)",
      "Docker build check",
      "CodeQL analysis (python)",
      "CodeQL analysis (javascript-typescript)",
      "Dependency review"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "lock_branch": false
}
JSON

echo "Branch protection enabled for main branch."
echo ""
echo "Summary:"
echo "  - Required approving reviews: 1"
echo "  - Dismiss stale reviews: yes"
echo "  - Require code owner reviews: yes"
echo "  - Require status checks: yes (strict)"
echo "  - Include administrators: yes"
echo "  - Force pushes: disabled"
echo "  - Deletions: disabled"

echo ""
echo "Status checks required:"
gh api "repos/$REPO/branches/main/protection" --jq '.required_status_checks.contexts[]' 2>/dev/null || echo "  (run after CI has completed at least once)"
