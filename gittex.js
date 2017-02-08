NULL = 0;

git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number']);
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', []);
git_transport_register = Module.cwrap('git_transport_register', 'number', ['string', 'number', 'number']);

//git_clone = libgit2.git_clone;
//git_libgit2_init = libgit2.git_libgit2_init;
//git_transport_register = libgit2.git_transport_register;

function make_emscripten_integer_array(array)
{
	var unsafe_memory = Module._malloc(Runtime.getNativeFieldSize('i32') * array.length);
	//Module.HEAP32.set(array, unsafe_memory);
	for(var i = 0; i < array.length; i++)
		Module.setValue(unsafe_memory + i * Runtime.getNativeFieldSize('i32'), array[i], 'i32');
	return unsafe_memory;
}

function github_api_transport_cb(out, owner, param) //git_transport_cb
{
	var transport = {
		ls : function(out, size, _transport) { console.log('transport.ls', 'nop'); return 0; },
		negotiate_fetch : function(_transport, repo, refs, count) { console.log('transport.negotiate_fetch', 'nop'); return 0;  },
		download_pack : function(_transport, repo, stats, progress_cb, progress_payload) { console.log('transport.download_pack', 'nop'); return 0; },
		
		connect : function(_transport, url, cred_acquire_cb, cred_acquire_payload, proxy_opts, direction, flags) { console.log('transport.connect', 'nop'); transport.connected = 1; transport.flags = flags; transport.url = Module.UTF8ToString(url); return 0; },
		read_flags : function(_transport, flags) { console.log('transport.read_flags'); flags = transport.flags; return 0; }, // write to int* flags the value
		is_connected : function(_transport) { console.log('transport.is_connected'); return transport.connected; },
		push : function(_transport, push, callbacks) { console.log('transport.push', 'nop'); return 1; },
		set_callbacks : function(_transport, progress_cb, error_cb, certificate_check_cb, payload) { console.log('transport.set_callbacks', 'nop'); return 0; },
		set_custom_headers : function(_transport, custom_headers) { console.log('transport.set_custom_headers', 'nop'); return 0; }, // convert custom_headers from git_strarray* to UTF16
		cancel : function(_transport) { console.log('transport.cancel', 'nop'); return 0; },
		close : function(_transport) { console.log('transport.close'); transport.connected = 0; return 0; },
		free : function(_transport) { console.log('transport.free', 'nop'); }
		
		version : 1,
		connected : 0,
	};
	Module.setValue(out, make_emscripten_integer_array([
		transport.version, 
		Runtime.addFunction(transport.set_callbacks), 
		Runtime.addFunction(transport.set_custom_headers), 
		Runtime.addFunction(transport.connect), 
		Runtime.addFunction(transport.ls), 
		Runtime.addFunction(transport.push), 
		Runtime.addFunction(transport.negotiate_fetch), 
		Runtime.addFunction(transport.download_pack), 
		Runtime.addFunction(transport.is_connected), 
		Runtime.addFunction(transport.read_flags), 
		Runtime.addFunction(transport.cancel), 
		Runtime.addFunction(transport.close), 
		Runtime.addFunction(transport.free)
	]), 'i32');
}

function libgit2_init()
{
	console.log('init: ', git_libgit2_init());
	console.log('register: ', git_transport_register('github://', Runtime.addFunction(github_api_transport_cb), NULL));
}

function gittex_eval(command)
{
	//var repo = Module._malloc(4);
	//Module.setValue(repo, 0, 'i32')
	//console.log('clone:', git_clone(repo, 'github://github.com/vadimkantorov/gittex.git', 'gittex', 0));
	//Module._free(repo);
	return "Command was: " + command;
}

libgit2_init();
