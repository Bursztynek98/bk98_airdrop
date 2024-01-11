---@diagnostic disable: undefined-global

fx_version 'bodacious'
game 'gta5'

author 'You'
version '1.0.0'

fxdk_watch_command 'yarn' { 'watch' }
fxdk_build_command 'yarn' { 'build' }

client_scripts {
  'dist/client.js',
  'cl_example.lua'
}
server_scripts {
  'dist/server.js',
  'sv_example.lua'
}
