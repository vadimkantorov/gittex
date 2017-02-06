#include <git2.h>
#include <git2/sys/transport.h>
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(libgit2)
{
  function("git_clone", &git_clone, allow_raw_pointers());
  function("git_libgit2_init", &git_libgit2_init, allow_raw_pointers());
  function("giterr_last", &giterr_last, allow_raw_pointers());
  function("git_transport_register", &git_transport_register, allow_raw_pointers());
  
  value_object<git_transport>("git_transport")
    .field("version", &git_transport::version);
}
