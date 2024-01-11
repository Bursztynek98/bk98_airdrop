do
  local baseEvent = 'BK98_AIRDROP'
  local propEvent = 'PROP_EVENT_NAME'
  local aircraftEvent = 'AIRCRAFT_EVENT_NAME'

  -- Example for add Blip for aircraft
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
