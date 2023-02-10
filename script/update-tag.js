module.exports = ({github, context}) => {
	console.log("hello from js script")
	console.log(process.env)
	console.log(process.env.PLATFORM_CLIENT_GO_VERSION)
	
	// const execSync = require('child_process').execSync;
	// // import { execSync } from 'child_process';  // replace ^ if using ES modules
	//
	// const output = execSync('ls', { encoding: 'utf-8' });  // the default is 'buffer'
	// console.log('Output was:\n', output);
}
