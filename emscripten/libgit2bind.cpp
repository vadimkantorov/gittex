#include <git2.h>
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(libgit2)
{
  function("git_clone", &git_clone);
  function("git_libgit2_init", &git_libgit2_init);
  function("giterr_last", &giterr_last);
  function("git_transport_register", &git_transport_register);
  
  //value_object<git_transport>("git_transport");
}
