set -e

cd libgit2
[ -d build ] && rm -rf build
mkdir -p build && cd build

cmake .. -DCMAKE_SIZEOF_VOID_P=8 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS=-O2
cmake --build .
"${EMSCRIPTEN_ROOT_PATH}/emcc" -s LINKABLE=1 -O2 -o emscripten/libgit2.js libgit2.so
