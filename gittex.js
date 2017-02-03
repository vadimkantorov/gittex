git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number'])
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', [])
git_transport_register = Module.cwrap('git_transport_register', 'number', ['string', 'number', 'number'])
NULL = 0;

function github_api_transport_cb(out, owner, param) //git_transport_cb
{
	out = {
		version : 1,
		connected : 1,
		set_custom_headers : function(transport, custom_headers) { },
		connect : function(transport, url, cred_acquire_cb, cred_acquire_payload, proxy_opts, direction, flags) { transport.connected = 1; return 0; },
		ls : function(out, size, transport) { },
		push : function(transport, push, callbacks) { },
		negotiate_fetch : function(transport, repo, refs, count) { },
		download_pack : function(transport, repo, stats, progress_cb, progress_payload) { },
		read_flags : function(transport, flags) { },
		
		set_callbacks : function(transport, progress_cb, error_cb, certificate_check_cb, payload) { console.log('transport.set_callbacks', 'nop'); return 0; },
		is_connected : function(transport) { console.log('transport.is_connected'); return transport.connected; },
		cancel : function(transport) { console.log('transport.cancel', 'nop'); return 0; },
		close : function(transport) { console.log('transport.close'); transport.connected = 0; return 0; },
		free : function(transport) { console.log('transport.free', 'nop'); return 0; }
	}
}

function gittex_eval(command)
{
	console.log('init: ', git_libgit2_init());
	console.log('register: ', git_transport_register('github://', github_api_transport_cb, NULL));
	//var repo = Module._malloc(4);
	//Module.setValue(repo, 0, 'i32')
	//console.log('clone:', git_clone(repo, 'github://github.com/vadimkantorov/gittex.git', 'gittex', 0));
	//Module._free(repo);
	return "Command was: " + command;
}
