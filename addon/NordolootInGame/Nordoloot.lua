-- Nordoloot: announces projected winners (from the Nordoloot app's "Addon" export)
-- in Raid Warning when boss loot is opened.
-- /ndl          - open the import window (paste the export string, click Import)
-- /ndl on|off   - toggle announcements
-- /ndl clear    - wipe imported data
-- /ndl status   - show what's loaded
-- /ndl test [n] - fake n random drops (default 3), printed only to you
-- /ndl testlive - same, but through the real raid-warning path

local ADDON = ...
NordolootDB = NordolootDB or nil

local announced = {}   -- item key -> true, per session, so reopening loot doesn't respam
local enabled = true

local function msgOut(text)
  DEFAULT_CHAT_FRAME:AddMessage("|cfffbbf24Nordoloot:|r " .. text)
end

local function announce(text)
  if #text > 255 then text = text:sub(1, 252) .. "..." end
  if IsInRaid() then
    if UnitIsGroupLeader("player") or UnitIsGroupAssistant("player") then
      SendChatMessage(text, "RAID_WARNING")
    else
      SendChatMessage(text, "RAID")
    end
  elseif IsInGroup() then
    SendChatMessage(text, "PARTY")
  else
    msgOut(text)
  end
end

local function parseImport(text)
  -- the client escapes "|" as "||" inside editboxes; undo that before parsing
  text = text:gsub("||", "|")
  local items, byName, n = {}, {}, 0
  local firstBad
  for line in text:gmatch("[^\r\n]+") do
    if line ~= "NDL1" and line ~= "NDL2" then
      local id, name, display = line:match("^(%d+)~([^~]+)~(.+)$")
      if not id then id, name, display = line:match("^(%d+)|([^|]+)|(.+)$") end
      if id and name and display then
        id = tonumber(id)
        local entry = { name = name, display = display, id = (id and id > 0) and id or nil }
        if entry.id then items[entry.id] = entry end
        byName[name] = entry
        n = n + 1
      elseif not firstBad then
        firstBad = line:sub(1, 60)
      end
    end
  end
  if n == 0 then
    if firstBad then msgOut("could not parse: \"" .. firstBad .. "\"") end
    return nil
  end
  return { items = items, byName = byName, count = n, imported = date("%b %d %H:%M") }
end

-- swap the leading item name for a clickable link when one is available
local function displayWithLink(entry, link)
  if not link and entry.id then link = select(2, GetItemInfo(entry.id)) end
  if link and entry.display:sub(1, #entry.name) == entry.name then
    return link .. entry.display:sub(#entry.name + 1)
  end
  return entry.display
end

local function onLootOpened()
  if not enabled or not NordolootDB then return end
  for slot = 1, GetNumLootItems() do
    local link = GetLootSlotLink(slot)
    if link then
      local id = tonumber(link:match("item:(%d+)"))
      local entry = id and NordolootDB.items[id]
      if not entry then
        local _, lootName = GetLootSlotInfo(slot)
        entry = lootName and NordolootDB.byName[lootName]
      end
      if entry and not announced[entry.name] then
        announced[entry.name] = true
        announce(displayWithLink(entry, link))
      end
    end
  end
end

-- fake drops from the imported pool; never touches the announced-set, so a tested
-- item still announces for real when it actually drops
local function testDrops(n, live)
  if not NordolootDB then msgOut("no data - /ndl to import first") return end
  local pool = {}
  for _, entry in pairs(NordolootDB.byName) do pool[#pool + 1] = entry end
  if #pool == 0 then msgOut("import is empty") return end
  n = math.min(n or 3, #pool)
  msgOut("simulating " .. n .. " drop" .. (n == 1 and "" or "s") .. (live and " (LIVE - real announce path)" or " (local only)"))
  for i = 1, n do
    local pick = table.remove(pool, math.random(#pool))
    local text = displayWithLink(pick, nil)
    if live then announce(text) else msgOut("|cff56c8ea[test]|r " .. text) end
  end
end

-- ── import window ──
local frame
local function showImport()
  if frame then frame:Show() return end
  frame = CreateFrame("Frame", "NordolootImportFrame", UIParent, BackdropTemplateMixin and "BackdropTemplate" or nil)
  frame:SetSize(460, 320)
  frame:SetPoint("CENTER")
  frame:SetFrameStrata("DIALOG")
  frame:SetMovable(true)
  frame:EnableMouse(true)
  frame:RegisterForDrag("LeftButton")
  frame:SetScript("OnDragStart", frame.StartMoving)
  frame:SetScript("OnDragStop", frame.StopMovingOrSizing)
  if frame.SetBackdrop then
    frame:SetBackdrop({ bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
      edgeFile = "Interface\\DialogFrame\\UI-DialogBox-Border", tile = true, tileSize = 32, edgeSize = 32,
      insets = { left = 8, right = 8, top = 8, bottom = 8 } })
  end

  local title = frame:CreateFontString(nil, "OVERLAY", "GameFontNormal")
  title:SetPoint("TOP", 0, -14)
  title:SetText("Nordoloot import - paste the Addon export, then click Import")

  local scroll = CreateFrame("ScrollFrame", "NordolootImportScroll", frame, "UIPanelScrollFrameTemplate")
  scroll:SetPoint("TOPLEFT", 16, -36)
  scroll:SetPoint("BOTTOMRIGHT", -34, 48)

  local edit = CreateFrame("EditBox", "NordolootImportEdit", scroll)
  edit:SetMultiLine(true)
  edit:SetAutoFocus(true)
  edit:SetFontObject(ChatFontNormal)
  edit:SetWidth(400)
  edit:SetScript("OnEscapePressed", function() frame:Hide() end)
  scroll:SetScrollChild(edit)
  frame.edit = edit

  local ok = CreateFrame("Button", nil, frame, "GameMenuButtonTemplate")
  ok:SetSize(110, 24)
  ok:SetPoint("BOTTOMRIGHT", -16, 14)
  ok:SetText("Import")
  ok:SetScript("OnClick", function()
    local parsed = parseImport(edit:GetText() or "")
    if parsed then
      NordolootDB = parsed
      announced = {}
      msgOut(parsed.count .. " items imported.")
      frame:Hide()
    else
      msgOut("nothing parsed - paste the full Addon export from the app (starts with NDL1).")
    end
  end)

  local cancel = CreateFrame("Button", nil, frame, "GameMenuButtonTemplate")
  cancel:SetSize(110, 24)
  cancel:SetPoint("RIGHT", ok, "LEFT", -8, 0)
  cancel:SetText("Cancel")
  cancel:SetScript("OnClick", function() frame:Hide() end)

  frame:Show()
end

-- ── events / slash ──
local ev = CreateFrame("Frame")
ev:RegisterEvent("LOOT_OPENED")
ev:SetScript("OnEvent", function(_, event) if event == "LOOT_OPENED" then onLootOpened() end end)

SLASH_NORDOLOOT1 = "/ndl"
SLASH_NORDOLOOT2 = "/nordoloot"
SlashCmdList["NORDOLOOT"] = function(arg)
  arg = (arg or ""):lower():gsub("^%s+", ""):gsub("%s+$", "")
  local tn = arg:match("^test%s+(%d+)$")
  if arg == "test" or tn then testDrops(tonumber(tn), false)
  elseif arg == "testlive" then testDrops(3, true)
  elseif arg == "on" then enabled = true; msgOut("announcements ON")
  elseif arg == "off" then enabled = false; msgOut("announcements OFF")
  elseif arg == "clear" then NordolootDB = nil; announced = {}; msgOut("data cleared")
  elseif arg == "status" then
    if NordolootDB then msgOut(NordolootDB.count .. " items loaded (imported " .. (NordolootDB.imported or "?") .. "), announcements " .. (enabled and "ON" or "OFF"))
    else msgOut("no data - /ndl to import") end
  else showImport() end
end

msgOut("loaded - /ndl to import, /ndl status to check")
