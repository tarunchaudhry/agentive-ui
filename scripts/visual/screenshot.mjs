/**
 * Visual verification harness.
 * Assumes dev servers: www :3000, mock-playground :3001, ai-sdk-chat :3002.
 * Captures light/dark screenshots plus two interaction flows into /tmp/agentive-shots.
 *
 * Run: pnpm visual
 */
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const OUT = "/tmp/agentive-shots";
mkdirSync(OUT, { recursive: true });

const errors = [];

async function shoot(page, name, url, options = {}) {
  const { dark = false, waitFor, fullPage = false } = options;
  await page.emulateMedia({ colorScheme: dark ? "dark" : "light" });
  await page.goto(url, { waitUntil: "networkidle" });
  if (waitFor) await waitFor(page);
  // Let entrance animations settle.
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`ok  ${name}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  const shots = [
    ["home-light", "http://localhost:3000/", {}],
    ["home-dark", "http://localhost:3000/", { dark: true }],
    ["docs-index", "http://localhost:3000/docs", {}],
    ["doc-conversation", "http://localhost:3000/docs/conversation", {}],
    ["doc-tool-approval", "http://localhost:3000/docs/tool-approval", {}],
    ["doc-tool-approval-dark", "http://localhost:3000/docs/tool-approval", { dark: true }],
    ["doc-markdown", "http://localhost:3000/docs/markdown-content", {}],
    ["doc-message-dark", "http://localhost:3000/docs/message", { dark: true }],
    ["playground", "http://localhost:3001/", {}],
    ["aisdk", "http://localhost:3002/", {}],
  ];

  for (const [name, url, options] of shots) {
    // eslint-disable-next-line no-await-in-loop
    await shoot(page, name, url, options);
  }

  // Interaction 1: mock playground streams 200 messages.
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Stream 200 messages" }).click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${OUT}/playground-streaming.png` });
  console.log("ok  playground-streaming");

  // Interaction 2: ai-sdk-chat end-to-end approval flow.
  await page.goto("http://localhost:3002/", { waitUntil: "networkidle" });
  await page.getByRole("textbox", { name: "Message" }).fill("check the cluster");
  await page.getByRole("button", { name: "Send message" }).click();
  await page
    .getByText("Action Requires Approval", { exact: false })
    .first()
    .waitFor({ timeout: 20000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/aisdk-approval.png` });
  console.log("ok  aisdk-approval");

  await browser.close();

  if (errors.length > 0) {
    console.log("\nPAGE ERRORS:");
    for (const e of new Set(errors)) console.log(` - ${e}`);
    process.exitCode = 1;
  } else {
    console.log("\nNo page errors.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
