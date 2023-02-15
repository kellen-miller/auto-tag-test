module.exports = async function ({github, context}) {
	const repoTags = require("child_process")
		.execSync("git ls-remote --tags --sort=-v:refname")
		.toString()
		.split("\n")
		.filter(line => line !== "")
		.map(tag => tag.split("/")[2]) // "sha123 refs/tags/v1.0.0" -> "v1.0.0"
	
	if (repoTags.length === 0) {
		repoTags.push("v1.0.0")
		// throw new Error("No tags found")
	}
	
	const newTag = repoTags[0]
		.split(".")
		.map((tagPart, index) => {
			return index === 1
				? parseInt(tagPart) + 1  // increment the minor version
				: tagPart
		})
		.join(".")
	
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${newTag}`,
				sha: context.sha
			})
		.then(() => console.log("Created Tag: " + newTag))
		.catch(error => {
			if (error.message === 'Reference already exists') {
				console.log("Tag already exists")
			} else {
				console.error("Error creating tag", error)
			}
			console.log("\nSkipping tag creation")
		})
}
