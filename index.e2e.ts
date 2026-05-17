import {readFileSync} from "node:fs";
import {expect, test} from "@playwright/test";
import type {Page} from "@playwright/test";
import type {uppie, UppieCallback} from "./index.ts";

type Captured = {
  files: string[] | null,
  entries: Array<[string, {name: string, size: number} | string]> | null,
};

declare global {
  interface Window {
    uppie: typeof uppie,
    capture: UppieCallback,
    waitFor: () => Promise<Captured>,
    dispatchDrop: (target: Element, dt: unknown) => void,
    makeFileEntry: (name: string, file: File) => unknown,
    makeDirEntry: (name: string, children: unknown[]) => unknown,
  }
}

const dist = readFileSync(new URL("dist/index.js", import.meta.url), "utf8")
  .replace("export { uppie };", "");

async function setup(page: Page) {
  await page.route("http://localhost/", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html>
<input type=file id=f multiple>
<div id=zone style="width:100px;height:100px"></div>
<script type=module>
${dist}
let captured = null;
const waiters = [];
window.uppie = uppie;
window.capture = (e, fd, files) => {
  const data = {
    files: files ?? null,
    entries: fd ? [...fd.entries()].map(([k, v]) => [k, v instanceof File ? {name: v.name, size: v.size} : v]) : null,
  };
  captured = data;
  while (waiters.length) waiters.shift()(data);
};
window.waitFor = () => new Promise(r => {
  if (captured) r(captured);
  else waiters.push(r);
});
window.dispatchDrop = (target, dt) => {
  const ev = new Event("drop", {bubbles: true, cancelable: true});
  Object.defineProperty(ev, "dataTransfer", {value: dt});
  target.dispatchEvent(ev);
};
window.makeFileEntry = (name, file) => ({
  isFile: true, isDirectory: false, name,
  file: (ok) => ok(file),
});
window.makeDirEntry = (name, children) => {
  let read = false;
  return {
    isFile: false, isDirectory: true, name,
    createReader: () => ({
      readEntries: (cb) => { if (read) cb([]); else { read = true; cb(children); } },
    }),
  };
};
</script>`,
  }));
  await page.goto("http://localhost/");
}

test("input change with single file", async ({page}) => {
  await setup(page);
  await page.evaluate(() => window.uppie(document.getElementById("f")!, window.capture));
  await page.setInputFiles("#f", [{name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("hello")}]);
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["a.txt"]);
  expect(result.entries).toEqual([["files[]", {name: "a.txt", size: 5}]]);
});

test("input change with multiple files", async ({page}) => {
  await setup(page);
  await page.evaluate(() => window.uppie(document.getElementById("f")!, window.capture));
  await page.setInputFiles("#f", [
    {name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("a")},
    {name: "b.txt", mimeType: "text/plain", buffer: Buffer.from("bb")},
  ]);
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["a.txt", "b.txt"]);
  expect(result.entries!.map(entry => entry[0])).toEqual(["files[]", "files[]"]);
});

test("input change with no files invokes cb with event only", async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    window.uppie(document.getElementById("f")!, window.capture);
    document.getElementById("f")!.dispatchEvent(new Event("change", {bubbles: true}));
  });
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toBeNull();
  expect(result.entries).toBeNull();
});

test("custom name option", async ({page}) => {
  await setup(page);
  await page.evaluate(() => window.uppie(document.getElementById("f")!, {name: "uploads[]"}, window.capture));
  await page.setInputFiles("#f", [{name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("x")}]);
  const result = await page.evaluate(() => window.waitFor());
  expect(result.entries![0][0]).toBe("uploads[]");
});

test("accepts NodeList of inputs", async ({page}) => {
  await setup(page);
  await page.evaluate(() => window.uppie(document.querySelectorAll("input"), window.capture));
  await page.setInputFiles("#f", [{name: "n.txt", mimeType: "text/plain", buffer: Buffer.from("n")}]);
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["n.txt"]);
});

test("drop falls back to arrayApi when no entries API", async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    window.uppie(document.getElementById("zone")!, window.capture);
    const file = new File(["x"], "a.txt", {type: "text/plain"});
    window.dispatchDrop(document.getElementById("zone")!, {files: [file]});
  });
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["a.txt"]);
  expect(result.entries).toEqual([["files[]", {name: "a.txt", size: 1}]]);
});

test("drop via entries API with single file", async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    window.uppie(document.getElementById("zone")!, window.capture);
    const file = new File(["xy"], "a.txt", {type: "text/plain"});
    const entry = window.makeFileEntry("a.txt", file);
    window.dispatchDrop(document.getElementById("zone")!, {
      items: [{webkitGetAsEntry: () => entry}],
      files: [file],
    });
  });
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["a.txt"]);
  expect(result.entries).toEqual([["files[]", {name: "a.txt", size: 2}]]);
});

test("drop via entries API with directory", async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    window.uppie(document.getElementById("zone")!, window.capture);
    const file = new File(["z"], "nested.txt", {type: "text/plain"});
    const dir = window.makeDirEntry("mydir", [window.makeFileEntry("nested.txt", file)]);
    window.dispatchDrop(document.getElementById("zone")!, {
      items: [{webkitGetAsEntry: () => dir}],
      files: [file],
    });
  });
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["mydir/nested.txt"]);
  expect(result.entries).toEqual([["files[]", {name: "mydir/nested.txt", size: 1}]]);
});

test("drop via entries API with nested directories", async ({page}) => {
  await setup(page);
  await page.evaluate(() => {
    window.uppie(document.getElementById("zone")!, window.capture);
    const file = new File(["q"], "deep.txt", {type: "text/plain"});
    const inner = window.makeDirEntry("inner", [window.makeFileEntry("deep.txt", file)]);
    const outer = window.makeDirEntry("outer", [inner]);
    window.dispatchDrop(document.getElementById("zone")!, {
      items: [{webkitGetAsEntry: () => outer}],
      files: [file],
    });
  });
  const result = await page.evaluate(() => window.waitFor());
  expect(result.files).toEqual(["outer/inner/deep.txt"]);
});

test("dragover and dragenter prevent default", async ({page}) => {
  await setup(page);
  const result = await page.evaluate(() => {
    window.uppie(document.getElementById("zone")!, window.capture);
    const zone = document.getElementById("zone")!;
    const over = new Event("dragover", {bubbles: true, cancelable: true});
    const enter = new Event("dragenter", {bubbles: true, cancelable: true});
    zone.dispatchEvent(over);
    zone.dispatchEvent(enter);
    return {over: over.defaultPrevented, enter: enter.defaultPrevented};
  });
  expect(result).toEqual({over: true, enter: true});
});
