# MCPacks Chrome Extension

Auto-enables the MCP tools you picked in [MCPacks](../) on the TrueFoundry MCP Gateway.

## How it works

1. The MCPacks app opens the TrueFoundry MCP server page with a URL hash like:
   ```
   https://dalta.truefoundry.cloud/llm-gateway/mcp-servers?id=...&mcp-server-tab=tools#mcpacks=GitHub,Slack,Notion,Linear
   ```
2. The extension's content script reads the `#mcpacks=` list and watches the page.
3. As the tool list renders, it finds each matching row and clicks the toggle.
4. A small floating banner in the bottom-right shows progress.

## Install (unpacked)

1. Go to `chrome://extensions`.
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked**.
4. Select this `extension/` folder.

The extension activates automatically on any `*.truefoundry.cloud` or `*.truefoundry.com` page that has an `#mcpacks=` hash.

## Notes for the hackathon demo

- The matching is text-based: we look for an element whose text equals the tool's display name, then climb up to find the nearest toggle inside the same row.
- If TrueFoundry changes their DOM, only the matching logic in `content.js` needs an update.
- Anything not found within 12 seconds is greyed out in the banner.
