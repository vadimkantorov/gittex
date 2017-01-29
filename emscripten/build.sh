set -e
cd libgit2
rm -rf build
mkdir -p build && cd build
cmake .. -DCMAKE_SIZEOF_VOID_P=8 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS=-O2
cmake --build .
"${EMSCRIPTEN_ROOT_PATH}/emcc" -s LINKABLE=1 -o libgit.js libgit2.so
