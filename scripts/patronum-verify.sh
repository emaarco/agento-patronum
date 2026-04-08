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

# Check prerequisites
if ! command -v jq &> /dev/null; then
  echo "FAIL: jq is not installed. Install it with: brew install jq (macOS) or apt install jq (Linux)"
  exit 1
fi

if [ ! -f "$CONFIG_FILE" ]; then
  echo "FAIL: Config not found at $CONFIG_FILE. Run setup first."
  exit 1
fi

if [ ! -f "$HOOK_SCRIPT" ]; then
  echo "FAIL: Hook script not found at $HOOK_SCRIPT"
  exit 1
fi

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
