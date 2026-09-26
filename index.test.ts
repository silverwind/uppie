import {userEvent} from "vitest/browser";
import {uppie, type UppieCallback, type UppieOpts} from "./index.ts";

function listen(nodes: NodeList | Element, opts?: UppieOpts) {
  const {promise, resolve} = Promise.withResolvers<{files?: string[], entries?: unknown[]}>();
  const cb: UppieCallback = (_event, fd, files) => resolve({files, entries: fd && Array.from(fd, ([key, value]) => [key, (value as File).name, (value as File).size])});
  if (opts) uppie(nodes, opts, cb); else uppie(nodes, cb);
  return promise;
}

function fileInput() {
  const input = Object.assign(document.createElement("input"), {type: "file", multiple: true});
  document.body.append(input);
  onTestFinished(() => input.remove());
  return input;
}

function fileEntry(file: File) {
  return {isFile: true, isDirectory: false, name: file.name, file: (cb: (file: File) => void) => cb(file)};
}

function dirEntry(name: string, children?: unknown[]) {
  return {isFile: false, isDirectory: true, name, createReader: () => ({
    readEntries: (cb: (entries: unknown[]) => void, errorCb: (error: DOMException) => void) => {
      if (children) cb(children.splice(0)); else errorCb(new DOMException("", "NotReadableError"));
    },
  })};
}

describe("input", {concurrent: false}, () => {
  test.for([
    {title: "files", files: [new File(["a"], "a.txt"), new File(["bb"], "b.txt")], expected: {files: ["a.txt", "b.txt"], entries: [["files[]", "a.txt", 1], ["files[]", "b.txt", 2]]}},
    {title: "custom name", opts: {name: "uploads[]"}, files: [new File(["a"], "a.txt")], expected: {files: ["a.txt"], entries: [["uploads[]", "a.txt", 1]]}},
    {title: "NodeList of inputs", nodeList: true, files: [new File(["a"], "a.txt")], expected: {files: ["a.txt"], entries: [["files[]", "a.txt", 1]]}},
  ])("$title", async ({opts, nodeList, files, expected}) => {
    const input = fileInput();
    const result = listen(nodeList ? document.querySelectorAll("input") : input, opts);
    await userEvent.upload(input, files);
    expect(await result).toEqual(expected);
  });

  test("no files calls back with the event only, also in XHTML documents", async () => {
    for (const input of [fileInput(), new DOMParser().parseFromString(`<input xmlns="http://www.w3.org/1999/xhtml" type="file"/>`, "application/xhtml+xml").documentElement]) {
      const result = listen(input);
      input.dispatchEvent(new Event("change", {bubbles: true}));
      expect(await result).toEqual({files: undefined, entries: undefined});
    }
  });
});

describe("drop", () => {
  const entryFile = new File(["ab"], "a.txt");
  const nestedFile = new File(["q"], "deep.txt");
  test.for([
    {title: "uses the file list when the entries API is missing", dataTransfer: {files: [new File(["a"], "a.txt")]}, expected: {files: ["a.txt"], entries: [["files[]", "a.txt", 1]]}},
    {title: "uses the entries API", dataTransfer: {items: [{webkitGetAsEntry: () => fileEntry(entryFile)}], files: [entryFile]}, expected: {files: ["a.txt"], entries: [["files[]", "a.txt", 2]]}},
    {
      title: "walks nested directories and skips unreadable ones",
      dataTransfer: {items: [{webkitGetAsEntry: () => dirEntry("outer", [dirEntry("inner", [fileEntry(nestedFile)]), dirEntry("locked")])}], files: [nestedFile]},
      expected: {files: ["outer/inner/deep.txt"], entries: [["files[]", "outer/inner/deep.txt", 1]]},
    },
  ])("$title", async ({dataTransfer, expected}) => {
    const zone = document.createElement("div");
    const result = listen(zone);
    zone.dispatchEvent(Object.assign(new Event("drop", {bubbles: true, cancelable: true}), {dataTransfer}));
    expect(await result).toEqual(expected);
  });

  test("dragover and dragenter prevent the default", () => {
    const zone = document.createElement("div");
    listen(zone);
    expect(["dragover", "dragenter"].map(type => zone.dispatchEvent(new Event(type, {bubbles: true, cancelable: true})))).toEqual([false, false]);
  });
});
