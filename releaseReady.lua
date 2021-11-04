local ENTRYFOUND_REACHED = "ENTRYFOUND_REACHED"
local ENTRYFOUND_INSUFFICIENT = "ENTRYFOUND_INSUFFICIENT"
local ENTRYNOTFOUND_HELD_USER = "ENTRYNOTFOUND_HELD_USER"
local ENTRYNOTFOUND_HELD_MULTIUSER = "ENTRYNOTFOUND_HELD_MULTIUSER"

local bufferReadys_buffererId = KEYS[1]
local roomHolders_roomId = KEYS[2]
local roomSockets_roomId = KEYS[3]
local roomId = ARGV[1]
local socketId = ARGV[2]

local isEntryFound = redis.call("exists", bufferReadys_buffererId)

if isEntryFound == 1 then
    local entryStr = redis.call("get", bufferReadys_buffererId)
    local entry = cjson.decode(entryStr)
    local newEntry = entry
    table.insert(newEntry.readys, socketId) 

    if #newEntry.readys >= newEntry.target then -- # of readys has reached target
        redis.call("del", bufferReadys_buffererId)
        redis.call("del", roomHolders_roomId)
        return ENTRYFOUND_REACHED;
    else -- Insufficient # of readys
        local newEntryStr = cjson.encode(newEntry)
        redis.call("set", bufferReadys_buffererId, newEntryStr)
        return ENTRYFOUND_INSUFFICIENT
    end
else
    local isRoomHeld = redis.call("exists", roomHolders_roomId)

    if isRoomHeld == 1 then
        local numOfSockets = redis.call("scard", roomSockets_roomId)
        local numOfUsers = numOfSockets - 1
        
        if numOfUsers == 1 then
            redis.call("del", roomHolders_roomId)
            return ENTRYNOTFOUND_HELD_USER
        else
            local newEntry = {
                ["roomId"] = roomId,
                ["readys"] = {socketId},
                ["target"] = numOfUsers
            }
            local newEntryStr = cjson.encode(newEntry)
            redis.call("set", bufferReadys_buffererId, newEntryStr)
            return ENTRYNOTFOUND_HELD_MULTIUSER
        end
    end
end

return results