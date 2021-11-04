local ENTRYFOUND_IGNOREREQUEST = "ENTRYFOUND_IGNOREREQUEST"
local ENTRYNOTFOUND_NOUSER_RELEASE = "ENTRYNOTFOUND_NOUSER_RELEASE"
local ENTRYNOTFOUND_USERS_REQUEST = "ENTRYNOTFOUND_USERS_REQUEST"

local bufferReadys_buffererId = KEYS[1]
local roomHolders_roomId = KEYS[2]
local roomSockets_roomId = KEYS[3]
local roomId = ARGV[1]

local isEntryFound = redis.call("exists", bufferReadys_buffererId)

if isEntryFound == 1 then
    return ENTRYFOUND_IGNOREREQUEST
else
    local numOfSockets = redis.call("scard", roomSockets_roomId)
    local numOfUsers = numOfSockets - 1

    if numOfUsers <= 0 then
        redis.call("del", bufferReadys_buffererId)
        redis.call("del", roomHolders_roomId)
        return ENTRYNOTFOUND_NOUSER_RELEASE
    else
        local newEntry = {
            ["roomId"] = roomId,
            ["readys"] = {},
            ["target"] = numOfUsers
        }
        local newEntryStr = cjson.encode(newEntry)
        redis.call("set", bufferReadys_buffererId, newEntryStr)
        return ENTRYNOTFOUND_USERS_REQUEST
    end
end