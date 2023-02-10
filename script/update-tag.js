const fs = require('fs')
const version = process.env.VERSION
const tag = 'v' + version
const tag_exists = await github.rest.git.getRef({
	                                                owner: context.repo.owner,
	                                                repo: context.repo.repo,
	                                                ref: 'tags/' + tag,
                                                }).then(() => true).catch(() => false)
if (tag_exists) {
	console.log('Tag ' + tag + ' already exists')
	return
}
const tag_sha = await github.rest.git.getRef({
	                                             owner: context.repo.owner,
	                                             repo: context.repo.repo,
	                                             ref: 'heads/' + context.ref,
                                             }).then((response) => response.data.object.sha).catch((error) => {
	console.log('Error getting ref ' + context.ref + ': ' + error)
	core.setFailed('Error getting ref ' + context.ref + ': ' + error)
})
const tag_ref = await github.rest.git.createRef({
	                                                owner: context.repo.owner,
	                                                repo: context.repo.repo,
	                                                ref: 'refs/tags/' + tag,
	                                                sha: tag_sha,
                                                }).then((response) => response.data.ref).catch((error) => {
	console.log('Error creating tag ' + tag + ': ' + error)
	core.setFailed('Error creating tag ' + tag + ': ' + error)
})
console.log('Created tag ' + tag_ref)

const tag_ref = process.env.TAG_REF
const tag = tag_ref.replace('refs/tags/', '')