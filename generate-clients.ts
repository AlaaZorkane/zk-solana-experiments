import { createFromRoot } from "codama";
import { renderVisitor as renderJavaScriptVisitor } from "@codama/renderers-js";
import * as Bun from "bun";
import path from "node:path";
import { rootNodeFromAnchor } from "@codama/nodes-from-anchor";

// Instanciate Codama.
const idlFile = Bun.file("./target/idl/zk_factor.json");
const idl = await idlFile.json();
const codama = createFromRoot(rootNodeFromAnchor(idl));

// Render JavaScript.
const jsClient = "./clients/js";
codama.accept(renderJavaScriptVisitor(path.join(jsClient, "src", "generated")));
