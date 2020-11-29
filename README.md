# uppie
[![](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![](https://img.shields.io/npm/dm/uppie.svg)](https://www.npmjs.org/package/uppie)
> Cross-browser file and directory and upload library

`uppie` is a tiny library (979 bytes gzipped) which helps you with file and directory uploads in browsers. It supports all current and past implementations of multi-file and directory uploads and provides you with a `FormData` object you can submit directly to a server through either `XMLHttpRequest` or `fetch`. Both the `<input type="file">` element and drag-and-drop are supported.

## Usage
```bash
npm install uppie
```

Alternatively, you can also include the script directly in HTML which will register `window.Uppie`:

```html
<script src="uppie.min.js"></script>
<input type="file" id="file" multiple directory webkitdirectory allowdirs/>
```
```js
const Uppie = require('uppie'); // when using npm module
const uppie = new Uppie();

uppie(document.querySelector('#file'), async (event, formData, files) => {
  await fetch('/upload', {method: 'POST', body: formData});
});
```

## Browser support

|| files via input[file] | files via DnD | directories via input[file] | directories via DnD |
|---------|---------------------- |---------------|----------------------|--------------|
| Firefox | yes                   | yes           | yes (50+)            | yes (50+)    |
| Chrome  | yes                   | yes           | yes (29+)            | yes (29+)    |
| Edge    | yes                   | yes           | yes (13+)            | yes (14+)    |
| Safari  | yes                   | yes           | yes (11.1+)          | yes (11.1+)  |

## Notes

- Empty directories are excluded from the results by all browsers as dictated by the spec.
- Firefox and Safari exclude files and directories starting with a `.`.

## API
### uppie(node, [opts], callback)
- `node` *Node* or *NodeList*: One or more DOM nodes. If a `<input type="file">` is given, uppie will monitor it for `change` events. Any other element type will be enabled as a dropzone and watched for `drop` events. If you want to use both on the same element, use a hidden `<input>` and forward the click event.
- `opts` *Object*: A options object which can contain:
  - `name`: The `name` attribute for creating the FormData entries. Default: `"files[]"`.
- `callback` *Function*: callback which is called every time the selected files change or when files are dropped in the dropzone.

The callback receives

- `event` *Event*: the original event. Useful for calling `event.stopPropagation()`.
- `formData` *FormData*: FormData object to be used for XHR2 uploading.
- `files` *Array*: Array of paths for preview purposes.

#### FormData format

`name` defaults to `"files[]"`, `filename` will be the full path to the file, with `/` used as path separator. Does not include a leading slash. Make sure to sanitize `filename` on the server before writing it to the disk to prevent exploits involving `..` in the path. Example FormData:

```
------Boundary
Content-Disposition: form-data; name="files[]"; filename="docs/1.txt"
Content-Type: text/plain

[DATA]
------Boundary
Content-Disposition: form-data; name="files[]"; filename="docs/path/2.txt"
Content-Type: text/plain

[DATA]
------Boundary
Content-Disposition: form-data; name="files[]"; filename="docs/path/to/3.txt"
Content-Type: text/plain
```

## Recommended `input` element attributes

- `multiple`: allow multiple files to be selected.
- `webkitdirectory`: enable directory uploads in Chrome and Firefox.
- `allowdirs`: enable experimental directory upload API in Firefox and Edge.

## PHP example

Below is example for PHP 7.0 and possibly earlier versions. PHP does not parse the path from the `filename` field, so it is necessary to submit the path through other means, like as separate FormData fields as done in the example.

````js
var uppie = new Uppie();
uppie(document.documentElement, function(event, formData, files) {
  files.forEach(function(path) {
    formData.append("paths[]", path);
  });

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'upload.php');
  xhr.send(formData);
});
````
And in `upload.php`:
````php
foreach ($_FILES['files']['name'] as $i => $name) {
  if (strlen($_FILES['files']['name'][$i]) > 1) {
    $fullpath = strip_tags($_POST['paths'][$i]);
    $path = dirname($fullpath);

    if (!is_dir('uploads/'.$path)){
      mkdir('uploads/'.$path);
    }
    if (move_uploaded_file($_FILES['files']['tmp_name'][$i], 'uploads/'.$fullpath)) {
        echo '<li>'.$name.'</li>';
    }
  }
}
````

Note that PHP's [upload limits](http://php.net/manual/en/ini.core.php#ini.sect.file-uploads) might need to be raised depending on use case.

© [silverwind](https://github.com/silverwind), distributed under BSD licence
