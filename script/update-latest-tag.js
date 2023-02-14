const fs = require("fs")
const proc = require("child_process")

module.exports = async function({ github, context }) {
	const repoTags = execGitCmd("git ls-remote --tags --sort=-v:refname")
		.map(tag => tag.split("/")[2].split(".")) // "refs/tags/v1.0.0" -> ["v1", "0", "0"]
	
	// tagsForMajorVersions = {v1: [v1, 2, 3]} where v1.2.3 is the latest tag for major version v1
	let tagsForMajorVersions = getLatestTagsForMajorVersions(repoTags)
	tagsForMajorVersions = updateMinorVersions(
		majorVersionsWithUpdates(context), tagsForMajorVersions)
	tagsForMajorVersions = setPatchVersion(tagsForMajorVersions)
	
	buildTags(tagsForMajorVersions)
		.forEach(tag => createTag(github, context, tag))
}

function execGitCmd(gitCmd) {
	try {
		return proc
			.execSync(gitCmd)
			.toString()
			.split("\n")
			.filter(line => line !== "")
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
	
	// sort by path length, the shortest first (ascending order)
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

function majorVersionsWithUpdates(context) {
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

function updateMinorVersions(majorVersionsUpdated, tagsForMajorVersions) {
	for (const majorVersion of majorVersionsUpdated) {
		let latestTag = tagsForMajorVersions.get(majorVersion)
		let minorVersion = 0
		let patchVersion = "0"
		
		if (latestTag) {
			minorVersion = parseInt(latestTag[1]) + 1
			patchVersion = latestTag[2]
		}
		
		tagsForMajorVersions.set(majorVersion, [majorVersion, minorVersion.toString(), patchVersion])
	}
	
	return tagsForMajorVersions
}

function getVersionFromFile(filePath, regex, delimiter, indexAfterSplit) {
	try {
		return fs
			.readFileSync(filePath, "utf8")
			.match(regex)[0]
			.split(delimiter)[indexAfterSplit]
	} catch (error) {
		return ""
	}
}

function getPlatformClientGoVersion() {
	const goModRegex = "github.com/kouzoh/platform-client-go v\\d+\\.\\d+\.\\d+"
	const goModVersion = getVersionFromFile(
		"go.mod",
		goModRegex,
		" ",
		1,
	)
	
	if (!goModVersion) {
		throw new Error(
			"No version for Go platform client found in go.mod\n" +
			"Looked for pattern: " + goModRegex + "\n" +
			"Hint: The github.com/kouzoh/platform-client-go dependency is" +
			" expected to be declared in the go.mod file. The semver version" +
			" (i.e. v1.2.3) is used to create a release tag. The" +
			" GrpcClientsGenerator updates the Go platform-client based on" +
			" the PHP platform-client in mercari-api's composer.json" +
			" dependencies\n\n" +
			"Skipping tag creation"
		)
	}
	
	console.log("go.mod platform-client-go version: " + goModVersion)
	return goModVersion
}

function setPatchVersion(tags) {
	const platformClientGoVersion = getPlatformClientGoVersion()
	const pcgParts = platformClientGoVersion.split(".")
	const pcgPatchVersion = pcgParts[2]
	
	let tagPatchVersion = pcgParts[1]
	if (pcgPatchVersion && pcgPatchVersion !== "0") {
		tagPatchVersion += "-" + pcgPatchVersion
	}
	
	for (const [majorVersion, tag] of tags) {
		tags.set(majorVersion, [tag[0], tag[1], tagPatchVersion])
	}
	
	return tags
}

function buildTags(tags) {
	const builtTags = []
	for (const tagParts of tags.values()) {
		const t = tagParts.join(".")
		console.log("built tag: " + t)
		builtTags.push(t)
	}
	return builtTags
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
