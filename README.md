# uppie [![NPM version](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![Dependency Status](http://img.shields.io/david/silverwind/uppie.svg?style=flat)](https://david-dm.org/silverwind/uppie) [![Downloads per month](http://img.shields.io/npm/dm/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie)
> Cross-browser directory and multi-file upload library

`uppie` is a tiny library which wraps all current implementations of [directory uploading](https://wicg.github.io/directory-upload/proposal.html) into a convenient function and delivers a `FormData` object to be summitted through XHR2.

Both the `<input>` element and drag and drop are supported. The minimum required browsers for directory uploads are Chrome 29+, Firefox 42+ and Edge 13+. Safari does not support any form of directory uploads currently.

`uppie` currently weights **908 bytes** gzipped.

## Example (also see this [demo](https://silverwind.io/uppie/example.html))
```html
<input type="file" id="file-input" multiple directory webkitdirectory allowdirs/>
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

Browser support for the new API directory upload spec is WIP on Firefox and Edge. Chrome supports an older spec, which is also supported.

|            | directories in input[file] | directories in drag and drop |
|------------|----------------------------|------------------------------|
| Firefox \* | yes (42+)                  | yes (42+)                    |
| Chrome     | yes (29+)                  | yes (29+)                    |
| Edge       | yes (13+)                  | no                           |
| Safari     | no                         | no                           |

\* Needs `dom.input.dirpicker` set to `true` in `about:config`.

## Caveats

- Empty directories are excluded from the results by all browsers as dictated by the spec.
- Firefox currently excludes files and directories starting with a `.`, see [bug 1266531](https://bugzilla.mozilla.org/show_bug.cgi?id=1266531).

## API
### uppie(node, callback)
- `node` *Node* or *NodeList*: One or more DOM nodes. If a `<input type="file">` is given, uppie will monitor it for `change` events. Any other element type will be enabled as a dropzone and watched for `drop` events. If you want to use both on the same element, use a hidden `<input>` and forward the click event.
- `callback` *Function*: callback which is called every time the selected files change or when files are dropped in the dropzone.

The callback receives

- `event` *Event*: the original event. Useful for calling `.stopPropagation()`.
- `formData` *FormData*: FormData object to be used for XHR2 uploading.
- `files` *Array*: Array of paths for preview purposes.

#### FormData format

- `name` will always be `"file"`.
- `filename` will be the full path to the file, with `/` used as path separator. Does not include a leading slash.

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

## Recommended `input` element attributes

- `multiple`: allow multiple files to be selected.
- `allowdirs`: enable directory uploads in Firefox and Edge.
- `directory`: enable directory uploads in Firefox and Edge (deprecated).
- `webkitdirectory`: enable directory uploads in Chrome.


© [silverwind](https://github.com/silverwind), distributed under BSD licence
