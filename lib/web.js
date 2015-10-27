var slice = Array.prototype.slice;

// Web template
function Node (before, after) {
	this.before = before;
	this.after = after;
	this.children = [];
	this.scripts = [];
}

Node.prototype._add = function(node) {
	this.children.push(node);
};

Node.prototype._append = function(before, after) {
	var node = new Node(before, after);
	this.children.push(node);
	return node;
};

Node.prototype.compile = function() {
	var res = this.before;
	this.children.forEach(function(node){
		res += node.compile();
	});
	return res + this.after;
};

Node.prototype.h1 = function(text) {
	this._hn(1, text);
};

Node.prototype.h2 = function(text) {
	this._hn(2, text);
};

Node.prototype.h3 = function(text) {
	this._hn(3, text);
};

Node.prototype.h4 = function(text) {
	this._hn(4, text);
};

Node.prototype.h5 = function(text) {
	this._hn(5, text);
};

Node.prototype._hn = function(n, text) {
	var before = '<h' + n + '>';
	if (text) {
		before += text;
	}
	var after = '</h' + n + '>';
	return this._append(before, after);
};

Node.prototype.button = function(style, cb) {
	if (typeof style !== 'string') {	// no style
		cb = style;
		style = 'default';
	}

	var before = '<button class="btn ';
	if (style) {
		before += 'btn-' + style + '"';
	} else {
		before += '"';
	}
	if (typeof cb === 'function') {
		before += ' onclick="(' + cb.toString() + ')()"';
	}
	before += '>';
	return this._append(before, '</button>');
};

Node.prototype._div = function(cls) {
	var before = '<div class="'+cls+'">';
	return this._append(before, '</div>');
};

Node.prototype.row = function() {
	return this._div('row');
};

Node.prototype.well = function() {
	return this._div('well');
};

Node.prototype.dropdown = function(text, style) {
	style = style || 'default';
	var before = ['<div class="dropdown">',
	'<button class="btn btn-' + style + ' dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">',
	text,
    '<span class="caret"></span>',
    '</button>',
    '<ul class="dropdown-menu">'].join('\n');

    var after = '</ul>\n</div>\n';
    return this._append(before, after);
};

Node.prototype.dropitem = function(href, disabled) {
	if (!href) {
		href = '#';
	}
	var before = '<li' + (disabled ? ' class="disabled"' : '') + '><a href="' + href + '">';
	var after = '</a></li>'
	return this._append(before, after);
};

Node.prototype.split = function() {
	var self = this;
	var args = slice.call(arguments);
	var last = args.length-1;
	var cb = args[last];
	if (typeof cb === 'function') {
		args.splice(last);
	} else {
		cb = null;
	}
	args.forEach(function(col){
		var before = '<div class="col-md-' + col + '">';
		var after = '</div>'
		var child = new Node(before, after);
		self._add(child);
	});
	if (cb) {
		cb.apply(this, this.children);
	} else {
		return this.children;
	}
};

Node.prototype.text = function(text) {
	this.before += text;	
	return this;
};

Node.prototype.br = function() {
	this.after += '<br>';	
	return this;
};

Node.prototype.dropdivider = function() {
	var before = '<li role="separator" class="divider">\n';
	var after = '</li>\n';	
	return this._append(before, after);
};

exports.main = function (title) {
	var before = 
	['<!DOCTYPE html>',
	'<html>',
	'<head>',
	(title ? '<title>' + title + '</title>' : ''),
	'<link rel="stylesheet" href="http://apps.bdimg.com/libs/bootstrap/3.3.4/css/bootstrap.min.css">',
	'<script src="http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js"></script>',
	'<script src="http://apps.bdimg.com/libs/bootstrap/3.3.4/js/bootstrap.min.js"></script>',
	'</head>',
	'<body>',
	'<div class="container-fluid">'].join('\n');

	var after = 
	['</div>',
	'</body>',
	'</html>'].join('\n');

	return new Node(before, after)
};
