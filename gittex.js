git_clone = Module.cwrap('git_clone', 'number', ['number', 'string', 'string', 'number']);
git_libgit2_init = Module.cwrap('git_libgit2_init', 'number', []);
git_transport_register = Module.cwrap('git_transport_register', 'number', ['string', 'number', 'number']);
git_revparse_single = Module.cwrap('git_revparse_single', 'number', ['number', 'number', 'number']);
git_object_id = Module.cwrap('git_object_id', 'number', ['number']);
git_oid_cpy = Module.cwrap('git_oid_cpy', null, ['number', 'number']);
giterr_clear = Module.cwrap('giterr_clear', null, []);
git_repository_odb__weakptr = Module.cwrap('git_repository_odb__weakptr', 'number', ['number', 'number']);
git_odb_write = Module.cwrap('git_odb_write', 'number', ['number', 'number', 'number', 'number', 'number']);
//git_odb_hash = Module.cwrap('git_odb_hash', 'number', ['number', 'number', 'number', 'number', 'number']);
git_object_free = Module.cwrap('git_object_free', null, ['number']);
git_oid_fromstr = Module.cwrap('git_oid_fromstr', 'number', ['number', 'string']);
git_oid_tostr_s = Module.cwrap('git_oid_tostr_s', 'string', ['number']);
git_otype = {GIT_OBJ_ANY : -2, GIT_OBJ_COMMIT : 1, GIT_OBJ_TREE : 2, GIT_OBJ_BLOB : 3, GIT_OBJ_TAG : 4};
git_error_code = {GIT_ENOTFOUND : -3, GIT_EINVALIDSPEC : -12};
git_filemode_t = {GIT_FILEMODE_COMMIT : "160000"};
git_oid = function() { return [0, 0, 0, 0, 0]; };
NULL = 0;

var github_transport = {
	ls			: function(out, size, transport)
	{
		console.log('transport.ls');
		if (!github_transport.have_refs) {
			console.log('transport.ls', "the transport has not yet loaded the refs");
			return -1;
		}
		Module.setValue(out, github_transport.struct_pack_i32(github_transport.refs), 'i32'); //TODO: LEAKS
		Module.setValue(size, github_transport.refs.length, 'i32');
		return 0; 
	},
	negotiate_fetch		: function(transport, repo, refs, count)
	{
		console.log('transport.negotiate_fetch');
		for(var i = 0; i < github_transport.refs.length; i++)
		{
			var git_object = Module._malloc(4);
			var refs_i_loid = github_transport.refs[i] + 4 + 20, refs_i_name = github_transport.refs[i] + 4 + 20 + 20;
			var error = git_revparse_single(git_object, repo, Module.getValue(refs_i_name, 'i32'));
			if (!error)
				git_oid_cpy(refs_i_loid, git_object_id(git_object));
			else if (error != git_error_code.GIT_ENOTFOUND)
			{
				console.log('transport.negotiate_fetch', 'error', error);
				return error;
			}
			else
				giterr_clear();
			
			git_object_free(git_object);
			Module._free(git_object);
		}
		return 0;
	},
	download_pack		: function(transport, repo, stats, progress_cb, progress_payload)
	{
		console.log('transport.download_pack');
		var odb = Module._malloc(4), oid = github_transport.struct_pack_i32(git_oid());
		console.log('open odb', git_repository_odb__weakptr(odb, repo));
		github_transport.github_revwalk(github_transport.url, function(object_type, object_id, body_ascii) {
			for(var i = 3; i >= 0; i--)
			{
				var body_fixed = body_ascii + Array(i + 1).join('\n');
				var data = Module._malloc(body_fixed.length);
				Module.writeAsciiToMemory(body_fixed, data, true);
				git_odb_write(oid, Module.getValue(odb, '*'), data, body_fixed.length, object_type == "commit" ? git_otype.GIT_OBJ_COMMIT : object_type == "tree" ? git_otype.GIT_OBJ_TREE : object_type == "blob" ? git_otype.GIT_OBJ_BLOB : object_type == "tag" ? git_otype.GIT_OBJ_TAG : git_otype.GIT_OBJ_ANY);
				Module._free(data);
				if(git_oid_tostr_s(oid) == object_id)
				{
					console.log(object_type, 'OK');
					console.log(body_ascii);
					break;
				}
			}
			if(git_oid_tostr_s(oid) != object_id)
			{
				console.log(object_type, 'original:', object_id, 'written:', git_oid_tostr_s(oid));
				console.log(body_ascii);
			}
		});
		
		Module._free(odb);
		Module._free(oid);
		return 0;
	},
	connect			: function(transport, url, cred_acquire_cb, cred_acquire_payload, proxy_opts, direction, flags)
	{
		console.log('transport.connect');
		github_transport.connected = 1;
		github_transport.flags = flags;
		github_transport.direction = direction;
		github_transport.url = Module.UTF8ToString(url);
		console.log('transport.connect', github_transport.url);
				
		var heads = github_transport.github_git_data(github_transport.url, 'ref', 'heads');
		// https://github.com/libgit2/libgit2/blob/master/src/transports/local.c#L95
		for(var i = 0; i < heads.length; i++)
		{
			var name_bytes = 1 + Module.lengthBytesUTF8(heads[i].ref);
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
			github_transport.refs.push(github_transport.struct_pack_i32([git_remote_head.local].concat(git_remote_head.oid).concat(git_remote_head.loid).concat([git_remote_head.name, git_remote_head.symref_target]))); //TODO: LEAKS
		}
		github_transport.have_refs = 1;
		return 0; 
	},
	read_flags		: function(transport, flags) { console.log('transport.read_flags'); Module.setValue(flags, github_transport.flags, 'i32'); return 0; },
	is_connected		: function(transport) { console.log('transport.is_connected'); return github_transport.connected; },
	push			: function(transport, push, callbacks) { console.log('transport.push', 'nop'); return 1; },
	set_callbacks		: function(transport, progress_cb, error_cb, certificate_check_cb, payload)
	{
		console.log('transport.set_callbacks');
		github_transport.progress_cb = progress_cb;
		github_transport.error_cb = error_cb;
		github_transport.certificate_check_cb = certificate_check_cb;
		return 0; 
	},
	set_custom_headers	: function(transport, custom_headers)
	{
		console.log('transport.set_custom_headers');
		var custom_headers_count = Module.getValue(custom_headers + 4, 'i32');
		var custom_headers_strings = Module.getValue(custom_headers, '*');
		github_transport.custom_headers = $.map(Array(custom_headers_count), function(_, i) { return Module.UTF8ToString(Module.getValue(custom_headers_strings + 4 * i, '*')); });
		return 0;
	},
	cancel			: function(transport) { console.log('transport.cancel', 'nop'); return 0; },
	close			: function(transport) { console.log('transport.close'); github_transport.connected = 0; return 0; },
	free			: function(transport) { console.log('transport.free'); github_transport.close(transport); },
	version 		: 1,
	connected		: 0,
	custom_headers		: [],
	certificate_check_cb	: null,
	error_cb		: null,
	progress_cb		: null,
	
	flags			: 0,
	direction		: 0,
	refs			: [],
	have_refs		: 0,
	git_transport_structure_pointer : null,
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
		github_transport.git_transport_struct_pointer = github_transport.git_transport_struct_pointer || github_transport.struct_pack_i32(
			[github_transport.version].concat($.map(
			[github_transport.set_callbacks, 
			 github_transport.set_custom_headers, 
			 github_transport.connect, 
			 github_transport.ls, 
			 github_transport.push, 
			 github_transport.negotiate_fetch, 
			 github_transport.download_pack, 
			 github_transport.is_connected, 
			 github_transport.read_flags, 
			 github_transport.cancel, 
			 github_transport.close, 
			 github_transport.free]
		, Runtime.addFunction))); //TODO: LEAKS
		Module.setValue(out, github_transport.git_transport_struct_pointer, 'i32');
		return 0;
	}),
	github_git_data : function(github_repo_url, object_type, object_id)
	{
		// access tokens are at https://github.com/settings/tokens
		var result = null;
		var params = (window.location.hash ? [{key : "access_token", value : window.location.hash.replace('#', '')}] : []).concat(object_type == 'tree' ? [{key : 'recursive', value : 1}] : []);
		var api_url = github_repo_url.replace('github://', 'https://').replace('github.com', 'api.github.com/repos') + '/git/' + object_type + 's/' + object_id + (params ? "?" + $.map(params, function(p) { return p.key + '=' + p.value; }).join("&") : "");
		//$.ajax(api_url, {async : true}).done(function(data) {result = data;});
		$.ajax(api_url, {async : false}).done(function(data) {result = data;});
		return result;
	},
	github_revwalk : function(github_repo_url, callback)
	{
		function utf16_to_utf8(str)
		{
			return unescape(encodeURIComponent(str));
		}
		
		function hex_to_ascii(hex_string)
		{
			return $.map(Array(hex_string.length / 2), function(_, i) {return String.fromCharCode(parseInt(hex_string.substr(2 * i, 2), 16));}).join('');
		}
		
		function format_person(person)
		{
			function safe(str) { return str.replace(/(?:^[\.,:;<>"']+|[\0\n<>]+|[\.,:;<>"']+$)/gm, ""); }
			function two(num) { return (num < 10 ? "0" : "") + num; }

			var date = new Date(Date.parse(person.date));
			var seconds =  date.getTime() / 1000;
			var offset = date.getTimezoneOffset();
			var neg = "+";
			if (offset <= 0)
				offset = -offset;
			else
				neg = "-";
			offset = neg + two(Math.floor(offset / 60)) + two(offset % 60);

			return safe(person.name) + " <" + safe(person.email) + "> " + seconds + " " + offset;
		}
		
		// https://github.com/creationix/js-github/blob/master/mixins/github-db.js
		// https://github.com/creationix/js-git/blob/master/lib/object-codec.js#L52
		// https://github.com/creationix/bodec/blob/master/bodec-browser.js#L145
		// http://stackoverflow.com/questions/14790681/what-is-the-internal-format-of-a-git-tree-object
		var object_stack = $.map(github_transport.github_git_data(github_repo_url, 'ref', 'heads').concat(
		//	github_transport.github_git_data(github_repo_url, 'ref', 'tags') || 
		[]), function(ref) { return {type : ref.object.type, id : ref.object.sha}; });
		var visited = {};
		while(object_stack.length > 0)
		{
			var object = object_stack.pop();
			if(visited[object.id])
				continue;
			visited[object.id] = true;
			var data = github_transport.github_git_data(github_repo_url, object.type, object.id);
			var body_ascii = "";
			switch(object.type)
			{
				case "commit":
					object_stack = object_stack.concat($.map(data.parents, function(commit) { return {type : "commit", id : commit.sha}; }));
					object_stack.push({type : "tree", id : data.tree.sha});
					body_ascii = utf16_to_utf8("tree " + data.tree.sha + ($.map(data.parents, function(commit) { return "\nparent " + commit.sha; }).join("") || "\n") + "\nauthor " + format_person(data.author) + "\ncommitter " + format_person(data.committer) + "\n\n" + data.message);
					break;
				case "tag":
					object_stack.push({type : data.object.type, id : data.object.sha});
					body_ascii = utf16_to_utf8("object " + data.object + "\ntype " + data.type + "\ntag " + data.tag + "\ntagger " + format_person(data.tagger) + "\n\n" + data.message);
					break;
				case "tree":
					//data.tree.sort(function(a, b) {return a.path < b.path ? -1 : a.path > b.path ? 1 : 0; });
					object_stack = object_stack.concat($.map($.grep(data.tree, function(tree_item) { return tree_item.mode != git_filemode_t.GIT_FILEMODE_COMMIT;}), function(tree_item) { return {type : tree_item.type, id : tree_item.sha}; }));
					body_ascii = $.map(data.tree, function(tree_item) { return tree_item.mode + " " + utf16_to_utf8(tree_item.path) + "\0" + hex_to_ascii(tree_item.sha); }).join("");
					break;
				case "blob":
					body_ascii = utf16_to_utf8(data.encoding == "base64" ? atob(data.content) : data.encoding == "utf-8" ? decodeURIComponent(data.content) : data.content);
					break;
			}
			if(object.type == "tree")
				callback(object.type, object.id, body_ascii);
		}
	}
};

Module['_main'] = function()
{
	console.log('init: ', git_libgit2_init());
	console.log('register: ', git_transport_register('github', github_transport.git_transport_cb, NULL));
	console.log('clone:', git_clone(Module._malloc(4), 'github://github.com/vadimkantorov/gittex', 'gittex', 0));
}

function gittex_eval(command)
{
	return "Command was: " + command;
}
