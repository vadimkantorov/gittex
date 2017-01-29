git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number'])
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', [])

function gittex_eval(command)
{
	var ret = git_libgit2_init();
	console.log(ret);
	var repo = Module._malloc(4);
	Module.setValue(repo, 0, 'i32')
	var ret = git_clone(repo, 'git://github.com/vadimkantorov/gittex.git', 'gittex', 0);
	Module._free(repo);
	console.log(ret);
	return "Command was: " + command;
}
