---@diagnostic disable: undefined-global

fx_version 'bodacious'
game 'gta5'

author 'You'
version '1.0.0'

fxdk_watch_command 'yarn' { 'watch' }
fxdk_build_command 'yarn' { 'build' }

client_scripts {
  'dist/client.js',
  'example/client/notification.lua',
  'example/client/target.lua',
  'example/client/blip.lua'
}
server_scripts {
  'dist/server.js',
  'example/server/main.lua'
}
