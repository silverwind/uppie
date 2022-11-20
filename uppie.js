const defaultOpts = {
  name: "files[]",
};

export default function uppie(nodes, opts, cb) {
  if (typeof opts === "function") {
    cb = opts;
    opts = defaultOpts;
  } else {
    if (!opts) opts = {};
    if (!opts.name) opts.name = defaultOpts.name;
  }

  for (const node of ((nodes instanceof NodeList || Array.isArray(nodes)) ? nodes : [nodes])) {
    watch(node, opts, cb);
  }
}

function watch(node, opts, cb) {
  if (node.tagName?.toLowerCase() === "input" && node.type === "file") {
    node.addEventListener("change", e => {
      if (e.target?.files?.length) {
        arrayApi(e.target, opts, cb.bind(null, e));
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
      if (e.dataTransfer.items?.[0]?.webkitGetAsEntry()) {
        entriesApi(e.dataTransfer.items, opts, cb.bind(null, e));
      } else if (e.dataTransfer.files) {
        arrayApi(e.dataTransfer, opts, cb.bind(null, e));
      } else {
        cb(e);
      }
    });
  }
}

// prefixed API implemented in Chrome 11+ as well as array fallback
function arrayApi(input, opts, cb) {
  const fd = new FormData();
  const files = [];

  for (const file of input.files) {
    fd.append(opts.name, file, file.webkitRelativePath || file.name);
    files.push(file.webkitRelativePath || file.name);
  }
  cb(fd, files);
}

function readEntries(entry, reader, oldEntries, cb) {
  const dirReader = reader || entry.createReader();

  dirReader.readEntries(entries => {
    const newEntries = oldEntries ? oldEntries.concat(entries) : entries;
    if (entries.length) {
      setTimeout(readEntries.bind(null, entry, dirReader, newEntries, cb), 0);
    } else {
      cb(newEntries);
    }
  });
}

// drag and drop API implemented in Chrome 11+
function entriesApi(items, opts, cb) {
  const fd = new FormData();
  const files = [];
  const rootPromises = [];

  function readDirectory(entry, path, resolve) {
    if (!path) path = entry.name;
    readEntries(entry, 0, 0, entries => {
      const promises = [];
      for (const entry of entries) {
        promises.push(new Promise(resolve => {
          if (entry.isFile) {
            entry.file(file => {
              const p = `${path}/${file.name}`;
              fd.append(opts.name, file, p);
              files.push(p);
              resolve();
            }, resolve.bind());
          } else {
            readDirectory(entry, `${path}/${entry.name}`, resolve);
          }
        }));
      }
      Promise.all(promises).then(resolve.bind());
    });
  }

  for (let entry of items) {
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
