source "https://rubygems.org"
# Hello! This is where you manage which Jekyll version is used to run.
# When you want to use a different version, change it below, save the
# file and run `bundle install`. Run Jekyll with `bundle exec`, like so:
#
#     bundle exec jekyll serve
#
# This will help ensure the proper Jekyll version is running.
# Happy Jekylling!
# gem "jekyll", "~> 4.3.2"
gem "github-pages", group: :jekyll_plugins # Manages Jekyll and plugins for GitHub Pages
# This is the default theme for new Jekyll sites. You may change this to anything you like.
gem "minima" # Theme, version managed by github-pages
# If you want to use GitHub Pages, remove the "gem "jekyll"" above and
# uncomment the line below. To upgrade, run `bundle update github-pages`.
# gem "github-pages", group: :jekyll_plugins
# If you have any plugins, put them here!
group :jekyll_plugins do
  gem "jekyll-feed" # RSS feed, version managed by github-pages
  gem "jekyll-seo-tag" # SEO tags, version managed by github-pages
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo" # Needed for Windows
  gem "tzinfo-data" # Needed for Windows
end

# Performance-booster for watching directories on Windows
gem "wdm", :platforms => [:mingw, :x64_mingw, :mswin] # Optional, speeds up file watching on Windows

# The following gem is only needed for JRuby (not Windows). Commented out for your setup:
# gem "http_parser.rb", "~> 0.6.0", :platforms => [:jruby]

gem "webrick" # Required for Ruby 3+ to serve Jekyll locally

 gem "faraday-retry"
 gem "fiddle"