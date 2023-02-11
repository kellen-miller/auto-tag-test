const fs = require('fs')

module.exports = async function ({github, context}) {
	const fs = require('fs')
	
	const response = await github.rest.repos.listTags(
		{
			owner: context.repo.owner,
			repo: context.repo.repo,
			pattern: 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
		}
	)
	
	const file = fs.readFileSync('clients.go', 'utf8')
	const version = file.match(/v\d+\.\d+\.\d+/)
	
	response.data.forEach(tag => {
		if (tag.name === version) {
			console.log('Tag ' + tag.name + ' already exists')
			return
		}
	})
	
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${version}`,
				sha: context.sha
			})
		.then(() => console.log("Tag " + version + " created"))
		.catch((error) => console.log(error))
}