# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = '1.0'

# Add additional assets to the asset load path
# Rails.application.config.assets.paths << Emoji.images_path

# Precompile additional assets.
# application.js, application.css, and all non-JS/CSS in app/assets folder are already added.
Rails.application.config.assets.precompile += %w(
  lib/bootstrap.min.js
  lib/bootstrap-button.js
  workspace/wavesurfer.js
  workspace/webaudio.js
  workspace/drawer.js
  workspace/scheduler.js
  workspace/storage.js
  workspace/jquery.knob.js
  workspace/recorder.js
  workspace/effects.js
  workspace/main.js
  workspace/vumeter.js
)
