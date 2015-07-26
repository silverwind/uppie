/* global Uppie */
/* eslint-disable no-proto */
"use strict";

/* modified bling.js */
var $ = document.querySelector.bind(document);
Node.prototype.on = window.on = function (name, fn) { this.addEventListener(name, fn); };
NodeList.prototype.__proto__ = Array.prototype;
NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) { this.forEach(function (elem) { elem.on(name, fn); }); };

/* example to print all uploaded paths */
window.on("DOMContentLoaded", function () {
  /* used on an input element */
  var uppieInput = new Uppie({empty: true});
  uppieInput($("#input"), function (formData, files) {
    $("#output").textContent = files.join("\n");
  });
  /* used on a dropzone element (body is used here) */
  var uppieDrop = new Uppie({empty: true});
  uppieDrop(document.body, function (formData, files) {
    $("#output").textContent = files.join("\n");
  });
});

