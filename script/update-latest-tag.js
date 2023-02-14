const fs = require('fs')

// format = "v{major}.{minor}.{patch}"
// major = "src/Grpc/Services/Mercari/Platform/Apius' versions
// minor = "increment from last tag"
// patch = "platform-proto minor version"
// if platform-proto has a patch version, add -{patch} to end of tag
module.exports = async function ({github, context}) {
	const allTags = execGitCmd('git tag --list --sort=-v:refname')
		.map(tag => tag.split('.'))
	if (allTags.length === 0) {
		allTags.push([['v0', '0', '0']])
	}
	
	let latestTags = getLatestTagsForMajorVersions(allTags)
	latestTags = updateMinorVersion(latestTags, getMajorVersionWithUpdates(context))
	latestTags = setPatchVersion(latestTags)
	
	for (const tag of buildTags(latestTags)) {
		createTag(github, context, tag)
	}
}

function execGitCmd(gitCmd) {
	try {
		return require('child_process')
			.execSync(gitCmd)
			.toString()
			.split('\n')
			.filter(line => line !== '')
	} catch (error) {
		return []
	}
}

function diffFileNames(before, sha) {
	execGitCmd(`git fetch origin ${before} --depth=1`)
	const output = execGitCmd(`git diff --name-only ${before} ${sha}`)
	if (output.length === 0) {
		console.log('No file changes detected')
		return []
	}
	
	return output[0]
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

function getMajorVersionWithUpdates(context) {
	const majorsUpdated = new Set()
	const grpcServicesPath = 'src/Grpc/Services/Mercari/Platform/Apius'
	const diffFiles = diffFileNames(context.payload.before, context.sha)
	let updateAll = false
	
	for (const filePath of diffFiles) {
		const pathParts = filePath.split('/')
		
		if (pathParts.length === 6 && filePath === grpcServicesPath) {
			updateAll = true
		} else if (updateAll || pathParts[6].includes(grpcServicesPath)) {
			majorsUpdated.add(pathParts[6].toLowerCase())
		}
	}
	
	return majorsUpdated
}

function updateMinorVersion(latestTagsForMajorVersion, majorVersionsUpdated) {
	for (const majorVersion of majorVersionsUpdated) {
		const latestTag = latestTagsForMajorVersion.get(majorVersion)
		const incrementedMinorVersion = parseInt(latestTag[1]) + 1
		latestTagsForMajorVersion.set(
			majorVersion,
			[latestTag[0], incrementedMinorVersion.toString(), latestTag[2]]
		)
	}

	return latestTagsForMajorVersion
}

function setPatchVersion(tags) {
	const platformClientVersion = getGoModVer()
	const pcVersionParts = platformClientVersion.split('.')
	const pcMinorVersion = pcVersionParts[1]
	const pcPatchVersion = pcVersionParts[2]
	
	let patch = pcMinorVersion
	if (pcPatchVersion) {
		patch += '-' + pcPatchVersion
	}
	
	for (const [majorVersion, tag] of tags) {
		tags.set(majorVersion, [tag[0], tag[1], patch])
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

function getGoModVer() {
	const goModRegex = 'github.com/kouzoh/platform-client-go v\\d+\\.\\d+\.\\d+'
	const goModVersion = getVersionFromFile(
		'go.mod',
		goModRegex,
		' ',
		1)
	
	if (!goModVersion) {
		throw new Error(
			'No version for Go platform client found in clients.go\n' +
			'Looked for pattern: ' + goModRegex + '\n' +
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

function getClientsGoVer() {
	const clientsGoVersion = getVersionFromFile(
		'clients.go',
		'const Version = "v\\d+\\.\\d+\.\\d+"',
		'"',
		1)
	
	if (!clientsGoVersion) {
		console.warn(
			'No version for Go platform client found in clients.go\n',
			'Looked for pattern: ' + clientsGoVersion + '\n',
			"Hint: The clients.go file should contain the current" +
				" platform-client-go version in the form of 'const Version =" +
				" \"v1.2.3\"'\n\n",
			'Skipping tag creation'
		)
		return ""
	}
	
	console.log('clients.go platform-client-go version: ' + clientsGoVersion)
	return clientsGoVersion
}

// function getPlatformClientVersion() {
// 	const goModVersion = getGoModVer()
// 	const clientsGoVersion = getClientsGoVer()
//
// 	if (goModVersion !== clientsGoVersion) {
// 		console.warn(
// 			'Version mismatch between go.mod and clients.go\n' +
// 			`go.mod: ${goModVersion}\n` +
// 			`clients.go: ${clientsGoVersion}\n` +
// 			"Hint: Run 'make grpc/regen-clients' to sync the" +
// 				" platform-client-go versions between go.mod and" +
// 			" clients.go\n\n" +
// 			'Skipping tag creation'
// 		)
// 	}
//
// 	return goModVersion
// }

function createTag(github, tag) {
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${tag}`,
				sha: sha
			})
		.then(() => console.log("Created Tag: " + tag))
		.catch((error) => {
			if (error.message === 'Reference already exists') {
				console.warn(`Tag ${tag} already exists`)
			} else {
				console.error(`Error creating tag ${tag}`, error)
			}
			
			console.log("\nSkipping tag creation")
		})
}