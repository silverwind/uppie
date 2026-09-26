export type UppieOpts = {
  name?: string,
};

export type UppieCallback = (event: Event, formData?: FormData, files?: string[]) => unknown;

export function uppie(
  nodes: NodeList | Element[] | Element,
  opts: UppieOpts | UppieCallback,
  cb?: UppieCallback,
) {
  if (typeof opts === "function") {
    cb = opts as UppieCallback;
    opts = {};
  }
  const name = opts.name || "files[]";
  for (const node of nodes instanceof NodeList || Array.isArray(nodes) ? nodes : [nodes]) {
    watch(node as HTMLInputElement, name, cb!);
  }
}

function watch(node: HTMLInputElement, name: string, cb: UppieCallback) {
  if (node.tagName === "INPUT" && node.type === "file") {
    node.addEventListener("change", e => {
      const target = e.target as HTMLInputElement;
      if (target.files?.length) arrayApi(target.files, name, cb.bind(null, e));
      else cb(e);
    });
  } else {
    const stop = (e: DragEvent) => e.preventDefault();
    node.addEventListener("dragover", stop);
    node.addEventListener("dragenter", stop);
    node.addEventListener("drop", e => {
      e.preventDefault();
      const dt = e.dataTransfer;
      if (dt?.items?.[0]?.webkitGetAsEntry()) entriesApi(dt.items, name, cb.bind(null, e));
      else if (dt?.files) arrayApi(dt.files, name, cb.bind(null, e));
      else cb(e);
    });
  }
}

function arrayApi(
  fileList: FileList,
  name: string,
  cb: (fd: FormData, files: string[]) => void,
) {
  const fd = new FormData();
  const files: string[] = [];
  for (const file of fileList) {
    const path = file.webkitRelativePath || file.name;
    fd.append(name, file, path);
    files.push(path);
  }
  cb(fd, files);
}

async function readEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const acc: FileSystemEntry[] = [];
  while (true) {
    const entries = await new Promise<FileSystemEntry[]>(resolve => reader.readEntries(resolve));
    if (!entries.length) return acc;
    acc.push(...entries);
  }
}

async function entriesApi(
  items: DataTransferItemList,
  name: string,
  cb: (fd: FormData, files: string[]) => void,
) {
  const fd = new FormData();
  const files: string[] = [];

  async function walk(entry: any, path: string): Promise<void> {
    if (entry.isFile) {
      await new Promise<void>(resolve => entry.file((file: File) => {
        fd.append(name, file, path);
        files.push(path);
        resolve();
      }, resolve));
    } else if (entry.isDirectory) {
      await Promise.all((await readEntries(entry.createReader())).map(child => walk(child, `${path}/${child.name}`)));
    }
  }

  const promises: Promise<void>[] = [];
  for (const item of items) {
    const entry = item.webkitGetAsEntry();
    if (entry) promises.push(walk(entry, entry.name));
  }
  await Promise.all(promises);
  cb(fd, files);
}
