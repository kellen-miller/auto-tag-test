const fs = require('fs')
const proc = require('child_process')

module.exports = async function ({github, context}) {
	const repoTags = execGitCmd('git ls-remote --tags --sort=-v:refname')
		.map(tag => {
			tag.split("/")[2] // refs/tags/v1.2.3 -> v1.2.3
				.split(".")   // v1.2.3 -> [v1, 2, 3]
		})
	console.log("Repo tags: " + JSON.stringify(repoTags))

	let latestTags = getLatestTagsForMajorVersions(repoTags)
	console.log("Latest tags for major: " + JSON.stringify(latestTags))
	const mvu = majorVersionsUpdated(context)
	console.log("Major versions updated: " + JSON.stringify(majorVersionsUpdated))
	latestTags = updateMinorVersions(latestTags, mvu)
	console.log("Latest tags for major after minor update: " + JSON.stringify(latestTags))
	latestTags = setPatchVersion(latestTags)
	console.log("Latest tags for major after patch update: " + JSON.stringify(latestTags))
	buildTags(latestTags).forEach(tag => createTag(github, context, tag))
}

function execGitCmd(gitCmd) {
	try {
		return proc
			.execSync(gitCmd)
			.toString()
			.split('\n')
			.filter(line => line !== '')
	} catch (error) {
		console.error("Error executing git command: " + gitCmd, error)
		return []
	}
}

function diffFileNames(before, sha) {
	execGitCmd(`git fetch origin ${before} --depth=1`)
	const output = execGitCmd(`git diff --name-only ${before} ${sha}`)
	if (output.length === 0) {
		console.log("No file changes detected")
		return []
	}
	
	output.sort((a, b) => {
		const aPathLength = a.split("/").length
		const bPathLength = b.split("/").length
		
		if (aPathLength === bPathLength) {
			return a.localeCompare(b)
		}
		
		return aPathLength - bPathLength
	})
	
	return output
}

function getLatestTagsForMajorVersions(tags) {
	const majorVersionLatestTags = new Map()
	for (const tag of tags) {
		const majorVersion = tag[0]
		// sorted descending order, first tag found for major version = latest
		if (!majorVersionLatestTags.has(majorVersion)) {
			majorVersionLatestTags.set(majorVersion, tag)
		}
	}
	
	return majorVersionLatestTags
}

function majorVersionsUpdated(context) {
	const majorsUpdated = new Set()
	const grpcServicesPath = "src/Grpc/Services/Mercari/Platform/Apius"
	const diffFiles = diffFileNames(context.payload.before, context.sha)
	
	for (const filePath of diffFiles) {
		const pathParts = filePath.split("/")
		if (pathParts.length >= 8 && filePath.includes(grpcServicesPath)) {
			majorsUpdated.add(pathParts[6].toLowerCase())
		}
	}
	
	return majorsUpdated
}

function updateMinorVersions(latestTagsForMajorVersion, majorVersionsUpdated) {
	for (const majorVersion of majorVersionsUpdated) {
		let latestTag = latestTagsForMajorVersion.get(majorVersion)
		let minorVersion = 0
		let patchVersion = "0"
		
		if (latestTag) {
			minorVersion = parseInt(latestTag[1]) + 1
			patchVersion = latestTag[2]
		}
		
		latestTagsForMajorVersion.set(majorVersion,
			[majorVersion, minorVersion.toString(), patchVersion],
		)
	}
	
	return latestTagsForMajorVersion
}

function setPatchVersion(tags) {
	const platformClientGoVersion = getPlatformClientGoVersion()
	const pcgParts = platformClientGoVersion.split('.')
	const pcgMinor = pcgParts[1]
	const pcgPatch = pcgParts[2]
	
	let tagPatchVersion = pcgMinor
	if (pcgPatch && pcgPatch !== '0') {
		tagPatchVersion += '-' + pcgPatch
	}
	
	for (const [majorVersion, tag] of tags) {
		tags.set(majorVersion, [tag[0], tag[1], tagPatchVersion])
	}
	
	return tags
}

function buildTags(tags) {
	const builtTags = []
	for (const tag of tags.values()) {
		builtTags.push(tag.join('.'))
	}
	return builtTags
}

function getVersionFromFile(filePath, regex, delimiter, indexAfterSplit) {
	try {
		return fs
			.readFileSync(filePath, 'utf8')
			.match(regex)[0]
			.split(delimiter)[indexAfterSplit]
	} catch (error) {
		return ""
	}
}

function getPlatformClientGoVersion() {
	const goModRegex = 'github.com/kouzoh/platform-client-go v\\d+\\.\\d+\.\\d+'
	const goModVersion = getVersionFromFile(
		"go.mod",
		goModRegex,
		" ",
		1,
	)
	
	if (!goModVersion) {
		throw new Error(
			"No version for Go platform client found in go.mod\n" +
			"Looked for pattern: " + goModRegex + '\n' +
			"Hint: The github.com/kouzoh/platform-client-go dependency is" +
			" expected to be declared in the go.mod file. The semver version" +
			" (i.e. v1.2.3) is used to create a release tag. The" +
			" GrpcClientsGenerator updates the Go platform-client based on" +
			" the PHP platform-client in mercari-api's composer.json" +
			" dependencies\n\n" +
			'Skipping tag creation'
		)
	}
	
	console.log('go.mod platform-client-go version: ' + goModVersion)
	return goModVersion
}

function createTag(github, context, tag) {
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${tag}`,
				sha: context.sha,
			})
		.then(() => console.log("Created Tag: " + tag))
		.catch((error) => {
			if (error.message === "Reference already exists") {
				console.warn(`Tag ${tag} already exists`)
			} else {
				console.error(`Error creating tag ${tag}`, error)
			}
			
			console.log("\nSkipping tag creation")
		})
}