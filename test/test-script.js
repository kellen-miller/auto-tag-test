const script = require('../script/update-latest-tag.js')

const github = {}
const context = {
	sha: 'sha',
	payload: {
		before: 'before'
	}
}

script({ github, context })
	.then( r => console.log("done", r) )