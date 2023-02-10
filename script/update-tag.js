const fs = require('fs')

module.exports = async ({github, context}) => {
	const tags = await github.rest.repos.listTags(
		{
			owner: context.repo.owner,
			repo: context.repo.repo,
			pattern: 'v[0-9]\+\.[0-9]\+\.[0-9]\+'
		})
	
	const file = fs.readFileSync('clients.go', 'utf8')
	const version = file.match(/v\d+\.\d+\.\d+/)
	
	for (const tag of tags) {
		console.log(tag.name)
		if (tag.name === version) {
			console.log('Tag ' + tag.name + ' already exists')
			return
		}
	}
	
	console.log("PCGV: " + process.env.PLATFORM_CLIENT_GO_VERSION)
	await github.rest.git.createRef(
		{
			owner: context.repo.owner,
			repo: context.repo.repo,
			ref: `refs/tags/${process.env.PLATFORM_CLIENT_GO_VERSION}`,
			sha: context.sha
		})
}