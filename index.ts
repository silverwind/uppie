export type UppieOpts = {
  name?: string,
};

const defaultOpts: UppieOpts = {
  name: "files[]",
};

type Promisable<T> = T | Promise<T>;

export function uppie(nodes: NodeList | Array<HTMLInputElement> | HTMLInputElement, opts: UppieOpts, cb: any) {
  if (typeof opts === "function") {
    cb = opts;
    opts = defaultOpts;
  } else {
    if (!opts) opts = {};
    if (!opts.name) opts.name = defaultOpts.name;
  }

  for (const node of ((nodes instanceof NodeList || Array.isArray(nodes)) ? nodes : [nodes])) {
    watch(node as HTMLInputElement, opts, cb);
  }
}

function watch(node: HTMLInputElement, opts: UppieOpts, cb: (event: DragEvent | Event) => Promisable<void>) {
  if (node.tagName?.toLowerCase() === "input" && node.type === "file") {
    node.addEventListener("change", (e: Event) => {
      if ((e.target as HTMLInputElement)?.files?.length) {
        arrayApi((e.target as HTMLInputElement), opts, cb.bind(null, e));
      } else {
        cb(e);
      }
    });
  } else {
    const stop = (e: DragEvent) => e.preventDefault();
    node.addEventListener("dragover", stop);
    node.addEventListener("dragenter", stop);
    node.addEventListener("drop", (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.items?.[0]?.webkitGetAsEntry()) {
        entriesApi(e.dataTransfer.items, opts, cb.bind(null, e));
      } else if (e.dataTransfer?.files) {
        arrayApi(e.dataTransfer, opts, cb.bind(null, e));
      } else {
        cb(e);
      }
    });
  }
}

// prefixed API implemented in Chrome 11+ as well as array fallback
function arrayApi(input: DataTransfer | HTMLInputElement, opts: UppieOpts, cb: (formData: FormData, files: Array<string>) => void) {
  const fd = new FormData();
  const files: Array<string> = [];

  for (const file of input.files || []) {
    fd.append(opts.name!, file, file.webkitRelativePath || file.name);
    files.push(file.webkitRelativePath || file.name);
  }
  cb(fd, files);
}

function readEntries(entry: any, reader: FileSystemDirectoryReader | null, oldEntries: any, cb: any) {
  const dirReader = reader || entry.createReader();

  dirReader.readEntries((entries: any) => {
    const newEntries = oldEntries ? oldEntries.concat(entries) : entries;
    if (entries.length) {
      setTimeout(readEntries.bind(null, entry, dirReader, newEntries, cb), 0);
    } else {
      cb(newEntries);
    }
  });
}

// drag and drop API implemented in Chrome 11+
function entriesApi(items: DataTransferItemList, opts: UppieOpts, cb: any) {
  const fd = new FormData();
  const files: Array<string> = [];
  const rootPromises: Array<Promise<any>> = [];

  function readDirectory(entry: FileSystemEntry, path: string | null, resolve: any) {
    if (!path) path = entry.name;
    readEntries(entry, null, 0, (entries: any) => {
      const promises: Array<Promise<any>> = [];
      for (const entry of entries) {
        promises.push(new Promise(resolve => {
          if (entry.isFile) {
            entry.file((file: File) => {
              const p = `${path}/${file.name}`;
              fd.append(opts.name!, file, p);
              files.push(p);
              // @ts-expect-error
              resolve();
              // @ts-expect-error
            }, resolve.bind());
          } else {
            readDirectory(entry, `${path}/${entry.name}`, resolve);
          }
        }));
      }
      Promise.all(promises).then(resolve.bind());
    });
  }

  for (const entry of items) {
    const webkitEntry = entry.webkitGetAsEntry();
    if (webkitEntry) {
      rootPromises.push(new Promise((resolve) => {
        if (webkitEntry.isFile) {
          // @ts-expect-error
          webkitEntry.file((file: File) => {
            fd.append(opts.name!, file, file.name);
            files.push(file.name);
            // @ts-expect-error
            resolve();
            // @ts-expect-error
          }, resolve.bind());
        } else if (webkitEntry.isDirectory) {
          readDirectory(webkitEntry, null, resolve);
        }
      }));
    }
  }
  Promise.all(rootPromises).then(cb.bind(null, fd, files));
}
