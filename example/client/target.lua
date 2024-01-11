do
  local baseEvent = 'BK98_AIRDROP'
  local propEvent = 'PROP_EVENT_NAME'


  -- Example for add ox_target for airDrop

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
    if (not data.metaData.stash) then
      return
    end

    propCahe[data.id] = data.object
    print('Add Target ' .. data.id)

    exports.ox_target:addLocalEntity(data.object, {
      label = 'Open AirDrop',
      name = data.id,
      onSelect = function()
        ox_inventory:openInventory('stash', data.metaData.stash)
      end
    })
  end

  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'SPAWN', CreateTarget)
  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'UPDATE_POSITION', CreateTarget)


  -- Remove Target when airDrop (prop) is delete from map (Player is outside the visible area)
  AddEventHandler(baseEvent .. ":" .. propEvent .. ":" .. 'DELETE', function(data)
    if (not propCahe[data.id]) then
      return
    end
    print('Remove Target ' .. data.id)
    exports.ox_target:removeLocalEntity(propCahe[data.id])
    propCahe[data.id] = nil
  end)
end
