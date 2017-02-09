[ -d libgit2 ] || git clone https://github.com/libgit2/libgit2

cd libgit2
[ -d build ] && rm -rf build
mkdir -p build && cd build

export MAKEFLAGS=8

cat <<EOF > mytest.c
	#include <stdio.h>
	#include <git2.h>

	int main()
	{
		git_repository* repo = NULL;
		git_libgit2_init();
		if(0 != git_clone(&repo, "http://git.kernel.org/pub/scm/utils/dash/dash.git", "dash", NULL))
			printf("Error: %s\n", giterr_last()->message);
	}
EOF

function build_test_emscripten
{
	cmake .. -DCMAKE_SIZEOF_VOID_P=4 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS=$'-s ASSERTIONS=1 -s SOCKET_DEBUG=1 -s RESERVED_FUNCTION_POINTERS=30 -s EXPORTED_FUNCTIONS="[\'_git_clone\', \'_git_libgit2_init\',\'_giterr_last\',\'_git_transport_register\']" -O2' -DBUILD_CLAR=OFF -DUSE_SSH=OFF -DCURL=OFF -DUSE_OPENSSL=OFF
	cmake --build .
	"${EMSCRIPTEN_ROOT_PATH}/emcc" -s RESERVED_FUNCTION_POINTERS=30 -s ASSERTIONS=1 -s EXPORTED_FUNCTIONS="['_git_clone','_git_libgit2_init','_giterr_last','_git_transport_register']" -O2 -s LINKABLE=1 -o ../../libgit2.js libgit2.so -s SOCKET_DEBUG=1
	#"${EMSCRIPTEN_ROOT_PATH}/emcc" --bind ../../emscripten/libgit2bind.cpp -O2 -I../include -s LINKABLE=1 -o ../../libgit2.js libgit2.so
	#"${EMSCRIPTEN_ROOT_PATH}/emcc" -o mytest.js mytest.c -I../include libgit2.so -s SOCKET_DEBUG=1
	#nodejs ./mytest.js
}

function build_test_native
{
	cmake .. -DCMAKE_C_FLAGS=$'-O2' -DBUILD_CLAR=OFF -DUSE_SSH=OFF -DCURL=OFF -DUSE_OPENSSL=OFF
	cmake --build .
	gcc -o mytest mytest.c -I../include -lgit2
	./mytest
}

build_test_emscripten
