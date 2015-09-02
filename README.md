# uppie [![NPM version](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![Dependency Status](http://img.shields.io/david/silverwind/uppie.svg?style=flat)](https://david-dm.org/silverwind/uppie) [![Downloads per month](http://img.shields.io/npm/dm/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie)
> Cross-browser directory uploads made easy

uppie is a tiny library (less than 1 KiB gzipped) which wraps all current implementations of directory and multi-file uploading into a simple function and delivers a `FormData` object to be summitted through XHR.

Both the `<input>` element and drag and drop are supported. The minimum required browsers for directory uploads are Chrome 29+ and Firefox 42+. Edge will eventually support this, but does not as of build 10532.

You can lower the browser requirements by providing a `Promise` polyfill, at which point your limiting factor will be [xhr2 suppport](http://caniuse.com/#feat=xhr2).

## Example
```html
<input type="file" id="file-input" multiple directory webkitdirectory/>
<script src="uppie.js"></script>
```
```js
var uppie = new Uppie();

uppie(document.querySelector('#file-input'), function (formData, files) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');
  xhr.send(formData);
});
```

## API
### uppie(node, callback)
- `node` *Node*: A DOM node. If a file input is given, uppie will monitor it for `change` events. Any other element type will be enabled as a dropzone and watched for `drop` events. If you want to use both on the same element, use a hidden `<input>` and forward the click event.
- `callback` *function*: callback which is called every time the selected files change or when files are dropped in the dropzone.

The callback receives `formData` (to be used for XHR uploading) and `files` (an array of paths for preview purposes). The format of each `formData` entry is as follows:

- `name` : The file name. With `empty` set, `/` is appended for empty directories.
- `value`: The file data.
- `filename`: The full path to the file, with `/` used as path separator. Does not include a leading slash. With `empty` set, `/` is appended for empty directories.

## Recommended `input` attributes

- `multiple`: to allow multiple files to be selected
- `directory`: to enable directory upload in Firefox (42+) and Edge (soon)
- `webkitdirectory`: to enable directory upload in Chrome (29+)

## Browser support status

Browser support for directory upload is a bit lacking at the moment but Firefox, Chrome and Edge should all be fully supported in the near future.

|         | directories in input[file] | directories in drag and drop |
|---------|----------------------------|------------------------------|
| Firefox | yes (42+)                  | yes (42+, in multiprocess)   |
| Chrome  | yes (29+)                  | yes (29+)                    |
| Edge    | no (as of build 10532)     | no (as of build 10532)       |
| Safari  | no                         | no                           |

© 2015 [silverwind](https://github.com/silverwind), distributed under BSD licence
