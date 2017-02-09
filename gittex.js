NULL = 0;

git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number']);
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', []);
git_transport_register = Module.cwrap('git_transport_register', 'number', ['string', 'number', 'number']);

//git_clone = libgit2.git_clone;
//git_libgit2_init = libgit2.git_libgit2_init;
//git_transport_register = libgit2.git_transport_register;

var github_git_transport = {
	ls			: Runtime.addFunction(function(out, size, transport) { console.log('transport.ls', 'nop'); return 0; }),
	negotiate_fetch		: Runtime.addFunction(function(transport, repo, refs, count) { console.log('transport.negotiate_fetch', 'nop'); return 0;  }),
	download_pack		: Runtime.addFunction(function(transport, repo, stats, progress_cb, progress_payload) { console.log('transport.download_pack', 'nop'); return 0; }),
	connect			: Runtime.addFunction(function(transport, url, cred_acquire_cb, cred_acquire_payload, proxy_opts, direction, flags) { console.log('transport.connect', 'nop'); github_git_transport.connected = 1; github_git_transport.flags = flags; github_git_transport.url = Module.UTF8ToString(url); return 0; }),
	read_flags		: Runtime.addFunction(function(transport, flags) { console.log('transport.read_flags'); flags = github_git_transport.flags; return 0; }), // write to int* flags the value
	is_connected		: Runtime.addFunction(function(transport) { console.log('transport.is_connected'); return github_git_transport.connected; }),
	push			: Runtime.addFunction(function(transport, push, callbacks) { console.log('transport.push', 'nop'); return 1; }),
	set_callbacks		: Runtime.addFunction(function(transport, progress_cb, error_cb, certificate_check_cb, payload) { console.log('transport.set_callbacks', 'nop'); return 0; }),
	set_custom_headers	: Runtime.addFunction(function(transport, custom_headers) { console.log('transport.set_custom_headers', 'nop'); return 0; }), // convert custom_headers from git_strarray* to UTF16
	cancel			: Runtime.addFunction(function(transport) { console.log('transport.cancel', 'nop'); return 0; }),
	close			: Runtime.addFunction(function(transport) { console.log('transport.close'); github_git_transport.connected = 0; return 0; }),
	free			: Runtime.addFunction(function(transport) { console.log('transport.free', 'nop'); }),
	version : 1,
	connected : 0,
};

function git_transport_cb(out, owner, param)
{
	console.log('git_transport_cb');
	var struct_pack_i32 = function(array)
	{
		var unsafe_memory = Module._malloc(Runtime.getNativeFieldSize('i32') * array.length);
		//Module.HEAP32.set(array, unsafe_memory);
		for(var i = 0; i < array.length; i++)
			Module.setValue(unsafe_memory + i * Runtime.getNativeFieldSize('i32'), array[i], 'i32');
		return unsafe_memory;
	};
	Module.setValue(out, struct_pack_i32([github_git_transport.version, github_git_transport.set_callbacks, github_git_transport.set_custom_headers, github_git_transport.connect, github_git_transport.ls, github_git_transport.push, github_git_transport.negotiate_fetch, github_git_transport.download_pack, github_git_transport.is_connected, github_git_transport.read_flags, github_git_transport.cancel, github_git_transport.close, github_git_transport.free]), 'i32');
}

Module['_main'] = function()
{
	console.log('init: ', git_libgit2_init());
	console.log('register: ', git_transport_register('github', Runtime.addFunction(git_transport_cb), NULL));
	console.log('clone:', git_clone(Module._malloc(4), 'github://github.com/vadimkantorov/gittex.git', 'gittex', 0));
}

function gittex_eval(command)
{
	return "Command was: " + command;
}

gittex_test();
