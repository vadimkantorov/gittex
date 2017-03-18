build/libjit2.js: build
	git clone https://github.com/libgit2/libgit2
	cmake libgit2 -DCMAKE_SIZEOF_VOID_P=4 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS=$'-s ASSERTIONS=1 -s SOCKET_DEBUG=1 -s RESERVED_FUNCTION_POINTERS=30 -s EXPORTED_FUNCTIONS="[\'_git_clone\', \'_git_libgit2_init\',\'_giterr_last\',\'_git_transport_register\',\'_git_revparse_single\',\'_git_object_id\',\'_git_oid_cpy\',\'_giterr_clear\',\'_git_repository_odb__weakptr\',\'_git_odb_write_pack\']" -O2' -DBUILD_CLAR=OFF -DUSE_SSH=OFF -DCURL=OFF -DUSE_OPENSSL=OFF
	cmake --build .
	"${EMSCRIPTEN_ROOT_PATH}/emcc" -s RESERVED_FUNCTION_POINTERS=30 -s ASSERTIONS=1 -s EXPORTED_FUNCTIONS="['_git_clone','_git_libgit2_init','_giterr_last','_git_transport_register','_git_revparse_single','_git_object_id','_git_oid_cpy','_giterr_clear','_git_repository_odb__weakptr','_git_odb_write_pack']" -O2 -s LINKABLE=1 -o libgit2.js libgit2.so -s SOCKET_DEBUG=1

build:
	mkdir -p build

clean:
	rm -rf build
