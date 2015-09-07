# uppie [![NPM version](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![Dependency Status](http://img.shields.io/david/silverwind/uppie.svg?style=flat)](https://david-dm.org/silverwind/uppie) [![Downloads per month](http://img.shields.io/npm/dm/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie)
> Cross-browser directory uploads made easy

uppie is a tiny library (less than 1 KiB gzipped) which wraps all current implementations of directory and multi-file uploading into a simple function and delivers a `FormData` object to be summitted through XHR2.

Both the `<input>` element and drag and drop are supported. The minimum required browsers for directory uploads are Chrome 29+ and Firefox 42+. Edge will eventually support this, but does not as of build 10532.

You can lower the browser requirements by providing a `Promise` polyfill, at which point your limiting factor will be [XHR2 support](http://caniuse.com/#feat=xhr2).

## Example
```html
<input type="file" id="file-input" multiple directory webkitdirectory/>
<script src="uppie.js"></script>
```
```js
var uppie = new Uppie();

uppie(document.querySelector('#file-input'), function (event, formData, files) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');
  xhr.send(formData);
});
```

## Browser support

Browser support for directory upload is pretty much WIP. You can still use uppie for single or multi-file uploads in browsers that don't support directories yet.

|         | directories in input[file] | directories in drag and drop |
|---------|----------------------------|------------------------------|
| Firefox | yes (42+)                  | yes (42+, in multiprocess)   |
| Chrome  | yes (29+)                  | yes (29+)                    |
| Edge    | no (as of build 10532)     | no (as of build 10532)       |
| Safari  | no                         | no                           |


## API
### uppie(node, callback)
- `node` *Node*: A DOM node. If a `<input type="file">` is given, uppie will monitor it for `change` events. Any other element type will be enabled as a dropzone and watched for `drop` events. If you want to use both on the same element, use a hidden `<input>` and forward the click event.
- `callback` *function*: callback which is called every time the selected files change or when files are dropped in the dropzone.

The callback receives

- `event` *Event*: the original event. Useful for calling `.stopPropagation()`
- `formData` *FormData*: FormData object to be used for XHR2 uploading
- `files` *Array*: Array of paths for preview purposes

#### FormData format

- `name` will always be `'file'`
- `filename` will be the full path to the file, with `/` used as path separator. Does not include a leading slash

Here's an example:
```
------Boundary
Content-Disposition: form-data; name="file"; filename="docs/1.txt"
Content-Type: text/plain

[DATA]
------Boundary
Content-Disposition: form-data; name="file"; filename="docs/path/2.txt"
Content-Type: text/plain

[DATA]
------Boundary
Content-Disposition: form-data; name="file"; filename="docs/path/to/3.txt"
Content-Type: text/plain
```

## Recommended `input` attributes

- `multiple`: to allow multiple files to be selected
- `directory`: to enable directory upload in Firefox (42+) and Edge (soon)
- `webkitdirectory`: to enable directory upload in Chrome (29+)

© 2015 [silverwind](https://github.com/silverwind), distributed under BSD licence
