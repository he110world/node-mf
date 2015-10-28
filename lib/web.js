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

Node.prototype.button = function(text, style) {
	if (typeof style !== 'string') {	// no style
		cb = style;
		style = 'default';
	}

	var before = '<button onclick="void(0)" class="btn ';
	if (style) {
		before += 'btn-' + style + '"';
	} else {
		before += '"';
	}
	before += '>' + (text || '');
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

Node.prototype.dropitem = function(text, disabled) {
	var before = '<li onclick="void(0)"' + (disabled ? ' class="disabled"' : '') + '><a href="#">' + (text || '');
	var after = '</a></li>'
	return this._append(before, after);
};

Node.prototype.col = function(numcols) {
	var before = '<div class="col-md-' + numcols + '">';
	var after = '</div>'
	return this._append(before, after);
};

Node.prototype.cols = function() {
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
	}
	return this;
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

Node.prototype.searchinput = function(left_title, placeholder, right_title) {
	var before = ['<div class="input-group">',
	left_title ? '<span class="input-group-btn"><button class="btn btn-primary" type="button" onclick="void(0)">' + left_title + '</button></span>' : '',
	'<input type="text" class="form-control" ' + (placeholder ? 'placeholder="' + placeholder + '"': '') + '>',
	right_title ? '<span class="input-group-btn"><button class="btn btn-primary" type="button" onclick="void(0)">' + right_title + '</button></span>' : ''].join('\n');

	var after = '</div>\n';
	return this._append(before, after);
};

Node.prototype.textinput = function(left_title, placeholder, right_title) {
	var before = ['<div class="input-group">',
	left_title ? '<span class="input-group-addon">' + left_title + '</span>' : '',
	'<input type="text" class="form-control" ' + (placeholder ? 'placeholder="' + placeholder + '"': '') + '>',
	right_title ? '<span class="input-group-addon">' + right_title + '</span>' : ''].join('\n');

	var after = '</div>\n';
	return this._append(before, after);
};

Node.prototype.navbar = function() {
	var before = ['<nav class="navbar navbar-default">',
	'<div class="container-fluid">',
	'<ul class="nav navbar-nav">'].join('\n');
	var after = '</ul></div></nav>\n';
	return this._append(before, after);
};

Node.prototype.nav = function(text) {
	var before = '<li><a href="#">' + (text || '');
	var after = '</a></li>';
	return this._append(before, after);
};

Node.prototype.tabs = function() {
	var before = '<ul class="nav nav-tabs">\n';
	var after = '</ul>\n'
	var node = this._append(before, after);

	var args = slice.call(arguments);
	var last = args.length-1;
	var cb = args[last];
	if (typeof cb === 'function') {
		args.splice(last);
	} else {
		cb = null;
	}
	args.forEach(function(tabname){
		var before = '<li onclick="void(0)" role="presentation"><a href="#">' + (tabname || '');
		var after = '</a></li>\n'
		var child = new Node(before, after);
		node._add(child);
	});
	if (cb) {
		cb.apply(node, node.children);
	}
	return node;
};

Node.prototype.stack = function() {
	this.before = this.before.replace('class="nav ', 'class="nav nav-stacked');
	return this;
};

Node.prototype.href = function(href) {
	href = href || '#';
	if (this.before.indexOf('href="#"') !== -1) {
		this.before = this.before.replace('href="#"', 'href="' + href + '"');
	} else {
		this.before += '<a href="' + href + '">';
		this.after = '</a>' + this.after;
	}
	return this;
};

Node.prototype._addClass = function(cls) {
	if (this.before.indexOf('class=') !== -1) {
		this.before = this.before.replace('class="', 'class="' + cls + ' ');
	} else {
		var m = this.before.match(/<\w+ /);
		var s;
		if (m) {
			s = m[0].length;
		} else {
			m = this.before.match(/<\w+/);
			if (m) {
				s = m[0].length;
			}
		}
		if (s) {
			this.before = this.before.slice(0, s) + ' class="' + cls + '" ' + this.before.slice(s);
		}
	}
};

Node.prototype.active = function(a) {
	this._addClass('active');
};

Node.prototype.form = function(url) {
	this.before = '<form '
};

Node.prototype.panel = function(title, body) {
	var before = [
	'<div class="panel panel-default">',
	'<div class="panel-heading">',
	'<h3 class="panel-title">' + (title || '') + '</h3>',
	'</div>',
	'<div class="panel-body">',
	body || '',
	'</div>'
	].join('\n');
	var after = '</div>';
	this._append(before, after);
};

Node.prototype.click = function(cb) {
	this.before = this.before.replace('onclick="void(0)"', 'onclick="(' + cb.toString() + ')()"');
};

Node.prototype.warning = function(text, style) {
	style = style || 'danger';
	var before = '<div class="alert alert-' + style + '" role="alert">' + (text || '');
	return this._append(before, '</div>');
};

Node.prototype.id = function(id) {
	var m = this.before.match(/[ >]/);
	if (m) {
		this.before = this.before.slice(0, m.index + 1) + 'id="' + id + '"' + this.before.slice(m.index + 1);
	}
	return this;
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
