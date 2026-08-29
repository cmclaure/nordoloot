-- Nordoloot: announces projected winners (from the Nordoloot app's "Addon" export)
-- in Raid Warning when boss loot is opened.
-- /ndl        - open the import window (paste the export string, click Import)
-- /ndl on|off - toggle announcements
-- /ndl clear  - wipe imported data
-- /ndl status - show what's loaded

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
  local items, byName, n = {}, {}, 0
  for line in text:gmatch("[^\r\n]+") do
    if line ~= "NDL1" then
      local id, name, display = line:match("^(%d+)|([^|]+)|(.+)$")
      if id and name and display then
        id = tonumber(id)
        local entry = { name = name, display = display }
        if id and id > 0 then items[id] = entry end
        byName[name] = entry
        n = n + 1
      end
    end
  end
  if n == 0 then return nil end
  return { items = items, byName = byName, count = n, imported = date("%b %d %H:%M") }
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
        announce(entry.display)
      end
    end
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
  if arg == "on" then enabled = true; msgOut("announcements ON")
  elseif arg == "off" then enabled = false; msgOut("announcements OFF")
  elseif arg == "clear" then NordolootDB = nil; announced = {}; msgOut("data cleared")
  elseif arg == "status" then
    if NordolootDB then msgOut(NordolootDB.count .. " items loaded (imported " .. (NordolootDB.imported or "?") .. "), announcements " .. (enabled and "ON" or "OFF"))
    else msgOut("no data - /ndl to import") end
  else showImport() end
end

msgOut("loaded - /ndl to import, /ndl status to check")
