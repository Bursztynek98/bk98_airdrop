do
  local baseEvent = 'BK98_AIRDROP'
  local propEvent = 'PROP_EVENT_NAME'
  local aircraftEvent = 'AIRCRAFT_EVENT_NAME'

  --- Example notyfication when Prop start fly to ground
  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'START', function(data)
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('AirDrop (prop):' .. data.id .. ' Created')
    EndTextCommandThefeedPostTicker(true, true)
  end)

  -- Example notyfication when aircraft start fly
  AddEventHandler(baseEvent .. ":" .. aircraftEvent .. ":" .. 'START', function(data)
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('AirDrop (aircraft):' .. data.id .. ' Created')
    EndTextCommandThefeedPostTicker(true, true)
  end)
end
