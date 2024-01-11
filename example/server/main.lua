RegisterCommand("AirDrop", function()
  -- Create AirDrop
  local id = exports.bk98_airdrop:ADD_DROP(
  -- cord X, Y
    { 0.0, 0.0 },
    -- aircraft
    {
      model = 'cuban800',
      --visibleRadius?: number;
      --pilotModel?: string | number;
    },
    -- prop
    {
      model = 'prop_drop_armscrate_01b',
      --visibleRadius?: number;
      --speed?: number;
      --disappearTime?: number;
      --z?: number;
    },
    -- metaData, any data
    { meta = 'hello world' }

  -- Distance to spawn AirCraft
  --distance = 6000,
  -- Height of fly AirCraft
  --height = 300.0,
  -- Spawn heading (what position the plane is supposed to come from)
  --heading?: number,

  )
  print('Air drop spawn with ID: ' .. id)
end, false)
