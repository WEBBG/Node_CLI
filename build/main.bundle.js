'use strict';

var _chalk = require('chalk');

var _chalk2 = _interopRequireDefault(_chalk);

var _clear = require('clear');

var _clear2 = _interopRequireDefault(_clear);

var _clui = require('clui');

var _clui2 = _interopRequireDefault(_clui);

var _figlet = require('figlet');

var _figlet2 = _interopRequireDefault(_figlet);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _https = require('https');

var _https2 = _interopRequireDefault(_https);

var _htmlparser = require('htmlparser2');

var _htmlparser2 = _interopRequireDefault(_htmlparser);

var _jsdom = require('jsdom');

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Spinner = _clui2.default.Spinner;
var status = void 0;
var file = './tmp/metadata.json';

(0, _clear2.default)();
console.log(_chalk2.default.green(_figlet2.default.textSync('node   CLI', { horizontalLayout: 'full' })));

function getUrl(callback) {
	var questions = [{
		name: 'url',
		type: 'input',
		message: 'Enter a valid website URL:',
		validate: function validate(value) {
			if (value.length) {
				var urlPrefix = value.match(/.*?:\/\//g);

				if (urlPrefix != 'https://' && urlPrefix != 'http://') {
					return _chalk2.default.red('URL no Valid. The url should contain http: // or https://');
				}
				status = new Spinner('Searching Website, please wait...');
				status.start();

				return true;
			} else {
				return 'Please enter a URL';
			}
		}
	}];

	_inquirer2.default.prompt(questions).then(callback);
}

getUrl(function () {
	if (arguments[0].url) {
		var url = arguments[0].url;
		var urlPrefix = url.match(/.*?:\/\//g);

		if (urlPrefix == 'https://') {
			_https2.default.get(url, function (response) {
				parseResponse(response);
			}).on('error', function (e) {
				console.log(_chalk2.default.red('URL no Valid ' + e));
				status.stop();
			});
		} else if (urlPrefix == 'http://') {
			_http2.default.get(url, function (response) {
				parseResponse(response);
			}).on('error', function (e) {
				console.log(_chalk2.default.red('URL no Valid ' + e));
				status.stop();
			});
		} else {
			return _chalk2.default.red('URL no Valid');
		}
	}
});

var parseResponse = function parseResponse(response) {
	var data = '';
	response.on('data', function (chunk) {
		data += chunk;
	});

	var tags = [];
	var attrs = [];
	var tagsCount = {};
	var tagsWithCount = [];
	response.on('end', function (chunk) {
		var parsedData = new _htmlparser2.default.Parser({
			onopentag: function onopentag(name, attribs) {
				if (!tags.includes(name)) {
					tags.push(name);
					attrs.push(attribs);
					tagsCount[name] = 1;
				} else {
					tagsCount[name]++;
				}
			},
			onend: function onend() {
				for (var i = 1; i < tags.length; i++) {
					var dom = new _jsdom.JSDOM(data);
					if (tags[i] != 'iframe') {
						var temp = dom.window.document.querySelector(tags[i]),
						    numChilds = temp.getElementsByTagName('*').length;
					}

					tagsWithCount.push({ name: tags[i], count: tagsCount[tags[i]], attributes: attrs[i], numAttribs: _lodash2.default.size(attrs[i]), numChilds: numChilds });
				}
			}
		}, { decodeEntities: true });

		parsedData.write(data);
		parsedData.end();
		status.stop();

		_jsonfile2.default.writeFile(file, tagsWithCount, { spaces: 2 }, function (err) {
			if (err) {
				console.error(_chalk2.default.red(err));
			} else {
				console.log(_chalk2.default.green('Please open metadata.json file in tmp folder.'));
			}
		});
		//console.log(tagsWithCount);
	});
};
