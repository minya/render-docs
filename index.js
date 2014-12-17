'use strict';
var marked = require('marked');
var fs = require('fs');
var through = require('through2');
var toc = require('marked-toc');
var pdf = require('html-pdf');
var path = require('path')

module.exports = {
	 renderPdf: function() {
		return through.obj(function(file, enc, cb) {
			var html = file.contents.toString(enc);
			var options = {
				format: 'A4',
				border: '1cm',
				type: 'pdf'
			};
			pdf.create(html, options, function(err, buffer) {
				file.path = file.base + file.relative.replace('.html', '.pdf');
				file.contents = buffer;
				cb(null, file);
			});
		});
	},

	renderHtml: function() {
		return through.obj(function(file, enc, cb) {
			var value = file.contents.toString();
			value = toc.insert(value, {
				maxDepth: 2
			});

			file.contents = new Buffer(value);

			var markedOptions = {
				renderer: renderer
			};

			marked(file.contents.toString(), markedOptions, function (err, data) {
				if (err) {
					cb(new Error('plugin error (markdown-render)', err, {fileName: file.path}));
					return;
				}

				file.contents = new Buffer(data);
				file.path = replaceExtension(file.path, '.html');
				var css = fs.readFileSync(require.resolve('./layout.css'), { encoding: 'utf8' });
				var layout = fs.readFileSync(require.resolve('./layout.html'), { encoding: 'utf8' });

				var html = layout
					.replace('<!-- css -->', css)
					.replace("<!-- contents -->", file.contents.toString());

				file.contents = new Buffer(html);

				cb(null, file);
			});
		});
	}
};


function replaceExtension(npath, ext){
  if (typeof npath !== 'string') return npath;
  if (npath.length === 0) return npath;

  var nFileName = path.basename(npath, path.extname(npath))+ext;
  return path.join(path.dirname(npath), nFileName);
};

var renderer = new marked.Renderer();
renderer.heading = function (text, level) {
	var escapedText = text.toLowerCase().replace(/[ \/\?\*]+/g, '-');
	return '<h' + level + '><a name="'
		+ escapedText + '" class="anchor" href="#'
		+ escapedText + '"><span class="header-link"></span></a>'
		+ text + '</h' + level + '>';
};

