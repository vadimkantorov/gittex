space := $(subst ,, )
comma := ,

LIBGIT2_EXPORTED_FUNCTIONS = git_clone git_libgit2_init giterr_last git_transport_register git_revparse_single git_object_id git_oid_cpy giterr_clear git_repository_odb__weakptr git_odb_write_pack
LIBGIT2_EMCC_FLAGS = -O2 -s ASSERTIONS=1 -s RESERVED_FUNCTION_POINTERS=30 -s EXPORTED_FUNCTIONS=[\'_$(subst $(space),\'$(comma)\'_,$(LIBGIT2_EXPORTED_FUNCTIONS))\'] -Wno-incompatible-pointer-types -Wno-shift-negative-value -Wno-format

build/libjit2.js:
	mkdir -p build && cd build && \
	git clone https://github.com/libgit2/libgit2 --depth=1 && \
	cmake libgit2 -DCMAKE_SIZEOF_VOID_P=4 -DBUILD_CLAR=OFF -DUSE_SSH=OFF -DCURL=OFF -DUSE_OPENSSL=OFF -DHAVE_QSORT_S=0 -DHAVE_QSORT_R=0 -DCMAKE_C_COMPILER="${EMSCRIPTEN_ROOT_PATH}/emcc" -DCMAKE_AR="${EMSCRIPTEN_ROOT_PATH}/emar" -DCMAKE_RANLIB="${EMSCRIPTEN_ROOT_PATH}/emranlib" -DCMAKE_C_FLAGS="$(LIBGIT2_EMCC_FLAGS)" && \
	cmake --build . && \
	"${EMSCRIPTEN_ROOT_PATH}/emcc" -o libgit2.js libgit2.so -s LINKABLE=1 $(LIBGIT2_EMCC_FLAGS)

clean:
	rm -rf build
