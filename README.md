# uppie [![NPM version](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![Dependency Status](http://img.shields.io/david/silverwind/uppie.svg?style=flat)](https://david-dm.org/silverwind/uppie) [![Downloads per month](http://img.shields.io/npm/dm/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie)
> Cross-browser directory uploads made easy

uppie wraps all current implementations of directory uploads into one simple function call and delivers a standardized `FormData` object to be summitted through XHR. Currently only file inputs are supported, drag and drop will follow soon.

The minimum required browsers are Chrome 11, Firefox 42 and Edge.
## Example usage
```html
<input type="file" id="file-input" multiple directory webkitdirectory/>
<script src="uppie.js"></script>
```
```js
var uppie = new Uppie();

uppie(document.querySelector("#file-input"), function (formData, files) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "/upload");
  xhr.send(formData);
});
```

## API
### Uppie([options])
Valid options for the constructor are:
- `includeEmptyDirectories` *boolean*: Whether to include empty directories. To discern from empty files, empty directories are identified by a trailing slash in both the `name` and `filename` formData fields and will require special code on the server to handle. Default: `false`.

### uppie(node, callback)
- `node` *Node* : a file input element.
- `callback` *function*: callback which is called every time the selected files change.

The callback receives `formData` (to be used for XHR uploading) and `files` (an array of paths, useful previewing).

## Recommended `input` attributes

- `multiple`: to allow multiple files to be selected
- `directory`: to enable directory upload in Firefox (42+) and Edge
- `webkitDirectory`: to enable directory upload in Chrome (11+)

## Drawbacks

- Chrome's implementation doesn't include empty directories in the API ([Chromium bug](https://code.google.com/p/chromium/issues/detail?can=2&id=360412)).

© 2015 [silverwind](https://github.com/silverwind), distributed under BSD licence
