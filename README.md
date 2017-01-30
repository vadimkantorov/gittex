# gittex

A repo for building a git-savvy LaTeX editor running in browser. Workflow:

1. Pull a git repo
2. Edit LaTeX files in browser
3. Check a PDF preview
3. Edit commit message
4. Push back updates
5. Publish the produced PDF as GitHub release

# Plan
- [x] jquery.terminal
- [x] build emscripten
- [x] port libgit2.js build scripts, build libgit2
- [ ] git clone
  - https://github.com/kripken/emscripten/issues/4902
- [ ] git commit
- [ ] git push
- [ ] vim.js
- [ ] texlive.js
- [ ] pdf.js
- [ ] publish pdf as github release
- [ ] file explorer | visual text editor with syntax highlighting | pdf preview + terminal (at bottom)
- [ ] git merge

# Links
- http://kripken.github.io/emscripten-site/docs/building_from_source/building_emscripten_from_source_on_linux.html
- https://github.com/zodiac/libgit2.js
- https://github.com/coolwanglu/vim.js
- https://github.com/manuels/texlive.js/
- https://github.com/github-tools/github
- https://github.com/jcubic/jquery.terminal
- https://github.com/libgit2/libgit2sharp/wiki/git-push
- http://ben.straub.cc/2013/02/01/stupid-libgit2-tricks-cloning/
