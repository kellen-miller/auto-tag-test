const script = require('./update-tag.js')
const github = {}
const context = {
	sha: "HEAD",
	payload: {
		before: "origin/main",
	},
}

script({ github, context })
	.then(result => {
		console.log("PASS", result)
	})
	.catch(error => {
		if (error.message.includes('git')) {
			console.log("PASS: up to github.rest.git.createRef")
		} else {
			console.error("error", error)
		}
	})
