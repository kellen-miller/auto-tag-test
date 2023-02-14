const script = require('../script/update-latest-tag.js')

const github = {}
const context = {
	sha: "HEAD",
	payload: {
		before: "origin/main",
	},
}

script({ github, context })
	.then( r => console.log("done", r) )