/*! uppie | (c) 2015 silverwind | BSD license */
/* eslint-disable strict, no-wrap-func */

(function (mod) {
  if (typeof exports === "object" && typeof module === "object") // CommonJS
    module.exports = mod();
  else if (typeof define === "function" && define.amd) // AMD
    return define([], mod);
  else // Plain browser environment
    this.Uppie = mod();
})(function () {
  "use strict";
  return function Uppie(opts) {
    return function (node, cb) {
      if (node.tagName === "INPUT" && node.type === "file") {
        node.addEventListener("change", function (event) {
          if (!event.target.files || !event.target.files.length) return;
          if ("getFilesAndDirectories" in event.target) {
            newDirectoryApi(event.target, opts, cb);
          } else if ("webkitRelativePath" in event.target.files[0]) {
            oldDirectoryApi(event.target, opts, cb);
          } else {
            multipleApi(event.target, cb);
          }
        });
      } else {
        var stop = function (event) { event.preventDefault(); };
        node.addEventListener("dragover", stop);
        node.addEventListener("dragenter", stop);
        node.addEventListener("drop", function (event) {
          event.preventDefault();
          if ("getFilesAndDirectories" in event.dataTransfer) {
            newDirectoryApi(event.dataTransfer, opts, cb);
          } else if ("webkitdirectory" in document.createElement("input")) {
            oldDropApi(event.dataTransfer.items, opts, cb);
          }
        });
      }
    };
  };

  // API implemented in Firefox 42+ and Edge
  function newDirectoryApi(input, opts, cb) {
    var fd = new FormData(), files = [];
    var iterate = function (entries, path, resolve) {
      var promises = [];
      entries.forEach(function (entry) {
        promises.push(new Promise(function (resolve) {
          if ("getFilesAndDirectories" in entry) { // it's a directory
            entry.getFilesAndDirectories().then(function (entries) {
              if (opts.empty && !entries.length) {
                var p = (path + entry.name + "/").replace(/^\//, "");
                fd.append(entry.name + "/", new Blob(), p);
                files.push(p);
              }
              iterate(entries, entry.path + entry.name + "/", resolve);
            });
          } else { // it's a file
            if (entry.name) {
              var p = (path + entry.name).replace(/^\//, "");
              fd.append(entry.name, entry, p);
              files.push(p);
            }
            resolve();
          }
        }));
      });
      Promise.all(promises).then(resolve.bind());
    };
    input.getFilesAndDirectories().then(function (entries) {
      new Promise(function (resolve) {
        iterate(entries, "/", resolve);
      }).then(cb.bind(null, fd, files));
    });
  }

  // old prefixed API implemented in Chrome 11+
  function oldDirectoryApi(input, opts, cb) {
    var fd = new FormData(), files = [];
    [].slice.call(input.files).forEach(function (file) {
      fd.append(file.name, file, file.webkitRelativePath);
      files.push(file.webkitRelativePath);
    });
    cb(fd, files);
  }

  // fallback for files without directories
  function multipleApi(input, cb) {
    var fd = new FormData(), files = [];
    [].slice.call(input.files).forEach(function (file) {
      fd.append(file.name, file, file.name);
      files.push(file.name);
    });
    cb(fd, files);
  }

  // old drag and drop API implemented in Chrome 11+
  function oldDropApi(items, opts, cb) {
    var fd = new FormData(), files = [], rootPromises = [];

    function readEntries(entry, reader, oldEntries, cb) {
      var dirReader = reader || entry.createReader();
      dirReader.readEntries(function (entries) {
        var newEntries = oldEntries ? oldEntries.concat(entries) : entries;
        if (entries.length) {
          setTimeout(readEntries.bind(null, entry, dirReader, newEntries, cb), 0);
        } else {
          cb(newEntries);
        }
      });
    }

    function readDirectory(entry, path, resolve) {
      if (!path) path = entry.name;
      readEntries(entry, undefined, undefined, function (entries) {
        var promises = [];
        entries.forEach(function (entry) {
          promises.push(new Promise(function (resolve) {
            if (entry.isFile) {
              entry.file(function (file) {
                fd.append(file.name, file, path + "/" + file.name);
                files.push(path + "/" + file.name);
                resolve();
              }, resolve.bind());
            } else readDirectory(entry, path + "/" + entry.name, resolve);
          }));
        });
        if (opts.empty && !entries.length) {
          fd.append(entry.name + "/", new Blob(), path + "/" + entry.name + "/");
          files.push(path + "/" + entry.name + "/");
        }
        Promise.all(promises).then(resolve.bind());
      });
    }

    [].slice.call(items).forEach(function (entry) {
      entry = entry.webkitGetAsEntry();
      if (entry) {
        rootPromises.push(new Promise(function (resolve) {
          if (entry.isFile) {
            entry.file(function (file) {
              fd.append(file.name, file, file.name);
              files.push(file.name);
              resolve();
            }, resolve.bind());
          } else if (entry.isDirectory) {
            readDirectory(entry, null, resolve);
          }
        }));
      }
    });
    Promise.all(rootPromises).then(cb.bind(null, fd, files));
  }
});
