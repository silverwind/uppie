/*! uppie | (c) 2015 silverwind | BSD license */
/* eslint-disable strict */

self.Uppie = function (opts) {
  return function (node, cb) {
    node.addEventListener("change", function (event) {
      if (!event.target.files || !event.target.files.length) return;
      if ("getFilesAndDirectories" in event.target) {
        newDirectoryApi(event, opts, cb);
      } else if ("webkitRelativePath" in event.target.files[0]) {
        oldDirectoryApi(event, opts, cb);
      } else {
        multipleApi(event, cb);
      }
    });
  };
};

// API implemented in Firefox 42+ and Edge
function newDirectoryApi(event, opts, cb) {
  var fd = new FormData(), files = [];
  var iterate = function (entries, path, resolve) {
    var promises = [];
    entries.forEach(function (entry) {
      var promise = new Promise(function (resolve) {
        if ("getFilesAndDirectories" in entry) { // it's a directory
          entry.getFilesAndDirectories().then(function (entries) {
            if (opts.includeEmptyDirectories && !entries.length) {
              fd.append(entry.name + "/", new Blob(), path + entry.name + "/");
              files.push(path + entry.name + "/");
            }
            iterate(entries, entry.path + entry.name + "/", resolve);
          });
        } else { // it's a file
          if (entry.name) {
            fd.append(entry.name, entry, path + entry.name);
            files.push(path + entry.name);
          }
          resolve();
        }
      });
      promises.push(promise);
    });
    Promise.all(promises).then(resolve.bind());
  };
  event.target.getFilesAndDirectories().then(function (entries) {
    new Promise(function (resolve) {
      iterate(entries, "/", resolve);
    }).then(cb.bind(null, fd, files));
  });
}

// Old prefixed API implemented in Chrome
function oldDirectoryApi(event, opts, cb) {
  var fd = new FormData(), files = [];
  [].slice.call(event.target.files).forEach(function (file) {
    var path = file.webkitRelativePath + "/" + file.name;
    fd.append(file.name, file, path);
    files.push(path);
  });
  cb(fd, files);
}

// Fallback for just multiple files without directories
function multipleApi(event, cb) {
  var fd = new FormData(), files = [];
  [].slice.call(event.target.files).forEach(function (file) {
    fd.append(file.name, file, file.name);
    files.push(file.name);
  });
  cb(fd, files);
}
