const script = require('../script/update-latest-tag.js')
const context = {
	sha: 'sha',
	payload: {
		before: 'before'
	}
}

script({  })
	.then( r => console.log("done", r) )