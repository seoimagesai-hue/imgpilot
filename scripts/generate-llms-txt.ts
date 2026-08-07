/**
 * Write public/llms.txt and public/llms-full.txt from the marketing route registry.
 */
import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {
  listLlmsLinks,
  renderLlmsFullTxt,
  renderLlmsTxt,
  resolveLlmsOrigin,
} from "../src/lib/marketing/llms-txt";
import {loadLocalEnvFiles} from "./load-local-env";

function main() {
  loadLocalEnvFiles();
  const origin = resolveLlmsOrigin();
  const links = listLlmsLinks();
  if (links.length === 0) {
    throw new Error("llms catalog is empty");
  }
  for (const link of links) {
    if (!link.path.startsWith("/") || link.path.includes("://")) {
      throw new Error(`Invalid llms path: ${link.path}`);
    }
    if (!link.title.trim() || !link.description.trim()) {
      throw new Error(`Missing title/description for ${link.path}`);
    }
  }

  const publicDir = join(process.cwd(), "public");
  mkdirSync(publicDir, {recursive: true});

  const llmsPath = join(publicDir, "llms.txt");
  const fullPath = join(publicDir, "llms-full.txt");
  writeFileSync(llmsPath, renderLlmsTxt(origin), "utf8");
  writeFileSync(fullPath, renderLlmsFullTxt(origin), "utf8");

  console.log(
    `Wrote ${dirname(llmsPath)}/llms.txt and llms-full.txt (${links.length} URLs, origin=${origin})`,
  );
}

main();
