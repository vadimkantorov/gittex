// TODO: Free the mallocs!
NULL = 0;
GIT_ENOTFOUND = -3;
git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number']);
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', []);
git_transport_register = Module.cwrap('git_transport_register', 'number', ['string', 'number', 'number']);
git_revparse_single = Module.cwrap('git_revparse_single', 'number', ['number', 'number', 'number']);
git_object_id = Module.cwrap('git_object_id', 'number', ['number']);
git_oid_cpy = Module.cwrap('git_oid_cpy', null, ['number', 'number']);
giterr_clear = Module.cwrap('giterr_clear', null, []);
git_repository_odb__weakptr = Module.cwrap('git_repository_odb__weakptr', 'number', ['number', 'number']);
git_odb_write_pack = Module.cwrap('git_odb_write_pack', 'number', ['number', 'number', 'number', 'number']);

var github_git_transport = {
	ls			: Runtime.addFunction(function(out, size, transport)
	{
		console.log('transport.ls');
		if (!github_git_transport.have_refs) {
			console.log('transport.ls', "the transport has not yet loaded the refs");
			return -1;
		}
		Module.setValue(out, github_git_transport.struct_pack_i32(github_git_transport.refs), 'i32');
		Module.setValue(size, github_git_transport.refs.length, 'i32');
		return 0; 
	}),
	negotiate_fetch		: Runtime.addFunction(function(transport, repo, refs, count)
	{
		console.log('transport.negotiate_fetch');
		var git_object = Module._malloc(4);
		for(var i = 0; i < github_git_transport.refs.length; i++)
		{
			var error = git_revparse_single(git_object, repo, github_git_transport.refs[i] + 4 + 20 + 20)); // refs[i].name
			if (!error)
				git_oid_cpy(github_git_transport.refs[i] + 4 + 20, git_object_id(git_object)); // refs[i].loid
			else if (error != GIT_ENOTFOUND)
				return error;
			else
				giterr_clear();
		}
			
		return 0;
	}),
	download_pack		: Runtime.addFunction(function(transport, repo, stats, progress_cb, progress_payload)
	{
		console.log('transport.download_pack');
		var pack = Module._malloc(4), writepack = Module._malloc(4), odb = Module._malloc(4);
		
		git_repository_odb__weakptr(odb, repo);
		git_odb_write_pack(writepack, odb, NULL, NULL);
		git_packbuilder_new(pack, repo);
		
		/*
		https://github.com/libgit2/libgit2/blob/master/src/transports/smart_protocol.c#L538
		https://github.com/libgit2/libgit2/blob/master/src/transports/local.c#L527
				
		foreach p:
			writepack->append(writepack, p->data, p->len, stats);
			
		writepack->commit(writepack, stats);
		writepack->free(writepack);
		*/
		return 0;
	}),
	connect			: Runtime.addFunction(function(transport, url, cred_acquire_cb, cred_acquire_payload, proxy_opts, direction, flags)
	{
		console.log('transport.connect');
		github_git_transport.connected = 1;
		github_git_transport.flags = flags;
		github_git_transport.direction = direction;
		github_git_transport.url = Module.UTF8ToString(url);
		console.log('transport.connect', github_git_transport.url);
		
		// https://api.github.com/repos/vadimkantorov/gittex/git/refs/heads
		var heads = [
		{
		    "ref": "refs/heads/master",
		    "url": "https://api.github.com/repos/vadimkantorov/gittex/git/refs/heads/master",
		    "object": {
		      "sha": "822cbba0fe905e49c0cc1e0cd6bbb7f921d34bbc",
		      "type": "commit",
		      "url": "https://api.github.com/repos/vadimkantorov/gittex/git/commits/822cbba0fe905e49c0cc1e0cd6bbb7f921d34bbc"
		    }
		  }
		];
		
		// https://github.com/libgit2/libgit2/blob/master/src/transports/local.c#L95
		for(var i = 0; i < heads.length; i++)
		{
			var name_bytes = Module.lengthBytesUTF8(heads[i].ref);
			var git_remote_head = {
				local : 0,
				oid : [0, 0, 0, 0, 0],
				loid : [0, 0, 0, 0, 0],
				name : Module._malloc(name_bytes),
				symref_target : NULL
			};
			Module.stringToUTF8(heads[i].ref, git_remote_head.name, name_bytes);
			for(var j = 0; j < git_remote_head.oid.length; j++)
				git_remote_head.oid[j] = parseInt(heads[i].object.sha.substring(j * 8, (j + 1) * 8), 16);
			github_git_transport.refs.append(struct_pack_i32([git_remote_head.local].concat(git_remote_head.oid).concat(git_remote_head.loid).concat([git_remote_head.name, git_remote_head.symref_target])));
		}
		github_git_transport.have_refs = 1;
		return 0; 
	}),
	read_flags		: Runtime.addFunction(function(transport, flags) { console.log('transport.read_flags'); Module.setValue(flags, github_git_transport.flags, 'i32'); return 0; }),
	is_connected		: Runtime.addFunction(function(transport) { console.log('transport.is_connected'); return github_git_transport.connected; }),
	push			: Runtime.addFunction(function(transport, push, callbacks) { console.log('transport.push', 'nop'); return 1; }),
	set_callbacks		: Runtime.addFunction(function(transport, progress_cb, error_cb, certificate_check_cb, payload) { console.log('transport.set_callbacks', 'nop'); return 0; }),
	set_custom_headers	: Runtime.addFunction(function(transport, custom_headers) { console.log('transport.set_custom_headers', 'nop'); return 0; }), // convert custom_headers from git_strarray* to UTF16
	cancel			: Runtime.addFunction(function(transport) { console.log('transport.cancel', 'nop'); return 0; }),
	close			: Runtime.addFunction(function(transport) { console.log('transport.close'); github_git_transport.connected = 0; return 0; }),
	free			: Runtime.addFunction(function(transport) { console.log('transport.free'); github_git_transport.close(transport); }),
	version :		: 1,
	connected		: 0,
	
	flags			: 0,
	direction		: 0,
	refs			: [],
	have_refs		: 0,
	struct_pack_i32 	: function(array)
	{
		var unsafe_memory = Module._malloc(Runtime.getNativeFieldSize('i32') * array.length);
		for(var i = 0; i < array.length; i++)
			Module.setValue(unsafe_memory + i * Runtime.getNativeFieldSize('i32'), array[i], 'i32');
		return unsafe_memory;
	},
    	git_transport_cb	:  Runtime.addFunction(function(out, owner, param)
	{
		console.log('git_transport_cb');
		Module.setValue(out, github_git_transport.struct_pack_i32([github_git_transport.version, github_git_transport.set_callbacks, github_git_transport.set_custom_headers, github_git_transport.connect, github_git_transport.ls, github_git_transport.push, github_git_transport.negotiate_fetch, github_git_transport.download_pack, github_git_transport.is_connected, github_git_transport.read_flags, github_git_transport.cancel, github_git_transport.close, github_git_transport.free]), 'i32');
	})
};

Module['_main'] = function()
{
	console.log('init: ', git_libgit2_init());
	console.log('register: ', git_transport_register('github', github_git_transport.git_transport_cb), NULL));
	console.log('clone:', git_clone(Module._malloc(4), 'github://github.com/vadimkantorov/gittex.git', 'gittex', 0));
}

function gittex_eval(command)
{
	return "Command was: " + command;
}
