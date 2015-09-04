/*! uppie | (c) 2015 silverwind | BSD license */
/* eslint-env browser, commonjs, amd */
/* eslint strict: [2, "function"] */
(function (m) {
  "use strict";
  if (typeof exports === "object" && typeof module === "object")
    module.exports = m();
  else if (typeof define === "function" && define.amd)
    return define([], m);
  else
    this.Uppie = m();
})(function () {
  "use strict";
  return function Uppie() {
    return function (node, cb) {
      if (node.tagName.toLowerCase === "input" && node.type === "file") {
        node.addEventListener("change", function (event) {
          if (!event.target.files || !event.target.files.length) return;
          if ("getFilesAndDirectories" in event.target) {
            newDirectoryApi(event.target, cb);
          } else if ("webkitRelativePath" in event.target.files[0]) {
            oldDirectoryApi(event.target, cb);
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
          var dataTransfer = event.dataTransfer;
          if ("getFilesAndDirectories" in dataTransfer) {
            newDirectoryApi(dataTransfer, cb);
          } else if (dataTransfer.items) {
            oldDropApi(dataTransfer.items, cb);
          }
        });
      }
    };
  };

  // API implemented in Firefox 42+ and Edge
  function newDirectoryApi(input, cb) {
    var fd = new FormData(), files = [];
    var iterate = function (entries, path, resolve) {
      var promises = [];
      entries.forEach(function (entry) {
        promises.push(new Promise(function (resolve) {
          if ("getFilesAndDirectories" in entry) { // it's a directory
            entry.getFilesAndDirectories().then(function (entries) {
              iterate(entries, entry.path + entry.name + "/", resolve);
            });
          } else { // it's a file
            if (entry.name) {
              var p = (path + entry.name).replace(/^\//, "");
              fd.append("file", entry, p);
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
  function oldDirectoryApi(input, cb) {
    var fd = new FormData(), files = [];
    [].slice.call(input.files).forEach(function (file) {
      fd.append("file", file, file.webkitRelativePath || file.name);
      files.push(file.webkitRelativePath || file.name);
    });
    cb(fd, files);
  }

  // fallback for files without directories
  function multipleApi(input, cb) {
    var fd = new FormData(), files = [];
    [].slice.call(input.files).forEach(function (file) {
      fd.append("file", file, file.name);
      files.push(file.name);
    });
    cb(fd, files);
  }

  // old drag and drop API implemented in Chrome 11+
  function oldDropApi(items, cb) {
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
                fd.append("file", file, path + "/" + file.name);
                files.push(path + "/" + file.name);
                resolve();
              }, resolve.bind());
            } else readDirectory(entry, path + "/" + entry.name, resolve);
          }));
        });
        Promise.all(promises).then(resolve.bind());
      });
    }

    [].slice.call(items).forEach(function (entry) {
      entry = entry.webkitGetAsEntry();
      if (entry) {
        rootPromises.push(new Promise(function (resolve) {
          if (entry.isFile) {
            entry.file(function (file) {
              fd.append("file", file, file.name);
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
