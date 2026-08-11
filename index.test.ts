import {userEvent} from "vitest/browser";
import {uppie} from "./index.ts";
import type {UppieCallback} from "./index.ts";

type Entry = [name: string, file: string, size: number];
type Capture = {files?: string[], entries?: Entry[]};

function capture(): [UppieCallback, Promise<Capture>] {
  const {promise, resolve} = Promise.withResolvers<Capture>();
  const cb: UppieCallback = (_event, fd, files) => {
    resolve({files, entries: fd && Array.from(fd, ([key, value]): Entry => [key, (value as File).name, (value as File).size])});
  };
  return [cb, promise];
}

function fileInput() {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  document.body.append(input);
  onTestFinished(() => input.remove());
  return input;
}

function drop(node: Element, dataTransfer: Record<string, unknown>) {
  const event = new Event("drop", {bubbles: true, cancelable: true});
  Object.defineProperty(event, "dataTransfer", {value: dataTransfer});
  node.dispatchEvent(event);
}

function fileEntry(name: string, file: File) {
  return {isFile: true, isDirectory: false, name, file: (cb: (file: File) => void) => cb(file)};
}

function dirEntry(name: string, children: unknown[]) {
  let read = false;
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: () => ({readEntries: (cb: (entries: unknown[]) => void) => {
      cb(read ? [] : children);
      read = true;
    }}),
  };
}

describe.sequential("input", () => { // userEvent resolves the input by role, so only one can exist
  test("files", async () => {
    const input = fileInput();
    const [cb, result] = capture();
    uppie(input, cb);
    await userEvent.upload(input, [new File(["a"], "a.txt"), new File(["bb"], "b.txt")]);
    expect(await result).toEqual({
      files: ["a.txt", "b.txt"],
      entries: [["files[]", "a.txt", 1], ["files[]", "b.txt", 2]],
    });
  });

  test("no files calls back with the event only", async () => {
    const input = fileInput();
    const [cb, result] = capture();
    uppie(input, cb);
    input.dispatchEvent(new Event("change", {bubbles: true}));
    expect(await result).toEqual({files: undefined, entries: undefined});
  });

  test("custom name", async () => {
    const input = fileInput();
    const [cb, result] = capture();
    uppie(input, {name: "uploads[]"}, cb);
    await userEvent.upload(input, new File(["a"], "a.txt"));
    expect((await result).entries).toEqual([["uploads[]", "a.txt", 1]]);
  });

  test("NodeList of inputs", async () => {
    const input = fileInput();
    const [cb, result] = capture();
    uppie(document.querySelectorAll("input"), cb);
    await userEvent.upload(input, new File(["a"], "a.txt"));
    expect((await result).files).toEqual(["a.txt"]);
  });
});

describe("drop", () => {
  test("uses the file list when the entries API is missing", async () => {
    const zone = document.createElement("div");
    const [cb, result] = capture();
    uppie(zone, cb);
    drop(zone, {files: [new File(["a"], "a.txt")]});
    expect(await result).toEqual({files: ["a.txt"], entries: [["files[]", "a.txt", 1]]});
  });

  test("uses the entries API", async () => {
    const zone = document.createElement("div");
    const [cb, result] = capture();
    uppie(zone, cb);
    const file = new File(["ab"], "a.txt");
    drop(zone, {items: [{webkitGetAsEntry: () => fileEntry("a.txt", file)}], files: [file]});
    expect(await result).toEqual({files: ["a.txt"], entries: [["files[]", "a.txt", 2]]});
  });

  test("walks nested directories", async () => {
    const zone = document.createElement("div");
    const [cb, result] = capture();
    uppie(zone, cb);
    const file = new File(["q"], "deep.txt");
    const outer = dirEntry("outer", [dirEntry("inner", [fileEntry("deep.txt", file)])]);
    drop(zone, {items: [{webkitGetAsEntry: () => outer}], files: [file]});
    expect((await result).files).toEqual(["outer/inner/deep.txt"]);
  });

  test("dragover and dragenter prevent the default", () => {
    const zone = document.createElement("div");
    const [cb] = capture();
    uppie(zone, cb);
    const events = ["dragover", "dragenter"].map(type => new Event(type, {bubbles: true, cancelable: true}));
    for (const event of events) zone.dispatchEvent(event);
    expect(events.map(event => event.defaultPrevented)).toEqual([true, true]);
  });
});
