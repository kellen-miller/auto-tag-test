const script = require('script/update-grpc-tags.js')

const github = {}
const context = {
	sha: "HEAD",
	payload: {
		before: "origin/main",
	},
}

script({ github, context })
	.then( r => console.log("done", r) )