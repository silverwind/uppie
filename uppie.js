const defaultOpts = {name: "files[]"};

export default function Uppie() { // eslint-disable-line import/no-unused-modules
  return (node, opts, cb) => {
    if (typeof opts === "function") {
      cb = opts;
      opts = defaultOpts;
    } else {
      if (!opts) opts = {};
      if (!opts.name) opts.name = defaultOpts.name;
    }

    if (node instanceof NodeList) {
      for (const n of [].slice.call(node)) {
        watch(n, opts, cb);
      }
    } else {
      watch(node, opts, cb);
    }
  };
}

function watch(node, opts, cb) {
  if (node.tagName?.toLowerCase() === "input" && node.type === "file") {
    node.addEventListener("change", e => {
      const t = e.target;
      if (t?.files?.length) {
        arrayApi(t, opts, cb.bind(null, e));
      } else {
        cb(e);
      }
    });
  } else {
    const stop = e => e.preventDefault();
    node.addEventListener("dragover", stop);
    node.addEventListener("dragenter", stop);
    node.addEventListener("drop", (e) => {
      e.preventDefault();
      const dt = e.dataTransfer;
      if (dt.items?.[0]?.webkitGetAsEntry()) {
        entriesApi(dt.items, opts, cb.bind(null, e));
      } else if (dt.files) {
        arrayApi(dt, opts, cb.bind(null, e));
      } else cb(e);
    });
  }
}

// old prefixed API implemented in Chrome 11+ as well as array fallback
function arrayApi(input, opts, cb) {
  const fd = new FormData();
  const files = [];

  for (const file of [].slice.call(input.files)) {
    fd.append(opts.name, file, file.webkitRelativePath || file.name);
    files.push(file.webkitRelativePath || file.name);
  }
  cb(fd, files);
}

function readEntries(entry, reader, oldEntries, cb) {
  const dirReader = reader || entry.createReader();

  dirReader.readEntries((entries) => {
    const newEntries = oldEntries ? oldEntries.concat(entries) : entries;
    if (entries.length) {
      setTimeout(readEntries.bind(null, entry, dirReader, newEntries, cb), 0);
    } else {
      cb(newEntries);
    }
  });
}

// old drag and drop API implemented in Chrome 11+
function entriesApi(items, opts, cb) {
  const fd = new FormData(), files = [], rootPromises = [];

  function readDirectory(entry, path, resolve) {
    if (!path) path = entry.name;
    readEntries(entry, 0, 0, (entries) => {
      const promises = [];
      for (const entry of entries) {
        promises.push(new Promise((resolve) => {
          if (entry.isFile) {
            entry.file((file) => {
              const p = `${path}/${file.name}`;
              fd.append(opts.name, file, p);
              files.push(p);
              resolve();
            }, resolve.bind());
          } else readDirectory(entry, `${path}/${entry.name}`, resolve);
        }));
      }
      Promise.all(promises).then(resolve.bind());
    });
  }

  for (let entry of [].slice.call(items)) {
    entry = entry.webkitGetAsEntry();
    if (entry) {
      rootPromises.push(new Promise((resolve) => {
        if (entry.isFile) {
          entry.file((file) => {
            fd.append(opts.name, file, file.name);
            files.push(file.name);
            resolve();
          }, resolve.bind());
        } else if (entry.isDirectory) {
          readDirectory(entry, null, resolve);
        }
      }));
    }
  }
  Promise.all(rootPromises).then(cb.bind(null, fd, files));
}
