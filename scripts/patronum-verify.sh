#!/usr/bin/env bash
# agento-patronum — Self-test to verify hook enforcement
# Usage: patronum-verify.sh

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
HOOK_SCRIPT="$PLUGIN_ROOT/scripts/patronum-hook.sh"
CONFIG_FILE="$HOME/.claude/patronum.json"
PASS=0
FAIL=0

run_test() {
  local DESCRIPTION="$1"
  local INPUT="$2"
  local EXPECTED_EXIT="$3"

  ACTUAL_EXIT=0
  echo "$INPUT" | bash "$HOOK_SCRIPT" > /dev/null 2>&1 || ACTUAL_EXIT=$?

  if [ "$ACTUAL_EXIT" -eq "$EXPECTED_EXIT" ]; then
    echo "  PASS: $DESCRIPTION (exit $ACTUAL_EXIT)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $DESCRIPTION (expected exit $EXPECTED_EXIT, got $ACTUAL_EXIT)"
    FAIL=$((FAIL + 1))
  fi
}

echo "agento-patronum: running self-test"
echo ""

# ── Installation Check ────────────────────────────────────────────────────────
echo "── Installation Check ──────────────────────────────────────────────────────"
INSTALL_FAIL=0

check_install() {
  local DESCRIPTION="$1"
  local RESULT="$2"  # "pass" or "fail"
  local DETAIL="${3:-}"
  if [ "$RESULT" = "pass" ]; then
    echo "  PASS: $DESCRIPTION"
  else
    echo "  FAIL: $DESCRIPTION${DETAIL:+ — $DETAIL}"
    INSTALL_FAIL=$((INSTALL_FAIL + 1))
  fi
}

# Check jq dependency
if command -v jq &> /dev/null; then
  check_install "jq installed" pass
else
  check_install "jq installed" fail "install with: brew install jq (macOS) or apt install jq (Linux)"
fi

# Show CLAUDE_PLUGIN_ROOT resolution
if [ -n "${CLAUDE_PLUGIN_ROOT:-}" ]; then
  echo "  INFO: CLAUDE_PLUGIN_ROOT set → $PLUGIN_ROOT"
else
  echo "  INFO: CLAUDE_PLUGIN_ROOT not set, using fallback → $PLUGIN_ROOT"
fi

# Check all expected scripts exist
for SCRIPT in patronum-hook.sh patronum-setup.sh patronum-add.sh patronum-remove.sh patronum-list.sh patronum-verify.sh patronum-uninstall.sh; do
  if [ -f "$PLUGIN_ROOT/scripts/$SCRIPT" ]; then
    check_install "scripts/$SCRIPT present" pass
  else
    check_install "scripts/$SCRIPT present" fail "not found at $PLUGIN_ROOT/scripts/$SCRIPT"
  fi
done

# Check defaults file
if [ -f "$PLUGIN_ROOT/defaults/patronum.json" ]; then
  check_install "defaults/patronum.json present" pass
else
  check_install "defaults/patronum.json present" fail "not found at $PLUGIN_ROOT/defaults/patronum.json"
fi

# Check config file exists and is valid JSON
if [ ! -f "$CONFIG_FILE" ]; then
  check_install "~/.claude/patronum.json exists" fail "run setup or reinstall the plugin"
elif jq empty "$CONFIG_FILE" 2>/dev/null; then
  check_install "~/.claude/patronum.json valid JSON" pass
else
  check_install "~/.claude/patronum.json valid JSON" fail "file is malformed — delete it and re-run setup"
fi

if [ "$INSTALL_FAIL" -gt 0 ]; then
  echo ""
  echo "Installation check failed ($INSTALL_FAIL issue(s)). Fix the above before running enforcement tests."
  exit 1
fi

echo ""

# ── Enforcement Tests ─────────────────────────────────────────────────────────
echo "── Enforcement Tests ────────────────────────────────────────────────────────"
echo ""
echo "Config: $CONFIG_FILE"
echo "Hook:   $HOOK_SCRIPT"
echo ""

# Test 1: Should block reading SSH key
run_test "Block Read ~/.ssh/id_rsa" \
  '{"tool_name":"Read","tool_input":{"file_path":"'"$HOME"'/.ssh/id_rsa"}}' \
  2

# Test 2: Should block reading .env file
run_test "Block Read .env" \
  '{"tool_name":"Read","tool_input":{"file_path":"/project/.env"}}' \
  2

# Test 3: Should block AWS credentials
run_test "Block Read ~/.aws/credentials" \
  '{"tool_name":"Read","tool_input":{"file_path":"'"$HOME"'/.aws/credentials"}}' \
  2

# Test 4: Should block printenv command
run_test "Block Bash(printenv)" \
  '{"tool_name":"Bash","tool_input":{"command":"printenv"}}' \
  2

# Test 5: Should allow safe file
run_test "Allow Read /tmp/safe.txt" \
  '{"tool_name":"Read","tool_input":{"file_path":"/tmp/safe.txt"}}' \
  0

# Test 6: Should allow safe command
run_test "Allow Bash(ls -la)" \
  '{"tool_name":"Bash","tool_input":{"command":"ls -la"}}' \
  0

# Test 7: Should block .pem files
run_test "Block Read server.pem" \
  '{"tool_name":"Read","tool_input":{"file_path":"/etc/ssl/server.pem"}}' \
  2

# Test 8: Should block Write to .env
run_test "Block Write .env.local" \
  '{"tool_name":"Write","tool_input":{"file_path":"/project/.env.local"}}' \
  2

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

echo ""
echo "agento-patronum: all tests passed. Your guardian is active."
