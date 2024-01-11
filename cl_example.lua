local baseEvent = 'BK98_AIRDROP'
local propEvent = 'PROP_EVENT_NAME'
local aircraftEvent = 'AIRCRAFT_EVENT_NAME'

-- Example for add ox_target for airDrop
do
  local propCahe = {}

  -- Create Target when airDrop (prop) is span and place on ground
  function CreateTarget(data)
    if (not data.realFinish) then
      return
    end
    if (propCahe[data.id]) then
      return
    end
    if (not data.object) then
      return
    end
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData

    propCahe[data.id] = data.object
    print('Add Target ' .. data.id)
    -- exports.ox_target:addLocalEntity(data.object, {
    --   label = 'Open AirDrop',
    --   name = data.id,
    --   -- ADD EVENT FOR OPEN INVENTORY
    -- })
  end

  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'SPAWN', CreateTarget)
  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'UPDATE_POSITION', CreateTarget)


  -- Remove Target when airDrop (prop) is delete from map (Player is outside the visible area)
  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'DELETE', function(data)
    if (not propCahe[data.id]) then
      return
    end
    print('Remove Target ' .. data.id)
    --exports.ox_target:removeLocalEntity(propCahe[data.id])
    propCahe[data.id] = nil
  end)
end
-- Example for add Blip for aircraft
do
  local aircraftCache = {}

  function CreateBlip(data)
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData
    local cord = data.cord
    local blip = aircraftCache[data.id] or AddBlipForCoord(cord[1], cord[2], cord[3])
    BeginTextCommandSetBlipName('STRING');
    AddTextComponentSubstringPlayerName('AirDrop:' .. data.id);
    EndTextCommandSetBlipName(blip);
    SetBlipCoords(blip, cord[1], cord[2], cord[3])
    aircraftCache[data.id] = blip
  end

  AddEventHandler(baseEvent .. ":" .. aircraftEvent .. ":" .. 'UPDATE_POSITION', CreateBlip)

  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'DELETE', function(data)
    if (not aircraftCache[data.id]) then
      return
    end
    RemoveBlip(aircraftCache[data.id])
    aircraftCache[data.id] = nil
  end)
end
-- Example notyfication when aircraft start fly
do
  AddEventHandler(baseEvent .. ":" .. aircraftEvent .. ":" .. 'START', function(data)
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('AirDrop (aircraft):' .. data.id .. ' Created')
    EndTextCommandThefeedPostTicker(true, true)
  end)
end

-- Example notyfication when Prop start fly to ground
do
  AddEventHandler(baseEvent .. ":" .. aircraftEvent .. ":" .. 'START', function(data)
    -- By metadata you can add option to open airDrop for only specificated job
    -- data.metaData
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('AirDrop (prop):' .. data.id .. ' Created')
    EndTextCommandThefeedPostTicker(true, true)
  end)
end
