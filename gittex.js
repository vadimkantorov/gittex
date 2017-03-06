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
git_odb_write = Module.cwrap('git_odb_write', 'number', ['number', 'number', 'number', 'number', 'number']);
git_object_free = Module.cwrap('git_object_free', null, ['number']);
git_oid_fromstr = Module.cwrap('git_oid_fromstr', 'number', ['number', 'string']);
git_oid_tostr_s = Module.cwrap('git_oid_tostr_s', 'string', ['number']);
git_otype = {GIT_OBJ_ANY : -2, GIT_OBJ_COMMIT : 1, GIT_OBJ_TREE : 2, GIT_OBJ_BLOB : 3, GIT_OBJ_TAG : 4};
git_oid = function() { return [0, 0, 0, 0, 0]; };

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
		for(var i = 0; i < github_git_transport.refs.length; i++)
		{
			var git_object = Module._malloc(4);
			var error = git_revparse_single(git_object, repo, github_git_transport.refs[i] + 4 + 20 + 20)); // refs[i].name
			if (!error)
				git_oid_cpy(github_git_transport.refs[i] + 4 + 20, git_object_id(git_object)); // refs[i].loid
			else if (error != GIT_ENOTFOUND)
				return error;
			else
				giterr_clear();
			
			git_object_free(git_object);
			Module._free(git_object);
		}
			
		return 0;
	}),
	download_pack		: Runtime.addFunction(function(transport, repo, stats, progress_cb, progress_payload)
	{
		console.log('transport.download_pack');
		var odb = Module._malloc(4), oid = github_api_transport.struct_pack_i32(git_oid());
		git_repository_odb__weakptr(odb, repo);
		github_git_transport.github_revwalk(github_git_transport.url.replace('github://', ''), function(object_type, object_id, object_array) {
			var data = Module._malloc(object_array.length);
			Module.writeArrayToMemory(object_array, data);
			git_odb_write(oid, odb, data, data.length, object_type == "commit" ? git_otype.GIT_OBJ_COMMIT : object_type == "tree" ? git_otype.GIT_OBJ_TREE : object_type == "blob" ? git_otype.GIT_OBJ_BLOB : object_type == "tag" ? git_otype.GIT_OBJ_TAG : git_otype.GIT_OBJ_ANY);
			Module._free(data);
			console.log(git_oid_tostr_s(oid) == object_id ? 'OK' : 'FAIL', object_type, object_id);
		});
		
		Module._free(odb);
		Module._free(oid);
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
		
		var heads = github_git_transport.github_git_data(github_git_transport.url, 'refs', 'heads');
		// https://github.com/libgit2/libgit2/blob/master/src/transports/local.c#L95
		for(var i = 0; i < heads.length; i++)
		{
			var name_bytes = Module.lengthBytesUTF8(heads[i].ref);
			var git_remote_head = {
				local : 0,
				oid : git_oid(),
				loid : git_oid(),
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
	}),
	github_git_data : function(github_repo_url, object_type, object_id)
	{
		var result = null;
		$.get('https://api.' + github_repo_url.replace('github.com', 'github.com/repos') + '/git/' + object_type + 's/' + object_id, {async : false}).done(function(data) {result = data;});
		return result;
	},
	github_revwalk : function(github_repo_url, callback)
	{
		function utf16_to_utf8(str)
		{
			return unescape(encodeURIComponent(str));
		}
		
		function to_array(str)
		{
			return new Uint8Array($.map(str.split(''), function(c){ return c.charCodeAt(); }));
		}
		
		function format_person(person)
		{
		}
		
		// https://github.com/creationix/js-github/blob/master/mixins/github-db.js
		// https://github.com/creationix/js-git/blob/master/lib/object-codec.js#L52
		// https://github.com/creationix/bodec/blob/master/bodec-browser.js#L145
		// http://stackoverflow.com/questions/14790681/what-is-the-internal-format-of-a-git-tree-object
		var object_stack = $.map(github_git_transport.github_git_data(github_repo_url, 'ref', 'heads').concat(github_git_transport.github_git_data(github_repo_url, 'ref', 'tags')), function(ref) { return {type : ref.object.type, id : ref.object.sha}; });
		var visited = {};
		while(object_stack.length > 0)
		{
			var object = object_stack.pop();
			if(visited[object.id])
				continue;
			visited[object.id] = true;
			var data = github_git_data(github_repo_url, object.type, object.id);
			var body_array = null;
			switch(object.type)
			{
				case "commit":
					object_stack.push({type : "tree", id : data.tree.sha});
					object_stack = object_stack.concat($.map(data.parents, function(commit) { return {type : "commit", id : commit.sha}; }));
					body_array = to_array(utf16_to_utf8("tree " + data.tree + $.map(data.parents, function(commit) { return "\nparent " + commit.sha); }).join("") + "\nauthor " + format_person(data.author) + "\ncommitter " + format_person(data.committer) + "\n\n" + data.message));
					break;
				case "tag":
					object_stack.push({type : data.object.type, id : data.object.sha});
					body_array = to_array(utf16_to_utf8("object " + data.object + "\ntype " + data.type + "\ntag " + data.tag + "\ntagger " + format_person(data.tagger) + "\n\n" + data.message)));
					break;
				case "tree":
					object_stack = object_stack.concat($.map(data.tree, function(tree_item) { return {type : tree_item.type, id : tree_item.sha}; }));
					var decode_hex = function() {};
					body_array = $.map(data.tree, function(tree_item) { return tree_item.mode + " " + utf16_to_utf8(tree_item.name) + "\0" + decode_hex(tree_item.sha) }).join("");
					break;
				case "blob":
					body_array = to_array(utf16_to_utf8(data.encoding == "base64" ? atob(data.contents) : data.encoding == "utf-8" ? decodeURIComponent(data.contents) : data.contents));
					break;
			}
			var header_array = to_array(object.type + " " + body_array.length + "\0");
			var object_array = new Uint8Array(header_array.length + body_array.length);
			object_array.set(header_array);
			object_array.set(body_array, header_array.length);
			callback(object.type, object.id, object_array);
		}
	}
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
