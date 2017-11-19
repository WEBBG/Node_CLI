import chalk from 'chalk';
import clear from 'clear';
import CLI from 'clui';
import figlet from 'figlet';
import inquirer from 'inquirer';
import _ from 'lodash';
import http from 'http';
import https from 'https';
import htmlparser from 'htmlparser2';
import {JSDOM} from 'jsdom';
import jsonfile from 'jsonfile';

const Spinner = CLI.Spinner;
let status;
let file = './tmp/metadata.json';

// clear de console/terminal
clear();
//Add title in CLI
console.log(
	chalk.green(
		figlet.textSync('node   CLI', { horizontalLayout: 'full' })
	)
);

//Get URL introduced  
function getUrl(callback) {

	const questions = [
		{
			name: 'url',
			type: 'input',
			message: 'Enter a valid website URL:',
			//Validate the introduced url
			validate(value) {
				if (value.length) {
					const urlPrefix = value.match(/.*?:\/\//g);

					if (urlPrefix != 'https://' && urlPrefix != 'http://') {
						return chalk.red('The URL is not valid. The url should contain http: // or https://');
					}
					//Display message 
					status = new Spinner('Searching Website, please wait...');
					status.start();
					
					return true;
				} else {
					return 'Please enter a URL';
				}
			}
		}
	];

	inquirer.prompt(questions).then(callback);
}

getUrl(function () {
	if (arguments[0].url) {
		const url = arguments[0].url;
		const urlPrefix = url.match(/.*?:\/\//g);
		
		//Validate HTTP or HTTPS
		if (urlPrefix == 'https://') {
			https.get(url, response => {
				parseResponse(response);
			}).on('error', e => {
				console.log(chalk.red('URL no Valid ' + e));
				status.stop();
			});
		} else if (urlPrefix == 'http://') {
			http.get(url, response => {
				parseResponse(response);
			}).on('error', e => {
				console.log(chalk.red('URL no Valid ' + e));
				status.stop();
			});
		} else {
			return chalk.red('URL no Valid');
		}
	}
});

//Parse the information obtained
var parseResponse = response => {
	let data = '';
	response.on('data', chunk => {
		data += chunk;
	});
	//store information
	const tags = [];
	const attrs = [];
	const tagsCount = {};
	const tagsWithCount = [];
	response.on('end', chunk => {
		//The following code find html tags and respective attributes
		const parsedData = new htmlparser.Parser({
			onopentag(name, attribs) {
				if (!tags.includes(name)) {
					tags.push(name);
					attrs.push(attribs);
					tagsCount[name] = 1;
				} else {
					tagsCount[name]++;
				}
			},
			onend() {
				for (let i = 1; i < tags.length; i++) {
					//Access the DOM Window to count childrens in html tag
					const dom = new JSDOM(data);
					if (tags[i] != 'iframe') {// TODO 
						var temp = dom.window.document.querySelector(tags[i]),
							numChilds = temp.getElementsByTagName('*').length;
					}

					// TODO - Obtain the information the dom tree and information about images or videos...

					tagsWithCount.push({ name: tags[i], count: tagsCount[tags[i]], attributes: attrs[i], numAttribs: _.size(attrs[i]), numChilds: numChilds });
				}
			}
		}, { decodeEntities: true });
	
		parsedData.write(data);
		parsedData.end();
		status.stop();

		//Write information in json file in temp folder
		jsonfile.writeFile(file, tagsWithCount, { spaces: 2 }, function (err) {
			if (err) {
				console.error(chalk.red(err));
			} else {
				console.log(chalk.green('Please open metadata.json file in tmp folder, to see information obtained.'));
			}
		});
		//console.log(tagsWithCount);
	});
};