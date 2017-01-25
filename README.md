# uppie
[![](https://img.shields.io/npm/v/uppie.svg?style=flat)](https://www.npmjs.org/package/uppie) [![](https://img.shields.io/npm/dm/uppie.svg)](https://www.npmjs.org/package/uppie) [![](https://api.travis-ci.org/silverwind/uppie.svg?style=flat)](https://travis-ci.org/silverwind/uppie)
> Cross-browser directory and multi-file upload library

`uppie` is a tiny (**902 B bytes** gzipped) library which wraps all current implementations of multi-file and directory uploading into a convenient function and delivers a `FormData` object to be summitted asynchronously. Both the `<input>` element and drag-and-drop uploads are supported.

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
| Firefox    | yes (50+)                  | yes (50+)                    |
| Chrome     | yes (29+)                  | yes (29+)                    |
| Edge       | yes (13+)                  | no                           |
| Safari     | no                         | no                           |

## Caveats

- Empty directories are excluded from the results by all browsers as dictated by the spec.
- Firefox currently excludes files and directories starting with a `.`, see [bug 1266531](https://bugzilla.mozilla.org/show_bug.cgi?id=1266531).

## API
### uppie(node, callback)
- `node` *Node* or *NodeList*: One or more DOM nodes. If a `<input type="file">` is given, uppie will monitor it for `change` events. Any other element type will be enabled as a dropzone and watched for `drop` events. If you want to use both on the same element, use a hidden `<input>` and forward the click event.
- `callback` *Function*: callback which is called every time the selected files change or when files are dropped in the dropzone.

The callback receives

- `event` *Event*: the original event. Useful for calling `event.stopPropagation()`.
- `formData` *FormData*: FormData object to be used for XHR2 uploading.
- `files` *Array*: Array of paths for preview purposes.

#### FormData format

- `name` will always be `"files[]"`.
- `filename` will be the full path to the file, with `/` used as path separator. Does not include a leading slash.

Here's an example:
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

- `multiple`: allow multiple files (no directories) to be selected.
- `webkitdirectory`: enable directory uploads in Chrome and Firefox.
- `allowdirs`: enable experimental directory upload API in Firefox and Edge.

## PHP example

Below is example for PHP 7.0 and possibly earlier versions. PHP does not parse the path from the `filename` field, so it is necessary to submit the path through other means, like as separate FormData fields as done in the example.

````js
var uppie = new Uppie();
uppie(document.documentElement, function(event, formData, files) {
  Array.prototype.forEach.call(files, function(f) {
    formData.append("paths[]", f);
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
