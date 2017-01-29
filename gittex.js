git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number'])

function gittex_eval(command)
{
	var repo = Module._malloc(new Uint32Array(1).BYTES_PER_ELEMENT);
	//Module.HEAPU8.set(myTypedArray, repo);
	var ret = git_clone(repo, 'http://github.com/vadimkantorov/gittex', 'gittex');
	Module._free(repo)
	console.log(ret);
	return "Command was: " + command;
}
