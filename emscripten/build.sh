set -e

cd libgit2
[ -d build ] && rm -rf build
mkdir -p build && cd build

cmake .. -DCMAKE_SIZEOF_VOID_P=4 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS=$'-s EXPORTED_FUNCTIONS="[\'_git_clone\', \'_git_libgit2_init\']" -O2'
MAKEFLAGS=8 cmake --build .
"${EMSCRIPTEN_ROOT_PATH}/emcc" -s EXPORTED_FUNCTIONS="['_git_clone','_git_libgit2_init']" -O2 -s LINKABLE=1 -o ../../libgit2.js libgit2.so
