const fs = require('fs')

// format = "v{major}.{minor}.{patch}"
// major = "src/Grpc/Services/Mercari/Platform/Apius' major version
// minor = "increment from last tag"
// patch = "platform-proto minor version"
// if platform-proto has a patch version, add -{patch} to end of tag
module.exports = async function ({github, context}) {
	console.log("changedFiles", getChangedFiles(""))
	
	const goModVersion = getGoModVer()
	if (!goModVersion) {
		return
	}
	
	const clientsGoVersion = getClientsGoVer()
	if (goModVersion !== clientsGoVersion) {
		console.error(
			'Version mismatch between go.mod and clients.go\n',
			'go.mod: ' + goModVersion + '\n',
			'clients.go: ' + clientsGoVersion + '\n',
			"Hint: Run 'make grpc/regen-clients' to sync the " +
				"platform-client-go versions between go.mod and clients.go\n\n",
			'Skipping tag creation'
		)
		return
	}
	
	const tags = getRepoTags()
	for (const tag of tags) {
		if (goModVersion === tag.name) {
			console.log(
				'Tag ' + goModVersion + ' already exists on repo\n',
				`Hint: Existing tags = [${tags.join(", ")}]\n\n`,
				'Skipping tag creation'
			)
			return
		}
	}
	
	github.rest.git.createRef(
			{
				owner: context.repo.owner,
				repo: context.repo.repo,
				ref: `refs/tags/${goModVersion}`,
				sha: context.sha
			})
		.then(() => console.log("Created Tag: " + goModVersion))
		.catch((error) => {
			if (error.message === 'Reference already exists') {
				console.warn(`Tag ${goModVersion} already exists`)
			} else {
				console.error(`Error creating tag ${goModVersion}`, error)
			}
			
			console.log("\nSkipping tag creation")
		})
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
		console.log(
			'No version for Go platform client found in clients.go\n',
			'Looked for pattern: ' + goModRegex + '\n',
			"Hint: The github.com/kouzoh/platform-client-go dependency is" +
				" expected to be declared in the go.mod file. The semver" +
				" version (i.e. v1.2.3) is used to create a release tag." +
				" The GrpcClientsGenerator updates the Go platform-client based on" +
				" the PHP platform-client in mercari-api's composer.json" +
				" dependencies\n\n",
			'Skipping tag creation'
		)
		return ""
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
			"Hint: The clients.go file should contain the current platform-client-go" +
				" version in the form of 'const Version = \"v1.2.3\"'\n\n",
			'Skipping tag creation'
		)
		return ""
	}
	
	console.log('clients.go platform-client-go version: ' + clientsGoVersion)
	return clientsGoVersion
}

function getRepoTags() {
	// '-v:refname' => sort by version, prefix reverses order (i.e. descending)
	// const gitCmd = 'git for-each-ref --sort=-v:refname --format="%(refname:lstrip=2)" refs/tags'
	const gitCmd = 'git tag -l --sort=-v:refname'
	return require('child_process')
		.execSync(gitCmd)
		.toString()
		.split('\n')
		.filter(tag => tag !== '')
}

function getChangedFiles(branch) {
	const gitCmd = `git diff --name-only origin/main`
	return require('child_process')
		.execSync(gitCmd)
		.toString()
		.split('\n')
		.filter(file => file !== '')
}