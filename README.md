# Playwright Accessibility MCP Server

![Node.js](https://img.shields.io/badge/Node.js-v18.16.0-green) <!-- Updated version -->
![Playwright](https://img.shields.io/badge/Playwright-v1.52.0-blue) <!-- Updated version -->
![Axe-Core](https://img.shields.io/badge/Axe--Core-v4.9.1-orange) <!-- Updated version -->
![Zod](https://img.shields.io/badge/Zod-v3.21.4-purple) <!-- Updated version -->
![License](https://img.shields.io/badge/License-MIT-brightgreen)

This project is an implementation of a Model Context Protocol (MCP) server for accessibility testing using Playwright and Axe. It provides tools to scan URLs, raw HTML, and batches of URLs for accessibility violations and summarize the results.

## Features

- **scan-url**: Scans a single URL for accessibility violations.
- **scan-html**: Scans raw HTML content for accessibility violations.
- **scan-batch**: Scans multiple URLs for accessibility violations.
- **summarise-violations**: Summarizes accessibility violations from Axe results.
- **write-violations-report**: Writes accessibility violations report to the output directory.

### Requirements
- Node.js 18 or newer
- VS Code, Cursor, Windsurf, Claude Desktop or any other MCP client

<!--
// Generate using:
node utils/generate-links.js
-->

### Getting started

First, install the Playwright Accessibility MCP server with your client. A typical configuration looks like this:

```js
{
  "mcpServers": {
    "playwright-accessibility": {
      "command": "npx",
      "args": [
        "playwright-accessibility-mcp-server@latest"
      ]
    }
  }
}
```

[<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Server&color=0098FF" alt="Install in VS Code">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright-accessibility%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522playwright-accessibility-mcp-server%2540latest%2522%255D%257D) [<img alt="Install in VS Code Insiders" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Server&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright-accessibility%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522playwright-accessibility-mcp-server%2540latest%2522%255D%257D) [<img src="https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Server&color=0098FF" alt="Install in VS Code">](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright-accessibility%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522playwright-accessibility-mcp-server%2540latest%2522%255D%257D) [<img alt="Install in VS Code Insiders" src="https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Server&color=24bfa5">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522playwright-accessibility%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522playwright-accessibility-mcp-server%2540latest%2522%255D%257D)


<details><summary><b>Install in VS Code</b></summary>

You can also install the Playwright Accessibility MCP server using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"playwright-accessibility","command":"npx","args":["playwright-accessibility-mcp-server@latest"]}'
```

After installation, the Playwright Accessibility MCP server will be available for use with your GitHub Copilot agent in VS Code.
</details>

<details>
<summary><b>Install in Cursor</b></summary>

Go to `Cursor Settings` -> `MCP` -> `Add new MCP Server`. Name to your liking, use `command` type with the command `npx playwright-accessibility-mcp-server`. You can also verify config or add command like arguments via clicking `Edit`.

```js
{
  "mcpServers": {
    "playwright-accessibility": {
      "command": "npx",
      "args": [
        "playwright-accessibility-mcp-server@latest"
      ]
    }
  }
}
```
</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Follow Windsuff MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use following configuration:

```js
{
  "mcpServers": {
    "playwright-accessibility": {
      "command": "npx",
      "args": [
        "playwright-accessibility-mcp-server@latest"
      ]
    }
  }
}
```
</details>

<details>
<summary><b>Install in Claude Desktop</b></summary>

Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user), use following configuration:

```js
{
  "mcpServers": {
    "playwright-accessibility": {
      "command": "npx",
      "args": [
        "playwright-accessibility-mcp-server@latest"
      ]
    }
  }
}
```
</details>


## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/deepakkamboj/playwright-accessibility-mcp-server.git
   cd playwright-accessibility-mcp-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## 🔧 Usage

### Starting the Server

1. Start the server:

   ```bash
   npm start
   ```

2. Use the tools via the MCP protocol to perform accessibility testing.

### Using as an MCP Server

This project implements the MCP protocol, allowing you to interact with the server using MCP-compatible clients. Below are the steps to use it as an MCP server:

1. **Start the MCP Server**:
   Ensure the server is running by executing:

   ```bash
   npm start
   ```

2. **Connect to the Server**:
   Use an MCP client to connect to the server. The default server runs on `http://localhost:3000`.

3. **Send MCP Requests**:
   Use the following tools via MCP requests:

   - `scan-url`: Analyze a single URL for accessibility violations.
   - `scan-html`: Analyze raw HTML content for accessibility violations.
   - `scan-batch`: Analyze multiple URLs for accessibility violations.
   - `summarise-violations`: Summarize accessibility violations from Axe results.
   - `write-violations-report`: Write accessibility violations report to the output directory.

4. **Example MCP Request**:
   Below is an example of an MCP request to write a violations report:

   ```json
   {
     "tool": "write-violations-report",
     "input": {
       "violations": [
         {
           "id": "color-contrast",
           "impact": "serious",
           "description": "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds.",
           "helpUrl": "https://dequeuniversity.com/rules/axe/4.7/color-contrast",
           "nodes": [
             {
               "target": ["#example"],
               "failureSummary": "Fix this element's color contrast.",
               "html": "<div id='example' style='color: #fff; background-color: #fff;'>Example</div>"
             }
           ]
         }
       ]
     }
   }
   ```

   Send this request to the server using an MCP client, and the server will write the violations report to the output directory.

### MCP (JSON‑RPC) Mode

For AI clients (e.g. Claude Desktop, Cursor, VS Code MCP extension), configure your `<client>_config.json`:

```json
{
  "mcpServers": {
    "playwright-accessibility-mcp-server": {
      "command": "node",
      "args": ["${AbsolutePath}/build/index.js"]
    }
  }
}
```

Once the MCP server is running, you can invoke tools like:

- `scan-url` (params: `{ "url": "https://google.com" }`)
- `scan-html` (params: `{ "html": "<h1>Hello</h1>" }`)
- `scan-batch` (params: `{ "urls": ["https://a.com","https://b.com"] }`)
- `summarise-violations` (params: `{ "result": <axe result> }`)

### MCP Local Dev Mode

For local development, configure your `<client>_config.json` as follows:

```json
{
  "mcpServers": {
    "playwright-accessibility-mcp-server": {
      "command": "node",
      "args": ["${AbsolutePath}/build/index.js"]
    }
  }
}
```

## Development

- To run the server in development mode:

  ```bash
  npm run dev
  ```

- To test the tools, export the server and use the MCP SDK.

## 🤝 Contributing

1. Fork the repo.
2. Create a branch (`git checkout -b feature/xyz`).
3. Commit your changes.
4. Open a Pull Request (PR).

## License

This project is licensed under the MIT License.
