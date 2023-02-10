// import { execSync } from 'child_process';  // replace ^ if using ES modules

module.exports = ({github, context}) => {
	console.log("hello from js script")
	console.log(process.env)
	console.log("GITHUB_ENV", process.env.GITHUB_ENV)
	console.log("PCGV", process.env.PLATFORM_CLIENT_GO_VERSION)
	
	const execSync = require('child_process').execSync;
	const output = execSync(`cat ${process.env.GITHUB_ENV}`, { encoding: 'utf-8' });
	console.log('Output was:\n', output);
}
